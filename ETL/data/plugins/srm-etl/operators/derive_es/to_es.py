"""ES index loading — load all 6 srm__ indexes from DataFrames.

Uses Phase 3 bulk utilities (es_utils.py) for atomic swap loading.
Replaces derive/to_es.py (319 lines of dataflows).

Entry point:
    from operators.derive_es.to_es import load_all_indexes
    load_all_indexes(card_data, autocomplete_df)
"""
import tempfile
import shutil
from datetime import datetime
from typing import Optional

import pandas as pd
import requests

from conf import settings
from srm_tools.logger import logger

from operators.derive_es.es_utils import (
    atomic_swap_index,
    es_instance,
)
from operators.derive_es.es_mappings import (
    ALL_MAPPINGS,
    index_settings_and_mappings,
)
from operators.derive_es.helpers import (
    card_score,
    update_taxonomy_with_parents,
)
from extract.extract_data_from_airtable import load_airtable_as_dataframe


# ── Cards Index ────────────────────────────────────────────────────────

def _parse_date(d):
    """Parse date string or datetime to datetime."""
    if isinstance(d, str):
        try:
            return datetime.fromisoformat(d)
        except Exception:
            return None
    elif isinstance(d, datetime):
        return d
    return None


def load_cards(es, card_data: pd.DataFrame):
    """Load card_data into srm__cards index with atomic swap."""
    logger.info('Loading %d cards to srm__cards', len(card_data))

    df = card_data.copy()

    # Add score if not present
    if 'score' not in df.columns:
        df['score'] = df.apply(card_score, axis=1)

    # Add airtable_last_modified
    if 'airtable_last_modified' not in df.columns:
        def _max_date(row):
            dates = [
                _parse_date(row.get('service_last_modified')),
                _parse_date(row.get('branch_last_modified')),
            ]
            valid = [d for d in dates if d is not None]
            return max(valid) if valid else None
        df['airtable_last_modified'] = df.apply(_max_date, axis=1)

    revision = atomic_swap_index(
        es, 'srm__cards', df,
        id_field='card_id',
        settings_and_mappings=index_settings_and_mappings('srm__cards'),
    )
    logger.info('srm__cards loaded, revision=%s', revision)


# ── Autocomplete Index ─────────────────────────────────────────────────

def load_autocomplete(es, autocomplete_df: pd.DataFrame):
    """Load autocomplete suggestions into srm__autocomplete."""
    logger.info('Loading %d suggestions to srm__autocomplete', len(autocomplete_df))
    revision = atomic_swap_index(
        es, 'srm__autocomplete', autocomplete_df,
        id_field='id',
        settings_and_mappings=index_settings_and_mappings('srm__autocomplete'),
    )
    logger.info('srm__autocomplete loaded, revision=%s', revision)


# ── Responses Index ────────────────────────────────────────────────────

def load_responses(es, card_data: pd.DataFrame):
    """Build and load response taxonomy counts into srm__responses."""
    logger.info('Building response counts from %d cards', len(card_data))

    # Expand response_ids with parents, then count
    all_resp_ids = []
    for _, row in card_data.iterrows():
        resp_ids = row.get('response_ids') or []
        expanded = update_taxonomy_with_parents(resp_ids)
        for rid in expanded:
            all_resp_ids.append(rid)

    if not all_resp_ids:
        logger.warning('No response IDs found in card_data')
        return

    counts = pd.Series(all_resp_ids).value_counts().reset_index()
    counts.columns = ['id', 'count']

    # Load response taxonomy from AT for names/synonyms/breadcrumbs
    resp_at = load_airtable_as_dataframe(
        table_name=settings.AIRTABLE_RESPONSE_TABLE,
        base_id=settings.AIRTABLE_BASE,
        view=settings.AIRTABLE_VIEW,
    )

    # Filter to ACTIVE only
    if 'status' in resp_at.columns:
        resp_at = resp_at[resp_at['status'].fillna('').str.strip().str.upper() == 'ACTIVE']

    # Select fields
    resp_fields = ['id', 'name', 'synonyms', 'breadcrumbs']
    resp_fields = [f for f in resp_fields if f in resp_at.columns]
    resp_at = resp_at[resp_fields].copy()

    # Join counts onto taxonomy
    resp_df = resp_at.merge(counts, on='id', how='inner')

    # Filter: must have count
    resp_df = resp_df[resp_df['count'].notna()].reset_index(drop=True)

    # Add score (= count)
    resp_df['score'] = resp_df['count'].astype(float)

    revision = atomic_swap_index(
        es, 'srm__responses', resp_df,
        id_field='id',
        settings_and_mappings=index_settings_and_mappings('srm__responses'),
    )
    logger.info('srm__responses loaded (%d docs), revision=%s', len(resp_df), revision)


# ── Situations Index ───────────────────────────────────────────────────

def load_situations(es, card_data: pd.DataFrame):
    """Build and load situation taxonomy counts into srm__situations."""
    logger.info('Building situation counts from %d cards', len(card_data))

    all_sit_ids = []
    for _, row in card_data.iterrows():
        sit_ids = row.get('situation_ids') or []
        expanded = update_taxonomy_with_parents(sit_ids)
        for sid in expanded:
            all_sit_ids.append(sid)

    if not all_sit_ids:
        logger.warning('No situation IDs found in card_data')
        return

    counts = pd.Series(all_sit_ids).value_counts().reset_index()
    counts.columns = ['id', 'count']

    sit_at = load_airtable_as_dataframe(
        table_name=settings.AIRTABLE_SITUATION_TABLE,
        base_id=settings.AIRTABLE_BASE,
        view=settings.AIRTABLE_VIEW,
    )

    if 'status' in sit_at.columns:
        sit_at = sit_at[sit_at['status'].fillna('').str.strip().str.upper() == 'ACTIVE']

    sit_fields = ['id', 'name', 'synonyms', 'breadcrumbs']
    sit_fields = [f for f in sit_fields if f in sit_at.columns]
    sit_at = sit_at[sit_fields].copy()

    sit_df = sit_at.merge(counts, on='id', how='inner')
    sit_df = sit_df[sit_df['count'].notna()].reset_index(drop=True)
    sit_df['score'] = sit_df['count'].astype(float)

    revision = atomic_swap_index(
        es, 'srm__situations', sit_df,
        id_field='id',
        settings_and_mappings=index_settings_and_mappings('srm__situations'),
    )
    logger.info('srm__situations loaded (%d docs), revision=%s', len(sit_df), revision)


# ── Organizations Index ────────────────────────────────────────────────

def load_organizations(es, card_data: pd.DataFrame):
    """Build and load organization counts into srm__orgs."""
    logger.info('Building organization counts from %d cards', len(card_data))

    # Count cards per organization
    org_counts = card_data.groupby('organization_id').size().reset_index(name='count')
    org_counts = org_counts.rename(columns={'organization_id': 'id'})

    # Load full org data from AT
    org_at = load_airtable_as_dataframe(
        table_name=settings.AIRTABLE_ORGANIZATION_TABLE,
        base_id=settings.AIRTABLE_BASE,
        view=settings.AIRTABLE_VIEW,
    )

    org_fields = ['id', 'name', 'description', 'kind']
    org_fields = [f for f in org_fields if f in org_at.columns]
    org_at = org_at[org_fields].copy()

    org_df = org_at.merge(org_counts, on='id', how='inner')
    org_df = org_df.sort_values('count').reset_index(drop=True)
    org_df['score'] = org_df['count'].astype(float) * 10

    revision = atomic_swap_index(
        es, 'srm__orgs', org_df,
        id_field='id',
        settings_and_mappings=index_settings_and_mappings('srm__orgs'),
    )
    logger.info('srm__orgs loaded (%d docs), revision=%s', len(org_df), revision)


# ── Places Index ───────────────────────────────────────────────────────

PREDEFINED_PLACES = [
    dict(key='גוש_דן', name=['גוש דן'], bounds=[34.6, 31.8, 35.1, 32.181], place='region'),
    dict(key='איזור_ירושלים', name=['איזור ירושלים'], bounds=[34.9, 31.7, 35.3, 31.9], place='region'),
    dict(key='איזור_הצפון', name=['איזור הצפון'], bounds=[34.5, 32.5, 35.8, 33.3], place='region'),
    dict(key='איזור_באר_שבע', name=['איזור באר-שבע'], bounds=[34.5, 30.8, 35.5, 31.5], place='region'),
]

PLACE_SCORES = dict(region=200, city=100, town=50, village=10, hamlet=5)


def load_places(es):
    """Load geographic places with bounds into srm__places."""
    logger.info('Loading places to srm__places')

    url = settings.LOCATION_BOUNDS_SOURCE_URL

    # Download datapackage
    try:
        import dataflows as DF
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmpfile:
            src = requests.get(url, stream=True).raw
            shutil.copyfileobj(src, tmpfile)
            tmpfile.close()
            all_places = DF.Flow(
                DF.load(tmpfile.name, format='datapackage'),
            ).results(on_error=None)[0][0]
    except ImportError:
        resp = requests.get(url)
        all_places = resp.json() if resp.ok else []

    # Add predefined places
    all_places.extend(PREDEFINED_PLACES)

    # Build DataFrame
    rows = []
    for place in all_places:
        name_list = place.get('name', [])
        query = sorted(name_list, key=len, reverse=True)[0] if name_list else ''
        bounds = place.get('bounds', [])
        place_type = place.get('place', '')
        size = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]) * 100000 if len(bounds) == 4 else 0
        score = size * PLACE_SCORES.get(place_type, 1)
        rows.append({
            'key': place.get('key', ''),
            'name': query,
            'query': query,
            'bounds': bounds,
            'place': place_type,
            'score': score,
        })

    places_df = pd.DataFrame(rows)
    logger.info('Places: %d entries', len(places_df))

    revision = atomic_swap_index(
        es, 'srm__places', places_df,
        id_field='key',
        settings_and_mappings=index_settings_and_mappings('srm__places'),
    )
    logger.info('srm__places loaded, revision=%s', revision)


# ── Main Entry Point ───────────────────────────────────────────────────

def load_all_indexes(card_data: pd.DataFrame, autocomplete_df: pd.DataFrame):
    """Load all 6 ES indexes from DataFrames.

    Args:
        card_data: Main card DataFrame from to_dp().
        autocomplete_df: Autocomplete suggestions from generate_autocomplete().
    """
    es = es_instance()

    load_cards(es, card_data)
    load_places(es)
    load_responses(es, card_data)
    load_situations(es, card_data)
    load_organizations(es, card_data)
    load_autocomplete(es, autocomplete_df)

    logger.info('All 6 ES indexes loaded successfully')
