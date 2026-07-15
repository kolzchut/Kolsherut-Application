"""Preprocess of the Responses and Situations tables (legacy preprocess_responses/situations)."""
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key

RESPONSES_INACTIVE_STAT = 'Processing: Responses: Inactive'
SITUATIONS_INACTIVE_STAT = 'Processing: Situations: Inactive'


def split_synonyms(value):
    return list(value.strip().split('\n')) if value else []


def preprocess_taxonomy_rows(raw_rows, stats, inactive_stat_name):
    rows = drop_dummy_rows(raw_rows)
    rows = stats.filter_rows_with_stat(inactive_stat_name, rows, is_active)
    rows = rename_record_id_to_key(rows)
    return [{**row, 'synonyms': split_synonyms(row.get('synonyms'))} for row in rows]


def preprocess_responses(raw_rows, stats):
    return preprocess_taxonomy_rows(raw_rows, stats, RESPONSES_INACTIVE_STAT)


def preprocess_situations(raw_rows, stats):
    return preprocess_taxonomy_rows(raw_rows, stats, SITUATIONS_INACTIVE_STAT)
