"""Plain-Python replacement for srm_tools.update_table.airtable_updater.

Semantics preserved exactly: upsert by logical id, write only new or changed
rows (legacy hash comparison), rows that vanished from the fetch become
INACTIVE, and Airtable record ids are always preserved.
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import AIRTABLE_RECORD_ID_FIELD, fetch_rows_from_airtable, create_or_update_rows_in_airtable

ACTIVE_STATUS = 'ACTIVE'
INACTIVE_STATUS = 'INACTIVE'
PLACEHOLDER_ROW_SOURCE = 'dummy'


def hash_row(row, table_fields):
    """Exact replica of the legacy update_table.hash_row - do not modify."""
    joined = '###'.join([str(row.get(field)) for field in table_fields + ['source', 'status']])
    return joined.replace('\n', '').replace(' ', '').replace('\t', '')


def merge_fetched_row(logical_id, data, current_row, source_id, table_fields):
    """Replica of the legacy full-outer join + status/source + update_mapper steps."""
    merged = {field: (current_row or {}).get(field) for field in table_fields}
    merged['id'] = logical_id
    merged['status'] = ACTIVE_STATUS if data else INACTIVE_STATUS
    merged['source'] = source_id
    merged[AIRTABLE_RECORD_ID_FIELD] = (current_row or {}).get(AIRTABLE_RECORD_ID_FIELD)
    if data:
        merged.update(data)
    return merged


def select_written_fields(row, table_fields):
    selected = {field: row.get(field) for field in table_fields}
    selected['id'] = row.get('id')
    selected['source'] = row.get('source')
    selected['status'] = row.get('status')
    selected[AIRTABLE_RECORD_ID_FIELD] = row.get(AIRTABLE_RECORD_ID_FIELD)
    return selected


NEW_ROW = 'new'
DIFFERENT_ROW = 'different'
UNCHANGED_ROW = 'unchanged'


def classify_merged_row(merged, current_row, table_fields):
    if current_row is None:
        return NEW_ROW
    if hash_row(current_row, table_fields) != hash_row(merged, table_fields):
        return DIFFERENT_ROW
    return UNCHANGED_ROW


def merge_all_rows(fetched_rows, current_rows_by_id, source_id, table_fields):
    """Fetched rows merged with their current twins, then the current-only leftovers."""
    merged_rows = [
        (merge_fetched_row(fetched['id'], fetched['data'], current_rows_by_id.get(fetched['id']), source_id, table_fields),
         current_rows_by_id.get(fetched['id']))
        for fetched in fetched_rows
    ]
    fetched_ids = {fetched['id'] for fetched in fetched_rows}
    merged_rows += [
        (merge_fetched_row(logical_id, None, current_row, source_id, table_fields), current_row)
        for logical_id, current_row in current_rows_by_id.items() if logical_id not in fetched_ids
    ]
    return merged_rows


def collect_changed_rows(fetched_rows, current_rows_by_id, source_id, table_fields):
    """Merge fetched rows with the current table state; keep only new or changed rows."""
    changed = []
    write_counts = {'existing': 0, 'new': 0, 'different': 0}
    for merged, current_row in merge_all_rows(fetched_rows, current_rows_by_id, source_id, table_fields):
        classification = classify_merged_row(merged, current_row, table_fields)
        if current_row is not None:
            write_counts['existing'] += 1
        if classification != UNCHANGED_ROW:
            write_counts[classification] += 1
            changed.append(merged)
    return changed, write_counts


def sync_table_rows(table_name, source_id, table_fields, fetched_rows, airtable_base=None):
    """Sync fetched {id, data} rows into an Airtable table, exactly like airtable_updater."""
    base_id = airtable_base or settings.AIRTABLE_BASE
    current_rows = fetch_rows_from_airtable(base_id, table_name)
    current_rows = [row for row in current_rows if row.get('source') in (source_id, PLACEHOLDER_ROW_SOURCE)]
    current_rows_by_id = {row['id']: row for row in current_rows}
    changed, write_counts = collect_changed_rows(fetched_rows, current_rows_by_id, source_id, table_fields)
    logger.info(
        '%s (%s) -- Existing: %d, New: %d, Different: %d',
        table_name, source_id, write_counts['existing'], write_counts['new'], write_counts['different'],
    )
    create_or_update_rows_in_airtable(base_id, table_name, [select_written_fields(row, table_fields) for row in changed])
    return write_counts
