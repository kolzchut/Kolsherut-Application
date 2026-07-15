"""Preprocess of the Organizations table (legacy preprocess_organizations)."""
from ...airtable.stats_collector import filter_rows_and_count_removed
from .field_normalizers import remove_whitespaces, normalize_phone_numbers, normalize_urls
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key

ORGANIZATIONS_INACTIVE_STAT = 'Processing: Organizations: Inactive'
ORGANIZATIONS_NO_NAME_STAT = 'Processing: Organizations: No Name'


def normalize_organization_row(row):
    return {
        **row,
        'urls': normalize_urls(row.get('urls')),
        'phone_numbers': normalize_phone_numbers(row.get('phone_numbers')),
        'name': remove_whitespaces(row.get('name')),
        'short_name': remove_whitespaces(row.get('short_name')),
    }


def preprocess_organizations(raw_rows):
    rows = drop_dummy_rows(raw_rows)
    rows = filter_rows_and_count_removed(ORGANIZATIONS_INACTIVE_STAT, rows, is_active)
    rows = filter_rows_and_count_removed(ORGANIZATIONS_NO_NAME_STAT, rows, lambda row: bool(row.get('name')))
    rows = rename_record_id_to_key(rows)
    return [normalize_organization_row(row) for row in rows]
