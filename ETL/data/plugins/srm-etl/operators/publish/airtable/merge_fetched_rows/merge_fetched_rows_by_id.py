"""Collapse duplicate logical ids before an Airtable upsert into ONE merged row.

Airtable rejects two updates to the same record in a single request, so a logical
id must appear at most once per sync batch. Rows sharing an id are merged field by
field: list/connection fields are unioned so no link is lost; scalar fields take
the latest non-empty value.
"""
from srm_tools.logger import logger

from .merge_row_data import merge_row_data


def accumulate_row(merged_by_id, duplicate_ids, fetched_row):
    """Seed the id on first sight, otherwise merge into the accumulated row."""
    logical_id = fetched_row['id']
    if logical_id not in merged_by_id:
        merged_by_id[logical_id] = dict(fetched_row['data'])
    else:
        duplicate_ids.add(logical_id)
        merged_by_id[logical_id] = merge_row_data(merged_by_id[logical_id], fetched_row['data'])


def warn_merged_ids(table_name, duplicate_ids):
    for logical_id in duplicate_ids:
        logger.warning(
            'MERGED duplicate %s rows for id=%r (unioned links, latest scalars)',
            table_name, logical_id,
        )


def merge_fetched_rows_by_id(fetched_rows, table_name):
    merged_by_id = {}
    duplicate_ids = set()
    for fetched_row in fetched_rows:
        accumulate_row(merged_by_id, duplicate_ids, fetched_row)
    warn_merged_ids(table_name, duplicate_ids)
    return [{'id': logical_id, 'data': data} for logical_id, data in merged_by_id.items()]
