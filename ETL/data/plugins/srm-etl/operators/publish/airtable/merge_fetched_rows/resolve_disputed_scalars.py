"""Resolve scalar fields that duplicate Data-Import rows disagree on.

A disputed scalar keeps the value already stored in the main base when there is
one - so a curated value is never overwritten by a raw duplicate (the legacy
no-dedup pipeline preserved the curated value too, by accident). When the main
base has no value the first non-empty duplicate value (already in the merged
data) is kept. Every dispute is logged so curators can review the losers.
"""
from srm_tools.logger import logger

from .merge_field_value import EMPTY_VALUES


def resolve_disputed_scalars(logical_id, merged_data, disputed_field_names, current_row):
    """Returns a new data dict with every disputed field resolved."""
    resolved = dict(merged_data)
    for field_name in sorted(disputed_field_names):
        current_value = (current_row or {}).get(field_name)
        if current_value not in EMPTY_VALUES:
            resolved[field_name] = current_value
        logger.warning(
            'DISPUTED scalar %r on duplicate rows id=%r resolved to %r',
            field_name, logical_id, resolved[field_name],
        )
    return resolved
