"""Preprocess of the Organizations table (legacy preprocess_organizations)."""
from .field_normalizers import remove_whitespaces, transform_phone_numbers, transform_urls
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key

ORGANIZATIONS_INACTIVE_STAT = 'Processing: Organizations: Inactive'
ORGANIZATIONS_NO_NAME_STAT = 'Processing: Organizations: No Name'


def normalize_organization_row(row):
    return {
        **row,
        'urls': transform_urls(row.get('urls')),
        'phone_numbers': transform_phone_numbers(row.get('phone_numbers')),
        'name': remove_whitespaces(row.get('name')),
        'short_name': remove_whitespaces(row.get('short_name')),
    }


def preprocess_organizations(raw_rows, stats):
    rows = drop_dummy_rows(raw_rows)
    rows = stats.filter_rows_with_stat(ORGANIZATIONS_INACTIVE_STAT, rows, is_active)
    rows = stats.filter_rows_with_stat(ORGANIZATIONS_NO_NAME_STAT, rows, lambda row: bool(row.get('name')))
    rows = rename_record_id_to_key(rows)
    return [normalize_organization_row(row) for row in rows]
