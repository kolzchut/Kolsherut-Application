from evaluation import vars
from evaluation.strings import (
    PER_QUERY_CSV_EMPTY_GT_HEADER,
    PER_QUERY_CSV_GT_SIZE_HEADER,
    PER_QUERY_CSV_HITS_HEADER_TEMPLATE,
    PER_QUERY_CSV_MISSED_COUNT_HEADER,
    PER_QUERY_CSV_QUERY_HEADER,
    PER_QUERY_CSV_RETURNED_COUNT_HEADER,
    PER_QUERY_CSV_SKIP_REASON_HEADER,
    PER_QUERY_CSV_UNEXPECTED_COUNT_HEADER,
)

BLANK_CELL = ''


def build_per_query_header() -> list[str]:
    """returned_count and the two diff counts sit next to ground_truth_size so the whole
    count story - how many, how many missed, how many extra - reads at a glance. The names
    behind those counts live in the service-diff CSV."""
    hits_headers = [PER_QUERY_CSV_HITS_HEADER_TEMPLATE.format(k=k) for k in vars.K_VALUES]
    return [
        PER_QUERY_CSV_QUERY_HEADER, PER_QUERY_CSV_GT_SIZE_HEADER,
        PER_QUERY_CSV_RETURNED_COUNT_HEADER, PER_QUERY_CSV_MISSED_COUNT_HEADER,
        PER_QUERY_CSV_UNEXPECTED_COUNT_HEADER, PER_QUERY_CSV_EMPTY_GT_HEADER,
        PER_QUERY_CSV_SKIP_REASON_HEADER, *vars.PER_QUERY_SET_METRIC_KEYS, *hits_headers,
    ]


def build_set_metric_cells(entry: dict) -> list:
    set_metrics = entry.get('set_metrics') or {}
    return [set_metrics.get(metric_key, BLANK_CELL) for metric_key in vars.PER_QUERY_SET_METRIC_KEYS]


def build_diff_count_cells(entry: dict, was_skipped: bool) -> list:
    """How many ground-truth services retrieval missed, and how many extra ones it returned."""
    if was_skipped:
        return [BLANK_CELL, BLANK_CELL]
    return [len(entry['missed_ground_truth_names']), len(entry['unexpected_retrieved_names'])]


def build_per_query_row(entry: dict) -> list:
    """Skipped rows never reached retrieval, so their count and metric cells stay blank
    rather than reading as genuine zeroes."""
    hits = [entry['hits_by_k'].get(k, BLANK_CELL) for k in vars.K_VALUES]
    returned_count = entry['returned_count']
    was_skipped = returned_count is None
    return [
        entry['query'], entry['ground_truth_size'],
        BLANK_CELL if was_skipped else returned_count,
        *build_diff_count_cells(entry, was_skipped),
        entry['empty_ground_truth'], entry['skip_reason'],
        *build_set_metric_cells(entry), *hits,
    ]
