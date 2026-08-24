from evaluation import vars
from evaluation.strings import (
    COUNT_STAT_LABELS,
    SET_METRIC_LABELS,
    TABLE_METRIC_HEADER,
    TABLE_VALUE_HEADER,
)


def build_metric_value_table(values: dict, metric_keys: list[str], labels: dict) -> dict:
    """A two-column Metric | Value table. Used for the metrics that have no k."""
    return {
        'headers': [TABLE_METRIC_HEADER, TABLE_VALUE_HEADER],
        'rows': [[labels[metric_key], values[metric_key]] for metric_key in metric_keys if metric_key in values],
    }


def build_set_metrics_table(aggregate: dict) -> dict:
    return build_metric_value_table(aggregate['set_metrics'], vars.SET_METRIC_KEYS, SET_METRIC_LABELS)


def build_count_stats_table(aggregate: dict) -> dict:
    return build_metric_value_table(aggregate['count_stats'], vars.COUNT_STAT_KEYS, COUNT_STAT_LABELS)
