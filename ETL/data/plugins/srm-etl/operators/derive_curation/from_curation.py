"""Curation pipeline — copy curated data from curation base to staging.

Replaces derive/from_curation.py (200 lines of dataflows) with pandas +
pyairtable operations.

Pipeline:
    1. Load orgs/branches/services from curation base
    2. Mark undecided records as 'New'
    3. Filter active, non-rejected, with services
    4. Apply manual fixes
    5. Remap cross-table AT record IDs (curation → staging)
    6. Upsert to staging base

Entry point:
    from operators.derive_curation.from_curation import copy_from_curation_base
"""
from typing import Dict, Optional

import pandas as pd
from pyairtable import Api

from conf import settings
from extract.extract_data_from_airtable import load_airtable_as_dataframe
from load.airtable import update_if_exists_if_not_create
from srm_tools.logger import logger

from operators.derive_es.helpers import AIRTABLE_ID_FIELD


# ── Table field definitions ────────────────────────────────────────────

TABLE_FIELDS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: [
        'name', 'short_name', 'kind', 'urls', 'phone_numbers',
        'email_address', 'description', 'purpose',
    ],
    settings.AIRTABLE_BRANCH_TABLE: [
        'name', 'organization', 'operating_unit', 'address', 'address_details',
        'location', 'description', 'phone_numbers', 'email_address', 'urls',
        'situations',
    ],
    settings.AIRTABLE_SERVICE_TABLE: [
        'name', 'description', 'details', 'payment_required', 'payment_details',
        'urls', 'phone_numbers', 'email_address', 'implements', 'situations',
        'responses', 'organizations', 'branches', 'responses_manual',
        'situations_manual', 'data_sources', 'boost',
    ],
}

EXTRA_FIELDS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: ['services', 'branch_services'],
    settings.AIRTABLE_BRANCH_TABLE: ['services', 'org_services'],
    settings.AIRTABLE_SERVICE_TABLE: ['organizations', 'branches'],
}


# ── Helpers ────────────────────────────────────────────────────────────

def _mark_undecided(df: pd.DataFrame, table_name: str, curation_base: str):
    """Write 'New' decision back to curation base for undecided records."""
    if 'decision' not in df.columns:
        return

    undecided = df[df['decision'].isna() | (df['decision'] == '')]
    if undecided.empty:
        return

    api = Api(settings.AIRTABLE_API_KEY)
    table = api.table(curation_base, table_name)

    updates = []
    for _, row in undecided.iterrows():
        at_id = row.get(AIRTABLE_ID_FIELD)
        if at_id:
            updates.append({'id': at_id, 'fields': {'decision': 'New'}})

    # Batch update in groups of 10
    for i in range(0, len(updates), 10):
        batch = updates[i:i+10]
        try:
            table.batch_update(batch)
        except Exception as e:
            logger.error('Failed marking undecided in %s: %s', table_name, e)

    logger.info('Marked %d undecided records as New in %s', len(updates), table_name)


def _filter_curation(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    """Filter: active, non-rejected, has services/branches."""
    # Active status
    if 'status' in df.columns:
        df = df[df['status'].fillna('').str.strip().str.upper() == 'ACTIVE']

    # Non-rejected/suspended
    if 'decision' in df.columns:
        df = df[~df['decision'].isin(['Rejected', 'Suspended'])]

    # Has services check (per table)
    if table_name == settings.AIRTABLE_ORGANIZATION_TABLE:
        df = df[df.apply(
            lambda r: bool(r.get('services')) or bool(r.get('branch_services')),
            axis=1,
        )]
    elif table_name == settings.AIRTABLE_BRANCH_TABLE:
        df = df[df.apply(
            lambda r: bool(r.get('services')) or bool(r.get('org_services')),
            axis=1,
        )]
    elif table_name == settings.AIRTABLE_SERVICE_TABLE:
        df = df[df.apply(
            lambda r: bool(r.get('organizations')) or bool(r.get('branches')),
            axis=1,
        )]

    return df.reset_index(drop=True)


def _build_id_mapping(staging_base: str, table_name: str) -> Dict[str, str]:
    """Build mapping: record.id → AT record _airtable_id in the staging base."""
    df = load_airtable_as_dataframe(
        table_name=table_name,
        base_id=staging_base,
        view=settings.AIRTABLE_VIEW,
    )
    mapping = {}
    for _, row in df.iterrows():
        record_id = row.get('id')
        at_id = row.get(AIRTABLE_ID_FIELD)
        if record_id and at_id:
            mapping[record_id] = at_id
    return mapping


def _remap_references(df: pd.DataFrame, fields: list, mapping: Dict[str, str]) -> pd.DataFrame:
    """Remap AT record ID references in specified columns using curation→staging mapping."""
    df = df.copy()
    for field in fields:
        if field not in df.columns:
            continue
        df[field] = df[field].apply(
            lambda v: [mapping.get(item, item) for item in v]
            if isinstance(v, list) else v
        )
    return df


def _apply_manual_fixes(df: pd.DataFrame) -> pd.DataFrame:
    """Load and apply manual fixes from the data import AT base."""
    fixes_df = load_airtable_as_dataframe(
        table_name=settings.AIRTABLE_MANUAL_FIXES_TABLE,
        base_id=settings.AIRTABLE_DATA_IMPORT_BASE,
        view=settings.AIRTABLE_VIEW,
    )

    # Build fixes dict keyed by AT record ID
    fixes_by_id = {}
    for _, row in fixes_df.iterrows():
        fix_id = row.get(AIRTABLE_ID_FIELD)
        if fix_id:
            fixes_by_id[fix_id] = row.to_dict()

    if 'fixes' not in df.columns:
        return df

    for idx in range(len(df)):
        fix_list = df.iloc[idx].get('fixes')
        if not isinstance(fix_list, list):
            continue

        for fix_id in fix_list:
            fix = fixes_by_id.get(fix_id)
            if not fix:
                logger.warning('Manual fix %s not found', fix_id)
                continue

            field = fix.get('field', '')
            current_value = fix.get('current_value', '')
            fixed_value = fix.get('fixed_value', '')

            actual = df.iloc[idx].get(field)
            if actual == current_value or current_value == '*':
                df.at[df.index[idx], field] = fixed_value
                logger.debug('Applied fix %s: %s → %s', fix_id, field, str(fixed_value)[:50])

    return df


# ── Main Pipeline ──────────────────────────────────────────────────────

def copy_from_curation_base(curation_base: str, source_id: str):
    """Copy curated orgs, branches, services from curation base to staging.

    Args:
        curation_base: AT base ID of the curation/data-import base.
        source_id: Source tag for the records (e.g. 'entities').
    """
    logger.info('Copying data from curation base %s', curation_base)
    staging_base = settings.AIRTABLE_BASE

    # ── Step 1: Load all 3 tables from curation ────────────────────────

    tables = {}
    for table_name in (settings.AIRTABLE_ORGANIZATION_TABLE,
                       settings.AIRTABLE_BRANCH_TABLE,
                       settings.AIRTABLE_SERVICE_TABLE):
        df = load_airtable_as_dataframe(
            table_name=table_name,
            base_id=curation_base,
            view=settings.AIRTABLE_VIEW,
        )
        # Mark undecided
        _mark_undecided(df, table_name, curation_base)
        tables[table_name] = df
        logger.info('Loaded %d records from curation %s', len(df), table_name)

    # ── Step 2: Process Organizations ──────────────────────────────────

    orgs = tables[settings.AIRTABLE_ORGANIZATION_TABLE].copy()
    orgs = _filter_curation(orgs, settings.AIRTABLE_ORGANIZATION_TABLE)
    orgs = _apply_manual_fixes(orgs)

    # Collect org ID → curation AT record ID mapping
    org_curation_ids = {}
    for _, row in orgs.iterrows():
        at_id = row.get(AIRTABLE_ID_FIELD)
        record_id = row.get('id')
        if at_id and record_id:
            org_curation_ids[at_id] = record_id

    # Prepare org fields for upsert
    org_fields = TABLE_FIELDS[settings.AIRTABLE_ORGANIZATION_TABLE]
    org_upsert_cols = [c for c in ['id', 'source', 'status'] + org_fields if c in orgs.columns]
    orgs_for_write = orgs[org_upsert_cols].copy()
    orgs_for_write['source'] = source_id
    orgs_for_write['status'] = 'ACTIVE'

    update_if_exists_if_not_create(
        df=orgs_for_write,
        table_name=settings.AIRTABLE_ORGANIZATION_TABLE,
        base_id=staging_base,
        airtable_key='id',
        fields_to_update=org_fields + ['status', 'source'],
    )
    logger.info('Upserted %d organizations to staging', len(orgs_for_write))

    # Build org AT ID mapping: curation AT ID → staging AT ID
    org_staging_map = _build_id_mapping(staging_base, settings.AIRTABLE_ORGANIZATION_TABLE)
    # Convert: curation_at_id → staging_at_id (via record.id)
    org_remap = {}
    for cur_at_id, record_id in org_curation_ids.items():
        staging_at_id = org_staging_map.get(record_id)
        if staging_at_id:
            org_remap[cur_at_id] = staging_at_id

    # ── Step 3: Build location mapping ─────────────────────────────────

    location_map = _build_id_mapping(staging_base, settings.AIRTABLE_LOCATION_TABLE)

    # ── Step 4: Process Branches ───────────────────────────────────────

    branches = tables[settings.AIRTABLE_BRANCH_TABLE].copy()
    branches = _filter_curation(branches, settings.AIRTABLE_BRANCH_TABLE)
    branches = _apply_manual_fixes(branches)

    # Remap organization and location references
    branches = _remap_references(branches, ['organization'], org_remap)
    if 'location' in branches.columns:
        branches['location'] = branches['location'].apply(
            lambda v: [location_map.get(item, item) for item in v]
            if isinstance(v, list) else v
        )

    # Filter: must have valid organization after remapping
    branches = branches[branches.apply(
        lambda r: isinstance(r.get('organization'), list) and len(r['organization']) > 0,
        axis=1,
    )].reset_index(drop=True)

    # Collect branch ID mapping
    branch_curation_ids = {}
    for _, row in branches.iterrows():
        at_id = row.get(AIRTABLE_ID_FIELD)
        record_id = row.get('id')
        if at_id and record_id:
            branch_curation_ids[at_id] = record_id

    branch_fields = TABLE_FIELDS[settings.AIRTABLE_BRANCH_TABLE]
    branch_upsert_cols = [c for c in ['id', 'source', 'status'] + branch_fields if c in branches.columns]
    branches_for_write = branches[branch_upsert_cols].copy()
    branches_for_write['source'] = source_id
    branches_for_write['status'] = 'ACTIVE'

    update_if_exists_if_not_create(
        df=branches_for_write,
        table_name=settings.AIRTABLE_BRANCH_TABLE,
        base_id=staging_base,
        airtable_key='id',
        fields_to_update=branch_fields + ['status', 'source'],
    )
    logger.info('Upserted %d branches to staging', len(branches_for_write))

    # Build branch remap
    branch_staging_map = _build_id_mapping(staging_base, settings.AIRTABLE_BRANCH_TABLE)
    branch_remap = {}
    for cur_at_id, record_id in branch_curation_ids.items():
        staging_at_id = branch_staging_map.get(record_id)
        if staging_at_id:
            branch_remap[cur_at_id] = staging_at_id

    # ── Step 5: Process Services ───────────────────────────────────────

    services = tables[settings.AIRTABLE_SERVICE_TABLE].copy()
    services = _filter_curation(services, settings.AIRTABLE_SERVICE_TABLE)
    services = _apply_manual_fixes(services)

    # Remap organization and branch references
    services = _remap_references(services, ['organizations'], org_remap)
    services = _remap_references(services, ['branches'], branch_remap)

    # Filter: must have valid org or branch after remapping
    services = services[services.apply(
        lambda r: (isinstance(r.get('organizations'), list) and len(r['organizations']) > 0)
                  or (isinstance(r.get('branches'), list) and len(r['branches']) > 0),
        axis=1,
    )].reset_index(drop=True)

    service_fields = TABLE_FIELDS[settings.AIRTABLE_SERVICE_TABLE]
    service_upsert_cols = [c for c in ['id', 'source', 'status'] + service_fields if c in services.columns]
    services_for_write = services[service_upsert_cols].copy()
    services_for_write['source'] = source_id
    services_for_write['status'] = 'ACTIVE'

    update_if_exists_if_not_create(
        df=services_for_write,
        table_name=settings.AIRTABLE_SERVICE_TABLE,
        base_id=staging_base,
        airtable_key='id',
        fields_to_update=service_fields + ['status', 'source'],
    )
    logger.info('Upserted %d services to staging', len(services_for_write))

    logger.info('Finished copying from curation base: %d orgs, %d branches, %d services',
                len(orgs_for_write), len(branches_for_write), len(services_for_write))
