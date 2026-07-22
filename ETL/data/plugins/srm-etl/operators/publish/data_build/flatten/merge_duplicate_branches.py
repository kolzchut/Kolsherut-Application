"""Branch deduplication (legacy merge_duplicate_branches).

Dedup key = hasher(organization_id, geometry-or-branch_id, branch_name). The
first row wins; later duplicates merge into it field by field: None filled,
lists unioned (existing items first), differing strings only logged - with the
incoming and existing branch ids - when fuzzy similarity < 80. Every original
branch_key -> merged key is returned as the branch mapping consumed by the flat
services builder. Pure: input rows are never mutated.
"""
from thefuzz import fuzz

from srm_tools.hash import hasher
from srm_tools.logger import logger

FUZZY_SIMILARITY_THRESHOLD = 80
MERGE_EXEMPT_FIELDS = ('branch_id', 'branch_key', 'branch_orig_address', 'branch_name')


def calculate_merged_branch_key(row):
    geometry = row['branch_geometry'] or [row['branch_id']]
    return hasher(row['organization_id'], ';'.join(map(str, geometry)), row['branch_name'])


def merged_field_value(existing, incoming_branch_id, field_name, incoming_value):
    existing_value = existing.get(field_name)
    if None in (existing_value, incoming_value):
        return existing_value or incoming_value
    if isinstance(incoming_value, list):
        return existing_value + [item for item in incoming_value if item not in existing_value]
    if isinstance(incoming_value, str):
        similarity = fuzz.ratio(existing_value, incoming_value)
        if similarity < FUZZY_SIMILARITY_THRESHOLD:
            logger.warning(
                'Duplicate branch for %s, %s: too different in %s (%s != %s - ratio %s)',
                incoming_branch_id, existing['branch_id'], field_name, incoming_value, existing_value, similarity,
            )
        return existing_value
    logger.warning(
        'Duplicate branch for %s, %s: differs in %s (%s != %s)',
        incoming_branch_id, existing['branch_id'], field_name, incoming_value, existing_value,
    )
    return existing_value


def merge_row_into_existing(row, existing):
    merged = dict(existing)
    for field_name, value in row.items():
        if field_name in MERGE_EXEMPT_FIELDS:
            continue
        if existing.get(field_name) != value:
            merged[field_name] = merged_field_value(existing, row['branch_id'], field_name, value)
    return merged


def merge_duplicate_branches(rows):
    """Return (merged rows with organization_branch_count, original key -> merged key mapping)."""
    merged_by_key = {}
    branch_mapping = {}
    organization_branch_counts = {}
    for row in rows:
        merged_key = calculate_merged_branch_key(row)
        branch_mapping[row['branch_key']] = merged_key
        if merged_key in merged_by_key:
            merged_by_key[merged_key] = merge_row_into_existing(row, merged_by_key[merged_key])
        else:
            merged_by_key[merged_key] = {**row, 'branch_key': merged_key}
            organization_id = row['organization_id']
            organization_branch_counts[organization_id] = organization_branch_counts.get(organization_id, 0) + 1
    merged_rows = [
        {**row, 'organization_branch_count': organization_branch_counts[row['organization_id']]}
        for row in merged_by_key.values()
    ]
    logger.info('Branch deduplication: %d rows, %d unique', len(rows), len(merged_rows))
    return merged_rows, branch_mapping
