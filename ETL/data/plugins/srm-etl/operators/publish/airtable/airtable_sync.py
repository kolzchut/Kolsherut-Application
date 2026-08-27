"""Plain-Python replacement for srm_tools.update_table.airtable_updater.

Semantics preserved exactly: upsert by logical id, write only new or changed
rows (legacy hash comparison), rows that vanished from the fetch become
INACTIVE, and Airtable record ids are always preserved. The current table
state is fetched BEFORE the duplicate-id merge so the merge can resolve
disputed scalars against it (see merge_fetched_rows). transform_merged_data,
when given, runs on each merged row's data right after the merge - the copy
stage uses it to re-apply manual fixes the merge may have clobbered.
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import fetch_rows_from_airtable, create_or_update_rows_in_airtable
from .airtable_sync_change_detection import collect_changed_rows, select_written_fields
from .merge_fetched_rows import merge_fetched_rows_by_id

PLACEHOLDER_ROW_SOURCE = 'dummy'


def transform_merged_rows(fetched_rows, transform_merged_data):
    return [{'id': row['id'], 'data': transform_merged_data(row['data'])} for row in fetched_rows]


def sync_table_rows(table_name, source_id, table_fields, fetched_rows,
                    airtable_base=None, transform_merged_data=None):
    """Sync fetched {id, data} rows into an Airtable table, exactly like airtable_updater."""
    base_id = airtable_base or settings.AIRTABLE_BASE
    current_rows = fetch_rows_from_airtable(base_id, table_name)
    current_rows = [row for row in current_rows if row.get('source') in (source_id, PLACEHOLDER_ROW_SOURCE)]
    current_rows_by_id = {row['id']: row for row in current_rows}
    fetched_rows = merge_fetched_rows_by_id(fetched_rows, table_name, current_rows_by_id)
    if transform_merged_data:
        fetched_rows = transform_merged_rows(fetched_rows, transform_merged_data)
    changed, write_counts = collect_changed_rows(fetched_rows, current_rows_by_id, source_id, table_fields)
    logger.info(
        '%s (%s) -- Existing: %d, New: %d, Different: %d',
        table_name, source_id, write_counts['existing'], write_counts['new'], write_counts['different'],
    )
    create_or_update_rows_in_airtable(base_id, table_name, [select_written_fields(row, table_fields) for row in changed])
    return write_counts
