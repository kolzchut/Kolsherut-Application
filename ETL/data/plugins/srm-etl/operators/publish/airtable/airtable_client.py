"""Thin Airtable REST wrapper (pyairtable) used by every publish stage.

Rows are plain dicts: every field name seen on any record (plus the explicitly
requested ones) is present on every row, missing values normalized to None, and
the Airtable record id is exposed under RECORD_ID_FIELD - the same key the
legacy dataflows_airtable loader used, so verification diffs align.
"""
from pyairtable import Api

from conf import settings

RECORD_ID_FIELD = '__airtable_id'


def _table(base_id, table_name):
    return Api(settings.AIRTABLE_API_KEY).table(base_id, table_name)


def _normalize_rows(records, requested_fields):
    field_names = set(requested_fields or [])
    for record in records:
        field_names.update(record['fields'].keys())
    rows = []
    for record in records:
        row = {name: record['fields'].get(name) for name in field_names}
        row[RECORD_ID_FIELD] = record['id']
        rows.append(row)
    return rows


def list_table_rows(base_id, table_name, view=settings.AIRTABLE_VIEW, fields=None):
    """Fetch a whole table. Pass view=None explicitly to fetch without a view filter."""
    query_options = {}
    if view:
        query_options['view'] = view
    if fields:
        query_options['fields'] = fields
    records = _table(base_id, table_name).all(**query_options)
    return _normalize_rows(records, fields)


def batch_update_rows(base_id, table_name, rows):
    """Update existing records; every row must carry RECORD_ID_FIELD."""
    records = [
        {'id': row[RECORD_ID_FIELD], 'fields': {key: value for key, value in row.items() if key != RECORD_ID_FIELD}}
        for row in rows
    ]
    if records:
        _table(base_id, table_name).batch_update(records, typecast=True)


def batch_create_rows(base_id, table_name, rows):
    """Create new records; RECORD_ID_FIELD is stripped if present."""
    records = [
        {key: value for key, value in row.items() if key != RECORD_ID_FIELD}
        for row in rows
    ]
    if records:
        _table(base_id, table_name).batch_create(records, typecast=True)


def upsert_rows(base_id, table_name, rows):
    """Update rows that carry a record id, create the ones that do not."""
    batch_update_rows(base_id, table_name, [row for row in rows if row.get(RECORD_ID_FIELD)])
    batch_create_rows(base_id, table_name, [row for row in rows if not row.get(RECORD_ID_FIELD)])
