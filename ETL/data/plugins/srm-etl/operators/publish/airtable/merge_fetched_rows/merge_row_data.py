"""Merge two fetched-row `data` dicts field by field into one dict."""
from .merge_field_value import merge_field_value


def merge_row_data(current_data, new_data):
    """Combine two rows' data: every field is merged via merge_field_value."""
    merged = dict(current_data)
    for field_name, new_value in new_data.items():
        merged[field_name] = merge_field_value(merged.get(field_name), new_value)
    return merged
