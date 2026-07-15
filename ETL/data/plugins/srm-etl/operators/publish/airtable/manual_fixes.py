"""Manual fixes from the curation base: apply per row, report etl_status back.

Plain-Python port of the legacy derive ManualFixes. Behavior preserved: one
fallback reload without the view filter, AssertionError when a referenced fix
is still missing, taxonomy fields compared as normalized sorted id sets, and a
batched etl_status write-back (Active if applied at least once, else Obsolete).
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import RECORD_ID_FIELD, batch_update_rows, list_table_rows

FIX_STATUS_ACTIVE = 'Active'
FIX_STATUS_OBSOLETE = 'Obsolete'
MATCH_ANY_VALUE = '*'
TAXONOMY_FIX_FIELDS = ('responses', 'situations')


def normalize_taxonomy_slugs(slugs):
    slugs = slugs or ''
    return ','.join(sorted(filter(None, set(slug.strip() for slug in slugs.split(',')))))


class ManualFixes:

    def __init__(self):
        self.reloaded = False
        self.fixes = self._load_fixes(view=settings.AIRTABLE_VIEW)
        self.status = {}
        self.used = set()

    def _load_fixes(self, view):
        rows = list_table_rows(settings.AIRTABLE_DATA_IMPORT_BASE, settings.AIRTABLE_MANUAL_FIXES_TABLE, view=view)
        logger.info('Got %d manual fix records (view=%s)', len(rows), view)
        return {row[RECORD_ID_FIELD]: row for row in rows}

    def _resolve_fix(self, fix_id, row):
        if fix_id not in self.fixes and not self.reloaded:
            logger.warning('Manual fix %s not found in cache; reloading without a view filter', fix_id)
            self.fixes = self._load_fixes(view=None)
            self.reloaded = True
        if fix_id not in self.fixes:
            raise AssertionError(
                f"Manual fix {fix_id} not found "
                f"(record id={row.get('id')} airtable_id={row.get(RECORD_ID_FIELD)} name={row.get('name')})"
            )
        return self.fixes[fix_id]

    def apply_to_row(self, row):
        """Returns a new row with matching fixes applied; the input row is not mutated."""
        fixed_row = dict(row)
        for fix_id in (row.get('fixes') or []):
            fix = self._resolve_fix(fix_id, row)
            self.used.add(fix_id)
            self.status.setdefault(fix_id, FIX_STATUS_OBSOLETE)
            field, current_value, fixed_value = fix['field'], fix['current_value'], fix['fixed_value']
            actual_value = fixed_row.get(field)
            if field in TAXONOMY_FIX_FIELDS:
                current_value = normalize_taxonomy_slugs(current_value)
                fixed_value = normalize_taxonomy_slugs(fixed_value)
                actual_value = ','.join(sorted(actual_value or []))
            if actual_value == current_value or current_value == MATCH_ANY_VALUE:
                fixed_row[field] = fixed_value
                self.status[fix_id] = FIX_STATUS_ACTIVE
                logger.info('Manual fix applied: %s field=%s', fix_id, field)
            else:
                logger.info('Manual fix not applied (value mismatch): %s field=%s', fix_id, field)
        return fixed_row

    def finalize(self):
        records = [
            {RECORD_ID_FIELD: fix_id, 'etl_status': self.status[fix_id]}
            for fix_id in self.used
        ]
        if not records:
            return
        logger.info('Updating %d manual fix records', len(records))
        batch_update_rows(settings.AIRTABLE_DATA_IMPORT_BASE, settings.AIRTABLE_MANUAL_FIXES_TABLE, records)
