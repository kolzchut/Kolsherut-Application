"""Copy approved Organizations from the Data-Import base into the main base
(legacy from_curation, orgs block)."""
from conf import settings

from ..airtable.airtable_client import AIRTABLE_RECORD_ID_FIELD
from ..airtable.airtable_sync import sync_table_rows
from ..airtable.manual_fixes import apply_fixes_to_row
from .fetch_data_import_tables import DATA_IMPORT_TABLE_FIELDS
from .convert_linked_record_ids import build_row_for_sync
from .filter_rows_to_copy import (
    ORGANIZATIONS_INACTIVE_STAT, ORGANIZATIONS_NO_SERVICES_STAT, ORGANIZATIONS_REJECTED_STAT,
    filter_active_and_decided, filter_rows_with_any_link,
)

ORGANIZATION_LINK_FIELDS = ('services', 'branch_services')


def copy_organizations_to_main_base(table_rows, source_id):
    """Returns {Data-Import record id: logical organization id} for the copied rows."""
    print('Copying organizations from the Data-Import base...')
    table_fields = DATA_IMPORT_TABLE_FIELDS[settings.AIRTABLE_ORGANIZATION_TABLE]
    rows = filter_active_and_decided(table_rows, ORGANIZATIONS_INACTIVE_STAT, ORGANIZATIONS_REJECTED_STAT)
    rows = filter_rows_with_any_link(rows, ORGANIZATIONS_NO_SERVICES_STAT, ORGANIZATION_LINK_FIELDS)
    rows = [apply_fixes_to_row(row) for row in rows]
    updated_organizations = {row[AIRTABLE_RECORD_ID_FIELD]: row['id'] for row in rows}
    rows_for_sync = [build_row_for_sync(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_ORGANIZATION_TABLE, source_id, table_fields, rows_for_sync)
    print(f'Copied {len(rows_for_sync)} organizations to the main base')
    return updated_organizations
