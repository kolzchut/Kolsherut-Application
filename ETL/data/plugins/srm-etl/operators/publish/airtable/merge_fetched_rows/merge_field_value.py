"""Merge one field's value across duplicate rows sharing a logical id.

List/connection fields are unioned (order-preserving) so no link is ever lost;
scalar fields take the latest non-empty value.
"""

EMPTY_VALUES = (None, '', [], {})


def coerce_to_list(value):
    """Wrap a scalar in a single-item list; empty values become []."""
    if value in EMPTY_VALUES:
        return []
    return value if isinstance(value, list) else [value]


def union_link_lists(current_value, new_value):
    """Order-preserving union of two values (current first, dedupe by value)."""
    current_items = coerce_to_list(current_value)
    new_items = coerce_to_list(new_value)
    return current_items + [item for item in new_items if item not in current_items]


def merge_field_value(current_value, new_value):
    """List fields are unioned; scalar fields take the latest non-empty value."""
    if isinstance(current_value, list) or isinstance(new_value, list):
        return union_link_lists(current_value, new_value)
    return new_value if new_value not in EMPTY_VALUES else current_value
