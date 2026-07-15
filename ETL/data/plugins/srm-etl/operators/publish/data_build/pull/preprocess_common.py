"""Row-level preprocess steps shared by every main-base table (legacy helpers.py)."""
from ...airtable.airtable_client import RECORD_ID_FIELD

ACTIVE_STATUS = 'ACTIVE'
DUMMY_MARKER = 'dummy'
STAGING_PRIMARY_KEY = 'key'


def drop_dummy_rows(rows):
    return [
        row for row in rows
        if not any([row.get('id') == DUMMY_MARKER, row.get('name') == DUMMY_MARKER])
    ]


def is_active(row):
    return str(row.get('status') or '').strip().upper() == ACTIVE_STATUS


def rename_record_id_to_key(rows):
    return [
        {**{name: value for name, value in row.items() if name != RECORD_ID_FIELD},
         STAGING_PRIMARY_KEY: row[RECORD_ID_FIELD]}
        for row in rows
    ]


def select_row_fields(row, field_names):
    return {name: row.get(name) for name in field_names}
