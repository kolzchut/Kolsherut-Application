"""Data pipeline: Airtable → denormalized card_data DataFrame.

Replaces derive/to_dp.py (946 lines of dataflows) with pandas operations.
No intermediate disk dumps — all transformations are in-memory.

Entry point:
    from operators.derive_es.to_dp import to_dp
    card_data: pd.DataFrame = to_dp()

Pipeline stages:
    1. load_all_tables()       — 6 AT tables as DataFrames
    2. preprocess_*()          — filter, clean, rename
    3. flat_branches()         — branches ← locations ← orgs + dedup
    4. flat_services()         — services ← branches + dedup
    5. flat_table()            — join branches + services
    6. card_data_assembly()    — taxonomy, scoring, computed fields
"""
import math
import re
from itertools import chain
from typing import Optional

import numpy as np
import pandas as pd
from thefuzz import fuzz

from conf import settings
from extract.extract_data_from_airtable import load_airtable_as_dataframe
from srm_tools.hash import hasher
from srm_tools.logger import logger
from srm_tools.data_cleaning import clean_org_name

from operators.derive_es.helpers import (
    AIRTABLE_ID_FIELD,
    ACCURATE_TYPES,
    address_parts,
    calc_point_id,
    calculate_branch_short_name,
    most_common_category,
    org_name_parts,
    remove_whitespaces,
    transform_phone_numbers,
    transform_urls,
    update_taxonomy_with_parents,
    validate_address,
    validate_geometry,
    card_score,
)


# ── Constants ──────────────────────────────────────────────────────────

IGNORE_SITUATIONS = frozenset()  # populated at autocomplete stage; not needed for to_dp


# ── AT Data Pull ───────────────────────────────────────────────────────

def _load_table(table_name: str, base_id: Optional[str] = None) -> pd.DataFrame:
    """Load a single AT table using the shared extract utility."""
    base = base_id or settings.AIRTABLE_BASE
    return load_airtable_as_dataframe(
        table_name=table_name,
        base_id=base,
        view=settings.AIRTABLE_VIEW,
    )


def load_all_tables() -> dict:
    """Load the 6 core AT tables into a dict of DataFrames."""
    tables = {
        'responses':     _load_table(settings.AIRTABLE_RESPONSE_TABLE),
        'situations':    _load_table(settings.AIRTABLE_SITUATION_TABLE),
        'organizations': _load_table(settings.AIRTABLE_ORGANIZATION_TABLE),
        'locations':     _load_table(settings.AIRTABLE_LOCATION_TABLE),
        'branches':      _load_table(settings.AIRTABLE_BRANCH_TABLE),
        'services':      _load_table(settings.AIRTABLE_SERVICE_TABLE),
    }
    for name, df in tables.items():
        # Replace NaN with None in object (string/list) columns to avoid
        # float-NaN type errors in string operations throughout the pipeline.
        # Numeric columns keep NaN for proper pandas numeric handling.
        obj_cols = df.select_dtypes(include=['object']).columns
        if len(obj_cols):
            df[obj_cols] = df[obj_cols].where(df[obj_cols].notna(), None)
        tables[name] = df
        logger.info('Loaded %s: %d rows', name, len(df))
    return tables


# ── Preprocessing ──────────────────────────────────────────────────────

def _filter_dummy(df: pd.DataFrame) -> pd.DataFrame:
    """Remove rows where id or name == 'dummy'."""
    mask = ~((df.get('id', pd.Series(dtype=str)) == 'dummy') |
             (df.get('name', pd.Series(dtype=str)) == 'dummy'))
    return df[mask].reset_index(drop=True)


def _filter_active(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only rows with status == 'ACTIVE' (case-insensitive)."""
    if 'status' not in df.columns:
        return df
    mask = df['status'].fillna('').str.strip().str.upper() == 'ACTIVE'
    return df[mask].reset_index(drop=True)


def _set_key(df: pd.DataFrame) -> pd.DataFrame:
    """Rename _airtable_id → key (staging primary key convention)."""
    if AIRTABLE_ID_FIELD in df.columns:
        df = df.rename(columns={AIRTABLE_ID_FIELD: 'key'})
    return df


def _parse_synonyms(val):
    """Split newline-separated synonyms into a tuple."""
    if isinstance(val, str) and val.strip():
        return tuple(val.strip().split('\n'))
    return tuple()


def _parse_data_sources(val):
    """Split newline-separated data sources into a list."""
    if isinstance(val, str) and val.strip():
        return val.split('\n')
    return []


def preprocess_responses(df: pd.DataFrame) -> pd.DataFrame:
    df = _filter_dummy(df)
    df = _filter_active(df)
    df = _set_key(df)
    df['synonyms'] = df['synonyms'].apply(_parse_synonyms) if 'synonyms' in df.columns else None
    return df


def preprocess_situations(df: pd.DataFrame) -> pd.DataFrame:
    df = _filter_dummy(df)
    df = _filter_active(df)
    df = _set_key(df)
    df['synonyms'] = df['synonyms'].apply(_parse_synonyms) if 'synonyms' in df.columns else None
    return df


def preprocess_services(df: pd.DataFrame) -> pd.DataFrame:
    df = _filter_dummy(df)
    df = _filter_active(df)
    df = _set_key(df)
    if 'urls' in df.columns:
        df['urls'] = df['urls'].apply(transform_urls)
    if 'name_manual' in df.columns:
        df['name'] = df.apply(
            lambda r: r['name_manual'] if pd.notna(r.get('name_manual')) and r['name_manual'] else r.get('name', ''),
            axis=1,
        )
    if 'situations_manual_ids' in df.columns and 'situation_ids' in df.columns:
        df['situation_ids'] = df.apply(
            lambda r: r['situations_manual_ids'] if r.get('situations_manual_ids') else r.get('situation_ids'),
            axis=1,
        )
    if 'responses_manual_ids' in df.columns and 'response_ids' in df.columns:
        df['response_ids'] = df.apply(
            lambda r: r['responses_manual_ids'] if r.get('responses_manual_ids') else r.get('response_ids'),
            axis=1,
        )
    if 'boost' in df.columns:
        df['boost'] = pd.to_numeric(df['boost'], errors='coerce').fillna(0)
    if 'phone_numbers' in df.columns:
        df['phone_numbers'] = df['phone_numbers'].apply(transform_phone_numbers)
    if 'data_sources' in df.columns:
        df['data_sources'] = df['data_sources'].apply(_parse_data_sources)
    # Drop manual override columns
    for col in ('situations_manual', 'responses_manual', 'name_manual', 'responses_manual_ids'):
        if col in df.columns:
            df = df.drop(columns=[col])
    return df


def preprocess_organizations(df: pd.DataFrame) -> pd.DataFrame:
    df = _filter_dummy(df)
    df = _filter_active(df)
    # Filter no-name orgs
    if 'name' in df.columns:
        df = df[df['name'].fillna('').str.strip().astype(bool)].reset_index(drop=True)
    df = _set_key(df)
    if 'urls' in df.columns:
        df['urls'] = df['urls'].apply(transform_urls)
    if 'phone_numbers' in df.columns:
        df['phone_numbers'] = df['phone_numbers'].apply(transform_phone_numbers)
    if 'name' in df.columns:
        df['name'] = df['name'].apply(remove_whitespaces)
    if 'short_name' in df.columns:
        df['short_name'] = df['short_name'].apply(remove_whitespaces)
    return df


def preprocess_branches(df: pd.DataFrame) -> pd.DataFrame:
    select_fields = [
        'key', 'id', 'source', 'status', 'name', 'organization', 'operating_unit',
        'location', 'address', 'address_details', 'description', 'phone_numbers',
        'email_address', 'urls', 'manual_url', 'fixes', 'situations', 'services',
        'last_modified',
    ]
    df = _filter_dummy(df)
    df = _filter_active(df)
    df = _set_key(df)
    # Keep only columns that exist
    existing = [c for c in select_fields if c in df.columns]
    df = df[existing].copy()
    if 'urls' in df.columns:
        df['urls'] = df['urls'].apply(transform_urls)
    if 'phone_numbers' in df.columns:
        df['phone_numbers'] = df['phone_numbers'].apply(transform_phone_numbers)
    if 'name' in df.columns:
        df['name'] = df['name'].apply(remove_whitespaces)
    return df


def preprocess_locations(df: pd.DataFrame) -> pd.DataFrame:
    select_fields = [
        'key', 'id', 'status', 'provider', 'accuracy', 'alternate_address',
        'resolved_lat', 'resolved_lon', 'resolved_address', 'resolved_city',
        'fixed_lat', 'fixed_lon',
    ]
    df = _filter_dummy(df)
    df = _set_key(df)
    existing = [c for c in select_fields if c in df.columns]
    df = df[existing].copy()

    # National service flag
    df['national_service'] = df['accuracy'].fillna('') == 'NATIONAL_SERVICE'

    # Filter: must have resolved OR fixed coords OR national service
    has_resolved = df['resolved_lat'].notna() & df['resolved_lon'].notna()
    has_fixed = df.get('fixed_lat', pd.Series(dtype=float)).notna() & df.get('fixed_lon', pd.Series(dtype=float)).notna()
    mask = has_resolved | has_fixed | df['national_service']
    df = df[mask].reset_index(drop=True)

    # Location accurate
    df['location_accurate'] = (
        df['accuracy'].isin(ACCURATE_TYPES) |
        (df.get('fixed_lat', pd.Series(dtype=float)).notna() & df.get('fixed_lon', pd.Series(dtype=float)).notna())
    )

    # Compute lat/lon (prefer fixed over resolved)
    df['lat'] = df.get('fixed_lat', pd.Series(dtype=float)).fillna(df['resolved_lat'])
    df['lon'] = df.get('fixed_lon', pd.Series(dtype=float)).fillna(df['resolved_lon'])

    # Geometry as [lon, lat] list (None for national service)
    df['geometry'] = df.apply(
        lambda r: [r['lon'], r['lat']] if not r['national_service'] and pd.notna(r['lon']) else None,
        axis=1,
    )

    # Address
    df['address'] = df.apply(
        lambda r: r.get('resolved_address') or r.get('id', ''),
        axis=1,
    )

    return df


def preprocess_all(tables: dict) -> dict:
    """Run all preprocessing on the 6 AT tables."""
    return {
        'responses':     preprocess_responses(tables['responses']),
        'situations':    preprocess_situations(tables['situations']),
        'organizations': preprocess_organizations(tables['organizations']),
        'locations':     preprocess_locations(tables['locations']),
        'branches':      preprocess_branches(tables['branches']),
        'services':      preprocess_services(tables['services']),
    }


# ── Branch Denormalization ─────────────────────────────────────────────

def _select_address(row, address_fields):
    """Return the first Hebrew-valid address from the given fields."""
    for f in address_fields:
        v = row.get(f)
        if validate_address(v):
            return v
    return None


def flat_branches(tables: dict) -> tuple:
    """Denormalize: branches ← locations ← organizations, then merge duplicates."""
    branches = tables['branches'].copy()
    locations = tables['locations'].copy()
    orgs = tables['organizations'].copy()

    # --- Join locations onto branches ---
    # branches.location is an array of location keys — take first
    if 'location' in branches.columns:
        branches['location_key'] = branches['location'].apply(
            lambda v: v[0] if isinstance(v, list) and len(v) > 0 else None
        )
    else:
        branches['location_key'] = None

    # Filter branches that have a location
    branches = branches[branches['location_key'].notna()].reset_index(drop=True)

    # Rename branch.address → orig_address before merge (to avoid collision with location.address)
    if 'address' in branches.columns:
        branches = branches.rename(columns={'address': 'orig_address'})

    loc_cols = ['key', 'geometry', 'address', 'resolved_city', 'location_accurate', 'national_service']
    loc_cols = [c for c in loc_cols if c in locations.columns]
    branches = branches.merge(
        locations[loc_cols],
        left_on='location_key', right_on='key',
        how='left', suffixes=('', '_loc'),
    )
    # Drop the location key duplicate
    if 'key_loc' in branches.columns:
        branches = branches.drop(columns=['key_loc'])

    # Select best address
    branches['address'] = branches.apply(
        lambda r: _select_address(r, ['address', 'orig_address', 'resolved_city']),
        axis=1,
    )

    # --- Join organizations onto branches ---
    if 'organization' in branches.columns:
        branches['organization_key'] = branches['organization'].apply(
            lambda v: v[0] if isinstance(v, list) and len(v) > 0 else None
        )
    else:
        branches['organization_key'] = None

    branches = branches[branches['organization_key'].notna()].reset_index(drop=True)

    org_rename = {
        'key': 'organization_key_org',
        'id': 'organization_id',
        'name': 'organization_name',
        'short_name': 'organization_short_name',
        'description': 'organization_description',
        'purpose': 'organization_purpose',
        'kind': 'organization_kind',
        'urls': 'organization_urls',
        'phone_numbers': 'organization_phone_numbers',
        'email_address': 'organization_email_address',
        'situations': 'organization_situations',
    }
    org_cols = [c for c in org_rename.keys() if c in orgs.columns]
    org_subset = orgs[org_cols].rename(columns=org_rename)

    branches = branches.merge(
        org_subset,
        left_on='organization_key',
        right_on='organization_key_org',
        how='inner',
    )
    if 'organization_key_org' in branches.columns:
        branches = branches.drop(columns=['organization_key_org'])

    # Rename branch fields for flat namespace
    branch_rename = {
        'key': 'branch_key', 'id': 'branch_id', 'source': 'branch_source',
        'name': 'branch_name', 'operating_unit': 'branch_operating_unit',
        'description': 'branch_description', 'urls': 'branch_urls',
        'phone_numbers': 'branch_phone_numbers', 'email_address': 'branch_email_address',
        'address': 'branch_address', 'orig_address': 'branch_orig_address',
        'resolved_city': 'branch_city', 'geometry': 'branch_geometry',
        'location_accurate': 'branch_location_accurate',
        'situations': 'branch_situations', 'last_modified': 'branch_last_modified',
    }
    branches = branches.rename(columns={k: v for k, v in branch_rename.items() if k in branches.columns})

    # --- Merge duplicate branches ---
    branches, branch_key_mapping = _merge_duplicate_branches(branches)

    return branches, branch_key_mapping


def _merge_duplicate_branches(branches: pd.DataFrame) -> pd.DataFrame:
    """Merge branches with same org + geometry + name into one, computing branch_key and org branch count."""
    branch_mapping = {}  # old_key → new_key
    found = {}           # new_key → row dict
    org_count = {}       # org_id → count

    for _, row in branches.iterrows():
        row_dict = row.to_dict()
        geom = row_dict.get('branch_geometry') or [row_dict.get('branch_id', '')]
        geom_str = ';'.join(map(str, geom)) if isinstance(geom, list) else str(geom)
        new_key = hasher(
            row_dict.get('organization_id', ''),
            geom_str,
            row_dict.get('branch_name', ''),
        )
        old_key = row_dict.get('branch_key', '')
        branch_mapping[old_key] = new_key

        if new_key in found:
            prev = found[new_key]
            for k, v in row_dict.items():
                if k in ('branch_id', 'branch_key', 'branch_orig_address', 'branch_name'):
                    continue
                prev_v = prev.get(k)
                if prev_v != v:
                    if prev_v is None or (isinstance(prev_v, float) and pd.isna(prev_v)):
                        prev[k] = v
                    elif v is None or (isinstance(v, float) and pd.isna(v)):
                        pass  # keep existing
                    elif isinstance(v, list):
                        for item in v:
                            if item not in prev_v:
                                prev_v.append(item)
                    elif isinstance(v, str):
                        ratio = fuzz.ratio(str(prev_v), str(v))
                        if ratio < 80:
                            logger.debug(
                                'DUPLICATE BRANCH: differs in %s (ratio %d)',
                                k, ratio,
                            )
        else:
            row_dict['branch_key'] = new_key
            found[new_key] = row_dict
            org_count.setdefault(row_dict.get('organization_id'), 0)
            org_count[row_dict.get('organization_id')] += 1

    logger.info('Branch dedup: %d → %d unique', len(branches), len(found))

    # Set org branch count and build result
    for row_dict in found.values():
        row_dict['organization_branch_count'] = org_count.get(row_dict.get('organization_id'), 1)

    result = pd.DataFrame(list(found.values()))
    return result, branch_mapping


# ── Service Denormalization ────────────────────────────────────────────

def flat_services(tables: dict, branches_df: pd.DataFrame, branch_key_mapping: dict = None) -> pd.DataFrame:
    """Denormalize services → branches, merge duplicates."""
    if branch_key_mapping is None:
        branch_key_mapping = {}
    services = tables['services'].copy()
    flat_br = branches_df.copy()

    # Build branch_key mapping from flat_branches
    branch_map = {}
    non_national = {}
    for _, row in flat_br.iterrows():
        bk = row.get('branch_key', '')
        bid = row.get('branch_id', '')
        branch_map[bk] = bid
        if not row.get('national_service'):
            non_national[bk] = bid

    # Explode organizations array on services → get organization_key per service
    if 'organizations' in services.columns:
        services['organizations'] = services['organizations'].apply(
            lambda v: v if isinstance(v, list) else ([v] if v else [])
        )
        services = services.explode('organizations').rename(
            columns={'organizations': 'organization_key'}
        )
    elif 'organization_key' not in services.columns:
        services['organization_key'] = None

    # Get org_branches from flat_branches grouped by organization_key
    org_branches = flat_br.groupby('organization_key')['branch_key'].apply(set).to_dict()

    # Map service direct branches through branch key mapping
    # service.branches contains original AT record IDs; translate them to
    # deduped branch_keys via branch_key_mapping (old_at_id → deduped_key)
    if 'branches' in services.columns:
        services['branches'] = services['branches'].apply(
            lambda v: list(set(filter(None, [branch_key_mapping.get(b) for b in (v or [])])))
            if isinstance(v, list) else []
        )
    else:
        services['branches'] = [[] for _ in range(len(services))]

    # Get organization_branches for each service
    def _get_org_branches(row):
        ok = row.get('organization_key')
        return list(org_branches.get(ok, set()))

    services['organization_branches'] = services.apply(_get_org_branches, axis=1)

    # Filter soproc branches
    def _filter_soproc_branches(row):
        v = row.get('organization_branches') or []
        service_id = str(row.get('id', ''))
        is_soproc = service_id.startswith('soproc:')

        if is_soproc and len(v) > 5:
            national_branches = [b for b in v if str(branch_map.get(b, '')).lower().startswith('national')]
            if national_branches:
                return national_branches

        return [b for b in v if b in non_national]

    services['organization_branches'] = services.apply(_filter_soproc_branches, axis=1)

    # Merge branch arrays
    def _merge_branch_arrays(row):
        direct = set(row.get('branches') or [])
        org = set(row.get('organization_branches') or [])
        return sorted(direct | org)

    services['merge_branches'] = services.apply(_merge_branch_arrays, axis=1)

    # Explode to one row per service-branch
    services = services.explode('merge_branches').rename(
        columns={'merge_branches': 'branch_key'}
    )
    services = services.dropna(subset=['branch_key']).reset_index(drop=True)

    # Rename service fields
    svc_rename = {
        'key': 'service_key', 'id': 'service_id', 'name': 'service_name',
        'description': 'service_description', 'details': 'service_details',
        'payment_required': 'service_payment_required',
        'payment_details': 'service_payment_details',
        'urls': 'service_urls', 'phone_numbers': 'service_phone_numbers',
        'email_address': 'service_email_address', 'implements': 'service_implements',
        'situation_ids': 'service_situations', 'response_ids': 'service_responses',
        'boost': 'service_boost', 'last_modified': 'service_last_modified',
    }
    services = services.rename(columns={k: v for k, v in svc_rename.items() if k in services.columns})

    # Merge duplicate services (implementing logic)
    services = _merge_duplicate_services(services)

    return services


def _merge_duplicate_services(services: pd.DataFrame) -> pd.DataFrame:
    """Remove services that are implemented by another service in the same org."""
    if 'service_implements' not in services.columns:
        return services

    found_orgs = {}  # org_id → set of implemented service chains
    implementing = 0
    skipped = 0

    # Sort: implementing services first (those with service_implements)
    services = services.copy()
    services['_has_impl'] = services['service_implements'].apply(
        lambda v: 0 if v else 1
    )
    services = services.sort_values('_has_impl').reset_index(drop=True)

    keep = []
    for _, row in services.iterrows():
        impl = row.get('service_implements')
        org_id = row.get('organization_id', '')
        svc_id = str(row.get('service_id', ''))

        if impl:
            found_orgs.setdefault(org_id, set()).add(str(impl))
            implementing += 1
            keep.append(True)
        else:
            if org_id in found_orgs:
                if any(svc_id in x for x in found_orgs[org_id]):
                    skipped += 1
                    keep.append(False)
                    continue
                if svc_id.startswith('soproc:'):
                    skipped += 1
                    keep.append(False)
                    continue
            keep.append(True)

    logger.info('Service dedup: implementing=%d, skipped=%d', implementing, skipped)
    services = services[keep].drop(columns=['_has_impl']).reset_index(drop=True)
    return services


# ── Flat Table ─────────────────────────────────────────────────────────

def flat_table(branches_df: pd.DataFrame, services_df: pd.DataFrame) -> pd.DataFrame:
    """Join flat_branches + flat_services into a unified flat table."""
    # Select relevant branch columns
    branch_cols = [
        'branch_key', 'branch_id', 'branch_name', 'branch_operating_unit',
        'branch_description', 'branch_urls', 'branch_phone_numbers',
        'branch_email_address', 'branch_geometry', 'branch_location_accurate',
        'branch_address', 'branch_orig_address', 'branch_situations',
        'branch_city', 'branch_last_modified',
        'organization_key', 'organization_id', 'organization_name',
        'organization_short_name', 'organization_description',
        'organization_purpose', 'organization_kind', 'organization_urls',
        'organization_phone_numbers', 'organization_email_address',
        'organization_branch_count', 'organization_situations',
        'national_service',
    ]
    branch_cols = [c for c in branch_cols if c in branches_df.columns]

    svc_cols = [
        'service_key', 'service_id', 'service_name', 'service_description',
        'service_details', 'service_payment_required', 'service_payment_details',
        'service_urls', 'service_phone_numbers', 'service_email_address',
        'service_implements', 'service_situations', 'service_responses',
        'service_boost', 'service_last_modified', 'data_sources',
        'branch_key',
    ]
    svc_cols = [c for c in svc_cols if c in services_df.columns]

    flat = services_df[svc_cols].merge(
        branches_df[branch_cols],
        on='branch_key',
        how='inner',
    )

    # Add branch_short_name
    flat['branch_short_name'] = flat.apply(calculate_branch_short_name, axis=1)

    # Deduplicate service_id + branch_id
    flat = flat.drop_duplicates(subset=['service_id', 'branch_id'], keep='first').reset_index(drop=True)

    logger.info('Flat table: %d rows', len(flat))
    return flat


# ── Taxonomy ───────────────────────────────────────────────────────────

def _normalize_taxonomy_ids(ids):
    """Normalize taxonomy id lists — handle commas, spaces, canonicalize roots, dedup."""
    if not ids or not isinstance(ids, list):
        return ids or []
    out = []
    seen = set()

    def canonicalize(token: str):
        if token.startswith('human_situation:') and not token.startswith('human_situations:'):
            return 'human_situations:' + token.split(':', 1)[1]
        return token

    def emit(token):
        if not token:
            return
        if isinstance(token, str):
            token = canonicalize(token).strip().strip(',;')
            if not token:
                return
            if token == 'human_situations':
                return  # bare root only
        if token not in seen:
            seen.add(token)
            out.append(token)

    for raw in ids:
        if not isinstance(raw, str):
            emit(raw)
            continue
        comma_parts = [p for p in raw.split(',') if p.strip()] if ',' in raw else [raw]
        for part in comma_parts:
            part = part.strip()
            if part.count('human_situations:') + part.count('human_situation:') > 1:
                tokens = re.findall(r'human_situations:[A-Za-z0-9_:-]+|human_situation:[A-Za-z0-9_:-]+', part)
                if tokens:
                    for t in tokens:
                        emit(t)
                    continue
            emit(part)
    return out


def _fix_situations(ids):
    """Apply situation-specific business rules."""
    if not ids:
        return ids
    both_genders = ['human_situations:gender:women', 'human_situations:gender:men']
    if all(s in ids for s in both_genders):
        ids = [s for s in ids if s not in both_genders]
    hebrew = 'human_situations:language:hebrew_speaking'
    if hebrew in ids:
        ids = [s for s in ids if s != hebrew]
    arab_society = 'human_situations:sectors:arabs'
    bedouin = 'human_situations:sectors:bedouin'
    arabic = 'human_situations:language:arabic_speaking'
    if arab_society in ids or bedouin in ids:
        if arabic not in ids:
            ids.append(arabic)
    return ids


def _merge_array_fields(row, fieldnames):
    """Merge multiple array column values into a single sorted deduplicated list."""
    vals = []
    for name in fieldnames:
        v = row.get(name)
        if v and isinstance(v, list):
            vals.extend(v)
    return sorted(set(vals))


def _safe_get_response_categories(row):
    """Extract category from each response id (second level of taxonomy)."""
    categories = []
    for rr in (row.get('responses') or []):
        if not rr or 'id' not in rr:
            continue
        parts = rr['id'].split(':')
        if len(parts) > 1:
            categories.append(parts[1])
    return categories


def _safe_reorder_responses_by_category(responses, category):
    """Move responses matching the category to the front."""
    if not responses:
        return []
    matches = []
    others = []
    for r in responses:
        parts = r.get('id', '').split(':')
        if len(parts) > 1 and parts[1] == category:
            matches.append(r)
        else:
            others.append(r)
    return matches + others


# ── Auto-tagging ───────────────────────────────────────────────────────

def _load_autotagging_rules() -> list:
    """Load auto-tagging rules from the dataentry AT base."""
    df = load_airtable_as_dataframe(
        table_name='Auto Tagging',
        base_id=settings.AIRTABLE_DATAENTRY_BASE,
        view=settings.AIRTABLE_VIEW,
    )
    rules = []
    for _, row in df.iterrows():
        fields = []
        if row.get('In Org Name'):
            fields.append('organization_name')
        if row.get('In Org Purpose'):
            fields.append('organization_purpose')
        if row.get('In Service Name'):
            fields.append('service_name')
        raw_query = row.get('Query') or row.get('query', '')
        rules.append({
            'fields': fields,
            'query': raw_query if isinstance(raw_query, str) else '',
            'situation_ids': row.get('situation_ids') or [],
            'response_ids': row.get('response_ids') or [],
        })
    logger.info('Loaded %d auto-tagging rules', len(rules))
    return rules


def _apply_auto_tagging(flat: pd.DataFrame, rules: list) -> pd.DataFrame:
    """Apply auto-tagging rules row by row. Adds auto_tagged column."""
    flat = flat.copy()
    flat['auto_tagged'] = [[] for _ in range(len(flat))]

    for idx in range(len(flat)):
        row = flat.iloc[idx]
        auto_tagged = list(row.get('auto_tagged') or [])
        sit_ids = list(row.get('situation_ids') or [])
        resp_ids = list(row.get('response_ids') or [])
        changed = False

        for rule in rules:
            found = False
            query = rule['query']
            for field in rule['fields']:
                value = row.get(field)
                if value and isinstance(value, str):
                    if value.endswith(query) or query + ' ' in value:
                        found = True
                        break
            if found:
                if rule['situation_ids']:
                    for s in rule['situation_ids']:
                        if s not in sit_ids:
                            sit_ids.append(s)
                            changed = True
                        if s not in auto_tagged:
                            auto_tagged.append(s)
                if rule['response_ids']:
                    for r in rule['response_ids']:
                        if r not in resp_ids:
                            resp_ids.append(r)
                            changed = True
                        if r not in auto_tagged:
                            auto_tagged.append(r)

        if changed:
            flat.at[flat.index[idx], 'situation_ids'] = sit_ids
            flat.at[flat.index[idx], 'response_ids'] = resp_ids
        flat.at[flat.index[idx], 'auto_tagged'] = auto_tagged

    return flat


# ── Manual Fixes ───────────────────────────────────────────────────────

class ManualFixes:
    """Load and apply manual fixes from AT. Port of derive/manual_fixes.py."""

    def __init__(self):
        self._reloaded = False
        self._load_fixes(view=settings.AIRTABLE_VIEW)
        self.status = {}
        self.used = set()

    def _load_fixes(self, view=None):
        df = load_airtable_as_dataframe(
            table_name=settings.AIRTABLE_MANUAL_FIXES_TABLE,
            base_id=settings.AIRTABLE_DATA_IMPORT_BASE,
            view=view,
        )
        self.manual_fixes = {}
        for _, row in df.iterrows():
            key = row.get(AIRTABLE_ID_FIELD)
            if key:
                self.manual_fixes[key] = row.to_dict()
        logger.info('Loaded %d manual fixes', len(self.manual_fixes))

    @staticmethod
    def _normalize_ids(slugs):
        slugs = slugs or ''
        return ','.join(sorted(filter(None, set(s.strip() for s in slugs.split(',')))))

    def apply(self, flat: pd.DataFrame) -> pd.DataFrame:
        """Apply manual fixes to the flat table. Modifies in place."""
        if 'fixes' not in flat.columns:
            return flat

        for idx in range(len(flat)):
            fixes_list = flat.iloc[idx].get('fixes')
            if not fixes_list or not isinstance(fixes_list, list):
                continue

            for fix_id in fixes_list:
                if fix_id not in self.manual_fixes:
                    if not self._reloaded:
                        logger.warning('Manual fix %s not found, reloading without view...', fix_id)
                        self._load_fixes(view=None)
                        self._reloaded = True
                    if fix_id not in self.manual_fixes:
                        logger.error('Manual fix %s not found after reload', fix_id)
                        continue

                fix = self.manual_fixes[fix_id]
                field = fix.get('field', '')
                current_value = fix.get('current_value', '')
                fixed_value = fix.get('fixed_value', '')

                self.status.setdefault(fix_id, {
                    AIRTABLE_ID_FIELD: fix_id,
                    'etl_status': 'Obsolete',
                })
                self.used.add(fix_id)

                actual_value = flat.iloc[idx].get(field)
                if field in ('responses', 'situations'):
                    current_value = self._normalize_ids(current_value)
                    fixed_value = self._normalize_ids(fixed_value)
                    actual_value = ','.join(sorted(actual_value or []))

                if actual_value == current_value or current_value == '*':
                    flat.at[flat.index[idx], field] = fixed_value
                    self.status[fix_id]['etl_status'] = 'Active'
                    logger.debug('Fixed %s: %s → %s', fix_id, field, str(fixed_value)[:50])

        return flat


# ── RS Score Calculation ───────────────────────────────────────────────

class RSScoreCalc:
    """Response–Situation relevance scoring. Port of derive/to_dp.py RSScoreCalc."""

    MAX_SCORE = 30

    def __init__(self, card_df: pd.DataFrame):
        """Build frequency table from situation_ids × response_ids co-occurrences."""
        self.scores = {}

        # Explode situation_ids and response_ids to get all pairs
        pairs = card_df[['situation_ids', 'response_ids']].copy()
        pairs = pairs.explode('situation_ids').rename(columns={'situation_ids': 'situation_id'})
        pairs = pairs.explode('response_ids').rename(columns={'response_ids': 'response_id'})
        pairs = pairs.dropna(subset=['situation_id', 'response_id'])

        if pairs.empty:
            return

        # Count (situation_id, response_id) frequencies
        pair_counts = pairs.groupby(['situation_id', 'response_id']).size().reset_index(name='freq')

        # For each response, get total and per-situation scores
        for response_id, group in pair_counts.groupby('response_id'):
            total = group['freq'].sum()
            for _, row in group.iterrows():
                self.scores[(row['situation_id'], response_id)] = math.log(total / row['freq'])

    def process(self, row: dict) -> dict:
        """Score and sort situations for a single card row."""
        responses = row.get('responses') or []
        situations = row.get('situations') or []
        auto_tagged = row.get('auto_tagged') or []

        if not responses or not situations:
            row['rs_score'] = 0
            row['situation_scores'] = []
            return row

        score = 0
        s_scores = {}
        for r in responses:
            for s in situations:
                s_score = self.scores.get((s['id'], r['id']), 0) / len(responses)
                if s['id'] in auto_tagged:
                    s_score = 0
                score += s_score
                s_scores.setdefault(s['id'], 0)
                s_scores[s['id']] += s_score

        # Sort situations by score descending
        row['situations'] = sorted(situations, key=lambda s: s_scores.get(s['id'], 0), reverse=True)
        row['situation_scores'] = [s_scores.get(s['id'], 0) for s in row['situations']]
        row['situation_ids'] = [s['id'] for s in row['situations']]

        # Trim lowest-scored situations until total ≤ MAX_SCORE
        while score > self.MAX_SCORE and row['situation_scores']:
            score -= row['situation_scores'].pop(0)
            row['situation_ids'].pop(0)
            row['situations'].pop(0)

        row['rs_score'] = score
        return row


# ── Card Data Assembly ─────────────────────────────────────────────────

def card_data_assembly(flat: pd.DataFrame, tables: dict) -> pd.DataFrame:
    """Build the final card_data DataFrame from the flat table + taxonomy tables.

    Corresponds to card_data_flow() in the original to_dp.py.
    """
    # Load taxonomy lookups
    situations_df = tables['situations']
    responses_df = tables['responses']

    # Build taxonomy dicts: key → {id, name, synonyms} & id → {id, name, synonyms}
    sit_fields = ['key', 'id', 'name', 'synonyms']
    sit_fields = [f for f in sit_fields if f in situations_df.columns]
    sit_records = situations_df[sit_fields].to_dict('records')
    sit_by_key = {r['key']: r for r in sit_records if 'key' in r}
    sit_by_id = {r['id']: r for r in sit_records if 'id' in r}
    sit_lookup = {**sit_by_key, **sit_by_id}

    resp_fields = ['key', 'id', 'name', 'synonyms']
    resp_fields = [f for f in resp_fields if f in responses_df.columns]
    resp_records = responses_df[resp_fields].to_dict('records')
    resp_by_key = {r['key']: r for r in resp_records if 'key' in r}
    resp_by_id = {r['id']: r for r in resp_records if 'id' in r}
    resp_lookup = {**resp_by_key, **resp_by_id}

    def map_taxonomy(ids, lookup):
        """Map keys/ids to canonical taxonomy ids (dedup)."""
        if not ids or not isinstance(ids, list):
            return []
        return list(set(lookup[x]['id'] for x in ids if x in lookup))

    df = flat.copy()

    # Add card_id
    df['card_id'] = df.apply(
        lambda r: hasher(r.get('branch_id', ''), r.get('service_id', '')),
        axis=1,
    )

    # Merge situation_ids from service + branch + organization
    df['situation_ids'] = df.apply(
        lambda r: _merge_array_fields(r, ['service_situations', 'branch_situations', 'organization_situations']),
        axis=1,
    )

    # Normalize taxonomy ids
    df['situation_ids'] = df['situation_ids'].apply(_normalize_taxonomy_ids)

    # Map to canonical taxonomy ids
    df['situation_ids'] = df['situation_ids'].apply(lambda ids: map_taxonomy(ids, sit_lookup))

    # Fix situations (business rules)
    df['situation_ids'] = df['situation_ids'].apply(_fix_situations)

    # Response ids
    df['response_ids'] = df.apply(
        lambda r: _merge_array_fields(r, ['service_responses']),
        axis=1,
    )
    df['response_ids'] = df['response_ids'].apply(_normalize_taxonomy_ids)
    df['response_ids'] = df['response_ids'].apply(lambda ids: map_taxonomy(ids, resp_lookup))

    # Auto-tagging
    rules = _load_autotagging_rules()
    df = _apply_auto_tagging(df, rules)

    # Filter: must have response_ids
    df = df[df['response_ids'].apply(lambda v: bool(v))].reset_index(drop=True)

    # RS Score calculation
    rs_calc = RSScoreCalc(df)

    # Build taxonomy objects from ids
    df['situations'] = df['situation_ids'].apply(
        lambda ids: [sit_lookup[s] for s in ids if s in sit_lookup]
    )
    df['responses'] = df['response_ids'].apply(
        lambda ids: [resp_lookup[r] for r in ids if r in resp_lookup]
    )

    # Apply RS scoring row by row
    results = []
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        row_dict = rs_calc.process(row_dict)
        results.append(row_dict)
    df = pd.DataFrame(results)

    # Parent expansion
    df['situation_ids_parents'] = df['situation_ids'].apply(update_taxonomy_with_parents)
    df['response_ids_parents'] = df['response_ids'].apply(update_taxonomy_with_parents)

    df['situations_parents'] = df['situation_ids_parents'].apply(
        lambda ids: [sit_lookup.get(s) for s in ids if s in sit_lookup]
    )
    df['responses_parents'] = df['response_ids_parents'].apply(
        lambda ids: [resp_lookup.get(r) for r in ids if r in resp_lookup]
    )

    # Response categories
    df['response_categories'] = df.apply(_safe_get_response_categories, axis=1)
    df['response_category'] = df.apply(most_common_category, axis=1)

    # Filter: must have response_category
    df = df[df['response_category'].notna()].reset_index(drop=True)

    # Reorder responses by category
    df['responses'] = df.apply(
        lambda r: _safe_reorder_responses_by_category(r.get('responses', []), r.get('response_category', '')),
        axis=1,
    )

    # Filter: valid geometry or national service
    df = df[df.apply(
        lambda r: validate_geometry(r.get('branch_geometry')) or bool(r.get('national_service')),
        axis=1,
    )].reset_index(drop=True)

    # Computed fields
    df['point_id'] = df.apply(
        lambda r: calc_point_id(r['branch_geometry']) if isinstance(r.get('branch_geometry'), list) and not r.get('national_service') else 'national_service',
        axis=1,
    )

    df['national_service_details'] = df['national_service'].apply(
        lambda ns: 'ארצי' if ns else None,
    )

    df['coords'] = df.apply(
        lambda r: '[{},{}]'.format(*r['branch_geometry']) if isinstance(r.get('branch_geometry'), list) else None,
        axis=1,
    )

    df['collapse_key'] = df.apply(
        lambda r: f"{r.get('service_name', '')} {r.get('service_description') or ''}".strip(),
        axis=1,
    )

    df['branch_address_parts'] = df.apply(address_parts, axis=1)

    # Clean org names
    if 'organization_name' in df.columns:
        df['organization_original_name'] = df['organization_name']
        df['organization_name'] = df['organization_name'].apply(clean_org_name)
    if 'organization_short_name' in df.columns:
        df['organization_short_name'] = df['organization_short_name'].apply(clean_org_name)

    df['organization_name_parts'] = df.apply(org_name_parts, axis=1)

    # Score
    df['score'] = df.apply(card_score, axis=1)

    # Clean up intermediate columns
    drop_cols = [
        'service_situations', 'branch_situations', 'organization_situations',
        'service_responses', 'auto_tagged', 'situation_ids_parents',
        'response_ids_parents', 'situation_scores', 'rs_score',
        'service_key', 'branch_key', 'organization_key', 'fixes',
    ]
    drop_cols = [c for c in drop_cols if c in df.columns]
    df = df.drop(columns=drop_cols)

    logger.info('Card data: %d cards', len(df))
    return df


# ── Main Entry Point ───────────────────────────────────────────────────

def to_dp() -> pd.DataFrame:
    """Run the complete data pipeline: AT → card_data DataFrame.

    Returns:
        pd.DataFrame with one row per card (service × branch) containing
        all fields needed for ES indexing and AT card writing.
    """
    logger.info('Starting Data Package Flow (pandas)')

    # 1. Load
    tables = load_all_tables()

    # 2. Preprocess
    tables = preprocess_all(tables)

    # 3. Denormalize branches
    branches, branch_key_mapping = flat_branches(tables)

    # 4. Denormalize services
    services = flat_services(tables, branches, branch_key_mapping)

    # 5. Flat table
    flat = flat_table(branches, services)

    # 6. Manual fixes (applied to flat table before card assembly)
    manual = ManualFixes()
    flat = manual.apply(flat)

    # 7. Card data assembly
    card_data = card_data_assembly(flat, tables)

    logger.info('Finished Data Package Flow: %d cards', len(card_data))
    return card_data
