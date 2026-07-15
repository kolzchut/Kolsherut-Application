"""Group generated rows by query and score them (legacy join_with_self + score transforms).

Rows are grouped in importance order, so the first (most important) occurrence
supplies every field value; the duplicate count becomes (ln(count) + 1)^2, and
a query that was low-confidence in every occurrence scores 0.5.
"""
import math

LOW_CONFIDENCE_SCORE = 0.5


def group_query_rows(query_rows):
    ordered_rows = sorted(query_rows, key=lambda row: row['importance'])
    grouped_by_query = {}
    for row in ordered_rows:
        existing = grouped_by_query.get(row['query'])
        if existing is None:
            grouped_by_query[row['query']] = {**row, 'score': 1}
        else:
            existing['score'] += 1
            existing['low'] = min(existing['low'], row['low'])
    return list(grouped_by_query.values())


def scored_query_row(row):
    duplicate_count_score = (math.log(row['score']) + 1) ** 2
    return {**row, 'score': LOW_CONFIDENCE_SCORE if row['low'] else duplicate_count_score}


def apply_query_scores(grouped_rows):
    return [scored_query_row(row) for row in grouped_rows]
