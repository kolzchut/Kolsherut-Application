"""Preprocess of the Branches table (legacy preprocess_branches)."""
from ...airtable.stats_collector import filter_rows_and_count_removed
from .field_normalizers import remove_whitespaces, normalize_phone_numbers, normalize_urls
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key, select_row_fields

BRANCHES_INACTIVE_STAT = 'Processing: Branches: Inactive'
BRANCH_FIELDS = (
    'key', 'id', 'source', 'status', 'name', 'organization', 'operating_unit', 'location',
    'address', 'address_details', 'description', 'phone_numbers', 'email_address', 'urls',
    'manual_url', 'fixes', 'situations', 'services', 'last_modified',
)


def normalize_branch_row(row):
    return {
        **row,
        'urls': normalize_urls(row.get('urls')),
        'phone_numbers': normalize_phone_numbers(row.get('phone_numbers')),
        'name': remove_whitespaces(row.get('name')),
    }


def preprocess_branches(raw_rows):
    rows = drop_dummy_rows(raw_rows)
    rows = filter_rows_and_count_removed(BRANCHES_INACTIVE_STAT, rows, is_active)
    rows = rename_record_id_to_key(rows)
    rows = [select_row_fields(row, BRANCH_FIELDS) for row in rows]
    return [normalize_branch_row(row) for row in rows]
