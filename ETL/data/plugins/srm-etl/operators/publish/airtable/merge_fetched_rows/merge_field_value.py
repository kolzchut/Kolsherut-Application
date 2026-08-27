"""Merge one field's value across duplicate rows sharing a logical id.

List/connection fields are unioned (order-preserving) so no link is ever lost;
scalar fields keep the first non-empty value. Two non-empty scalars that
disagree are a DISPUTE the merge cannot decide by itself - the caller resolves
them against the main base (see resolve_disputed_scalars).
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


def is_scalar_conflict(current_value, new_value):
    """True when two non-empty, non-list values disagree - a dispute to resolve."""
    if isinstance(current_value, list) or isinstance(new_value, list):
        return False
    if current_value in EMPTY_VALUES or new_value in EMPTY_VALUES:
        return False
    return current_value != new_value


def merge_field_value(current_value, new_value):
    """List fields are unioned; scalar fields keep the first non-empty value."""
    if isinstance(current_value, list) or isinstance(new_value, list):
        return union_link_lists(current_value, new_value)
    return current_value if current_value not in EMPTY_VALUES else new_value
