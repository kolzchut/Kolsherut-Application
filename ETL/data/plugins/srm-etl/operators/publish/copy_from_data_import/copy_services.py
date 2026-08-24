"""Copy approved Services from the Data-Import base into the main base
(legacy from_curation, services block)."""
from conf import settings

from ..airtable.airtable_sync import sync_table_rows
from ..airtable.manual_fixes import apply_fixes_to_row
from ..airtable.stats_collector import filter_rows_and_count_removed
from .fetch_data_import_tables import DATA_IMPORT_TABLE_FIELDS
from .convert_linked_record_ids import build_row_for_sync, replace_linked_ids_with_main_record_ids
from .filter_rows_to_copy import (
    SERVICES_INACTIVE_STAT, SERVICES_NO_VALID_LINKS_STAT, SERVICES_REJECTED_STAT,
    filter_active_and_decided,
)


def copy_services_to_main_base(table_rows, source_id, updated_organizations, updated_branches):
    print('Copying services from the Data-Import base...')
    table_fields = DATA_IMPORT_TABLE_FIELDS[settings.AIRTABLE_SERVICE_TABLE]
    rows = filter_active_and_decided(table_rows, SERVICES_INACTIVE_STAT, SERVICES_REJECTED_STAT)
    rows = [apply_fixes_to_row(row) for row in rows]
    rows = [replace_linked_ids_with_main_record_ids(row, updated_organizations, ('organizations',)) for row in rows]
    rows = [replace_linked_ids_with_main_record_ids(row, updated_branches, ('branches',)) for row in rows]
    rows = filter_rows_and_count_removed(
        SERVICES_NO_VALID_LINKS_STAT, rows,
        lambda row: len(row['organizations'] or []) > 0 or len(row['branches'] or []) > 0,
    )
    rows_for_sync = [build_row_for_sync(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_SERVICE_TABLE, source_id, table_fields, rows_for_sync)
    print(f'Copied {len(rows_for_sync)} services to the main base')
