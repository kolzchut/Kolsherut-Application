"""Baseline collapse: the pre-merge 'keep the richest whole row' behavior.

Reproduces the old deduplicate_fetched_rows_by_id so the merge_ab check can diff
the current merge against what the previous approach would have produced. One row
per logical id wins (most populated data fields); the twin is discarded whole.
"""
EMPTY_VALUES = (None, '', [], {})


def populated_field_count(fetched_row):
    return sum(1 for value in fetched_row['data'].values() if value not in EMPTY_VALUES)


def keep_richest_rows_by_id(fetched_rows, _table_name):
    best_by_id = {}
    for fetched_row in fetched_rows:
        logical_id = fetched_row['id']
        incumbent = best_by_id.get(logical_id)
        if incumbent is None or populated_field_count(fetched_row) > populated_field_count(incumbent):
            best_by_id[logical_id] = fetched_row
    return list(best_by_id.values())
