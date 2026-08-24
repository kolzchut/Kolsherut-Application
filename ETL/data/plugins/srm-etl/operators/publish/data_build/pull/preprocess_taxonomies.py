"""Preprocess of the Responses and Situations tables (legacy preprocess_responses/situations)."""
from ...airtable.stats_collector import filter_rows_and_count_removed
from .preprocess_common import drop_dummy_rows, is_active, rename_record_id_to_key

RESPONSES_INACTIVE_STAT = 'Processing: Responses: Inactive'
SITUATIONS_INACTIVE_STAT = 'Processing: Situations: Inactive'


def split_synonyms(value):
    return list(value.strip().split('\n')) if value else []


def preprocess_taxonomy_rows(raw_rows, inactive_stat_name):
    rows = drop_dummy_rows(raw_rows)
    rows = filter_rows_and_count_removed(inactive_stat_name, rows, is_active)
    rows = rename_record_id_to_key(rows)
    return [{**row, 'synonyms': split_synonyms(row.get('synonyms'))} for row in rows]


def preprocess_responses(raw_rows):
    return preprocess_taxonomy_rows(raw_rows, RESPONSES_INACTIVE_STAT)


def preprocess_situations(raw_rows):
    return preprocess_taxonomy_rows(raw_rows, SITUATIONS_INACTIVE_STAT)
