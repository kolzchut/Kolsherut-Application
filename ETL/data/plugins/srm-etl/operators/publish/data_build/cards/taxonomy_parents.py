"""Taxonomy ancestor expansion (legacy helpers.update_taxonomy_with_parents)."""
from .taxonomy_lookup import copy_taxonomy_entry

MINIMUM_TAXONOMY_DEPTH = 2


def update_taxonomy_with_parents(ids):
    """Every id expanded with all its ancestors of at least two segments, sorted."""
    expanded = set()
    for taxonomy_id in (ids or []):
        parts = taxonomy_id.split(':')
        for depth in range(MINIMUM_TAXONOMY_DEPTH, len(parts) + 1):
            expanded.add(':'.join(parts[:depth]))
    return sorted(expanded)


def add_taxonomy_parent_fields(card, situations_lookup, responses_lookup):
    situation_ids_parents = update_taxonomy_with_parents(card['situation_ids'])
    response_ids_parents = update_taxonomy_with_parents(card['response_ids'])
    return {
        **card,
        'situation_ids_parents': situation_ids_parents,
        'response_ids_parents': response_ids_parents,
        'situations_parents': [
            copy_taxonomy_entry(situations_lookup[taxonomy_id])
            for taxonomy_id in situation_ids_parents if taxonomy_id in situations_lookup
        ],
        'responses_parents': [
            copy_taxonomy_entry(responses_lookup[taxonomy_id])
            for taxonomy_id in response_ids_parents if taxonomy_id in responses_lookup
        ],
    }
