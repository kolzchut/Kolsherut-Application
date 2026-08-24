"""Copy approved Branches from the Data-Import base into the main base
(legacy from_curation, branches block)."""
from conf import settings

from ..airtable.airtable_client import AIRTABLE_RECORD_ID_FIELD
from ..airtable.airtable_sync import sync_table_rows
from ..airtable.manual_fixes import apply_fixes_to_row
from ..airtable.stats_collector import filter_rows_and_count_removed
from .fetch_data_import_tables import DATA_IMPORT_TABLE_FIELDS
from .convert_linked_record_ids import build_row_for_sync, replace_linked_ids_with_main_record_ids
from .filter_rows_to_copy import (
    BRANCHES_INACTIVE_STAT, BRANCHES_NO_SERVICES_STAT, BRANCHES_NO_VALID_ORGANIZATION_STAT,
    BRANCHES_REJECTED_STAT, filter_active_and_decided, filter_rows_with_any_link,
)

BRANCH_LINK_FIELDS = ('services', 'org_services')


def remap_branch_location(row, updated_locations):
    """The Data-Import location is a plain location id string; it becomes a one-item
    array remapped to the main-base record id (unmapped ids kept as-is). The string is
    stripped of surrounding whitespace first so it matches the existing Location id -
    otherwise Airtable auto-creates a duplicate Location for the unmatched string."""
    location = row.get('location')
    stripped_location = location.strip() if isinstance(location, str) else location
    return {**row, 'location': [updated_locations.get(stripped_location, stripped_location)]}


def copy_branches_to_main_base(table_rows, source_id, updated_organizations, updated_locations):
    """Returns {Data-Import record id: logical branch id} for the copied rows."""
    print('Copying branches from the Data-Import base...')
    table_fields = DATA_IMPORT_TABLE_FIELDS[settings.AIRTABLE_BRANCH_TABLE]
    rows = filter_active_and_decided(table_rows, BRANCHES_INACTIVE_STAT, BRANCHES_REJECTED_STAT)
    rows = filter_rows_with_any_link(rows, BRANCHES_NO_SERVICES_STAT, BRANCH_LINK_FIELDS)
    rows = [apply_fixes_to_row(row) for row in rows]
    rows = [remap_branch_location(row, updated_locations) for row in rows]
    rows = [replace_linked_ids_with_main_record_ids(row, updated_organizations, ('organization',)) for row in rows]
    rows = filter_rows_and_count_removed(
        BRANCHES_NO_VALID_ORGANIZATION_STAT, rows,
        lambda row: len(row['organization'] or []) > 0,
    )
    updated_branches = {row[AIRTABLE_RECORD_ID_FIELD]: row['id'] for row in rows}
    rows_for_sync = [build_row_for_sync(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_BRANCH_TABLE, source_id, table_fields, rows_for_sync)
    print(f'Copied {len(rows_for_sync)} branches to the main base')
    return updated_branches
