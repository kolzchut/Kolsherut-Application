"""Merge two fetched-row `data` dicts field by field into one dict."""
from .merge_field_value import is_scalar_conflict, merge_field_value


def merge_row_data(current_data, new_data):
    """Returns (merged data, names of the scalar fields the two rows disagree on)."""
    merged = dict(current_data)
    disputed_field_names = set()
    for field_name, new_value in new_data.items():
        if is_scalar_conflict(merged.get(field_name), new_value):
            disputed_field_names.add(field_name)
        merged[field_name] = merge_field_value(merged.get(field_name), new_value)
    return merged, disputed_field_names
