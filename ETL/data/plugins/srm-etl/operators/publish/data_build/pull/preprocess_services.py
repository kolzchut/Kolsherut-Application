"""Preprocess of the Services table (legacy preprocess_services)."""
from .field_normalizers import split_lines, transform_phone_numbers, transform_urls
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key

SERVICES_INACTIVE_STAT = 'Processing: Services: Inactive'
MANUAL_SOURCE_FIELDS_TO_DROP = ('situations_manual', 'responses_manual', 'name_manual', 'responses_manual_ids')


def normalize_service_row(row):
    kept_fields = {
        name: value for name, value in row.items()
        if name not in MANUAL_SOURCE_FIELDS_TO_DROP
    }
    return {
        **kept_fields,
        'urls': transform_urls(row.get('urls')),
        'name': row.get('name_manual') or row.get('name'),
        'situation_ids': row.get('situations_manual_ids') or row.get('situation_ids'),
        'response_ids': row.get('responses_manual_ids') or row.get('response_ids'),
        'boost': row.get('boost') or 0,
        'phone_numbers': transform_phone_numbers(row.get('phone_numbers')),
        'data_sources': split_lines(row.get('data_sources')),
    }


def preprocess_services(raw_rows, stats):
    rows = drop_dummy_rows(raw_rows)
    rows = stats.filter_rows_with_stat(SERVICES_INACTIVE_STAT, rows, is_active)
    rows = rename_record_id_to_key(rows)
    return [normalize_service_row(row) for row in rows]
