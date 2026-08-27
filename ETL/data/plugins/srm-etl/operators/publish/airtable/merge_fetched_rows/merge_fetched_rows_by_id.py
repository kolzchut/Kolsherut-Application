"""Collapse duplicate logical ids before an Airtable upsert into ONE merged row.

Airtable rejects two updates to the same record in a single request, so a logical
id must appear at most once per sync batch. Rows sharing an id are merged field by
field: list/connection fields are unioned so no link is lost; scalar fields keep
the first non-empty value. Scalars the duplicates DISAGREE on are resolved against
the current main-base row (resolve_disputed_scalars), so a raw duplicate can never
overwrite a curated value.
"""
from srm_tools.logger import logger

from .merge_row_data import merge_row_data
from .resolve_disputed_scalars import resolve_disputed_scalars


def accumulate_row(merged_by_id, duplicate_ids, disputed_by_id, fetched_row):
    """Seed the id on first sight, otherwise merge into the accumulated row."""
    logical_id = fetched_row['id']
    if logical_id not in merged_by_id:
        merged_by_id[logical_id] = dict(fetched_row['data'])
        return
    duplicate_ids.add(logical_id)
    merged_data, disputed_field_names = merge_row_data(merged_by_id[logical_id], fetched_row['data'])
    merged_by_id[logical_id] = merged_data
    if disputed_field_names:
        disputed_by_id.setdefault(logical_id, set()).update(disputed_field_names)


def warn_merged_ids(table_name, duplicate_ids):
    for logical_id in duplicate_ids:
        logger.warning(
            'MERGED duplicate %s rows for id=%r (unioned links, first non-empty scalars)',
            table_name, logical_id,
        )


def merge_fetched_rows_by_id(fetched_rows, table_name, current_rows_by_id=None):
    merged_by_id = {}
    duplicate_ids = set()
    disputed_by_id = {}
    for fetched_row in fetched_rows:
        accumulate_row(merged_by_id, duplicate_ids, disputed_by_id, fetched_row)
    warn_merged_ids(table_name, duplicate_ids)
    for logical_id, disputed_field_names in disputed_by_id.items():
        merged_by_id[logical_id] = resolve_disputed_scalars(
            logical_id, merged_by_id[logical_id], disputed_field_names,
            (current_rows_by_id or {}).get(logical_id),
        )
    return [{'id': logical_id, 'data': data} for logical_id, data in merged_by_id.items()]
