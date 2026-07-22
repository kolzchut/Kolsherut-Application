"""Row-level preprocess steps shared by every main-base table (legacy helpers.py)."""
from ...airtable.airtable_client import AIRTABLE_RECORD_ID_FIELD

ACTIVE_STATUS = 'ACTIVE'
PLACEHOLDER_ROW_MARKER = 'dummy'
ROW_KEY_FIELD = 'key'  # the Airtable record id, renamed to 'key' on every pulled row


def drop_dummy_rows(rows):
    return [
        row for row in rows
        if not any([row.get('id') == PLACEHOLDER_ROW_MARKER, row.get('name') == PLACEHOLDER_ROW_MARKER])
    ]


def is_active(row):
    return str(row.get('status') or '').strip().upper() == ACTIVE_STATUS


def rename_record_id_to_key(rows):
    return [
        {**{name: value for name, value in row.items() if name != AIRTABLE_RECORD_ID_FIELD},
         ROW_KEY_FIELD: row[AIRTABLE_RECORD_ID_FIELD]}
        for row in rows
    ]


def select_row_fields(row, field_names):
    return {name: row.get(name) for name in field_names}
