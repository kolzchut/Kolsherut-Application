"""Manual fixes from the Data-Import base: apply per row, report etl_status back.

Plain-Python port of the legacy derive ManualFixes. Behavior preserved: one
fallback reload without the view filter, AssertionError when a referenced fix
is still missing, taxonomy fields compared as normalized sorted id sets, and a
batched etl_status write-back (Active if applied at least once, else Obsolete).
State lives in the module-level manual_fixes_state dict; load_manual_fixes
resets it at the start of every copy run.
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import AIRTABLE_RECORD_ID_FIELD, update_rows_in_airtable, fetch_rows_from_airtable

FIX_STATUS_ACTIVE = 'Active'
FIX_STATUS_OBSOLETE = 'Obsolete'
MATCH_ANY_VALUE = '*'
TAXONOMY_FIX_FIELDS = ('responses', 'situations')

manual_fixes_state = {'fixes': {}, 'reloaded': False, 'status': {}, 'used': set()}


def normalize_taxonomy_slugs(slugs):
    slugs = slugs or ''
    return ','.join(sorted(filter(None, set(slug.strip() for slug in slugs.split(',')))))


def fetch_fixes_from_airtable(view):
    rows = fetch_rows_from_airtable(settings.AIRTABLE_DATA_IMPORT_BASE, settings.AIRTABLE_MANUAL_FIXES_TABLE, view=view)
    logger.info('Got %d manual fix records (view=%s)', len(rows), view)
    return {row[AIRTABLE_RECORD_ID_FIELD]: row for row in rows}


def load_manual_fixes():
    manual_fixes_state['fixes'] = fetch_fixes_from_airtable(view=settings.AIRTABLE_VIEW)
    manual_fixes_state['reloaded'] = False
    manual_fixes_state['status'] = {}
    manual_fixes_state['used'] = set()


def resolve_fix(fix_id, row):
    if fix_id not in manual_fixes_state['fixes'] and not manual_fixes_state['reloaded']:
        logger.warning('Manual fix %s not found in cache; reloading without a view filter', fix_id)
        manual_fixes_state['fixes'] = fetch_fixes_from_airtable(view=None)
        manual_fixes_state['reloaded'] = True
    if fix_id not in manual_fixes_state['fixes']:
        raise AssertionError(
            f"Manual fix {fix_id} not found "
            f"(record id={row.get('id')} airtable_id={row.get(AIRTABLE_RECORD_ID_FIELD)} name={row.get('name')})"
        )
    return manual_fixes_state['fixes'][fix_id]


def apply_fixes_to_row(row):
    """Returns a new row with matching fixes applied; the input row is not mutated."""
    fixed_row = dict(row)
    for fix_id in (row.get('fixes') or []):
        fix = resolve_fix(fix_id, row)
        manual_fixes_state['used'].add(fix_id)
        manual_fixes_state['status'].setdefault(fix_id, FIX_STATUS_OBSOLETE)
        field, current_value, fixed_value = fix['field'], fix['current_value'], fix['fixed_value']
        actual_value = fixed_row.get(field)
        if field in TAXONOMY_FIX_FIELDS:
            current_value = normalize_taxonomy_slugs(current_value)
            fixed_value = normalize_taxonomy_slugs(fixed_value)
            actual_value = ','.join(sorted(actual_value or []))
        if actual_value == current_value or current_value == MATCH_ANY_VALUE:
            fixed_row[field] = fixed_value
            manual_fixes_state['status'][fix_id] = FIX_STATUS_ACTIVE
            logger.info('Manual fix applied: %s field=%s', fix_id, field)
        else:
            logger.info('Manual fix not applied (value mismatch): %s field=%s', fix_id, field)
    return fixed_row


def write_fix_statuses_to_airtable():
    records = [
        {AIRTABLE_RECORD_ID_FIELD: fix_id, 'etl_status': manual_fixes_state['status'][fix_id]}
        for fix_id in manual_fixes_state['used']
    ]
    if not records:
        return
    logger.info('Updating %d manual fix records', len(records))
    update_rows_in_airtable(settings.AIRTABLE_DATA_IMPORT_BASE, settings.AIRTABLE_MANUAL_FIXES_TABLE, records)
