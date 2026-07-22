"""Taxonomy lookup dicts for the card build (legacy card_data_flow prologue).

Each Situations/Responses row becomes one shared {id, name, synonyms} entry,
reachable both by its Airtable record key and by its taxonomy id - exactly like
the legacy double-keyed dicts.
"""


def build_taxonomy_lookup(rows):
    entries = [{'id': row['id'], 'name': row['name'], 'synonyms': row['synonyms']} for row in rows]
    lookup = {row['key']: entry for row, entry in zip(rows, entries)}
    lookup.update({entry['id']: entry for entry in entries})
    return lookup


def merge_unique_sorted(*value_lists):
    """Union of the given lists, None-tolerant, sorted (legacy merge_array_fields)."""
    merged = set()
    for values in value_lists:
        merged.update(values or [])
    return sorted(merged)


def copy_taxonomy_entry(entry):
    """Per-card copy, so no card shares taxonomy dicts with the lookup or with other cards."""
    return {'id': entry['id'], 'name': entry['name'], 'synonyms': list(entry['synonyms'])}
