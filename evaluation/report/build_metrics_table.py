from evaluation import vars
from evaluation.strings import METRIC_LABELS, TABLE_METRIC_HEADER, TABLE_K_HEADER_TEMPLATE


def build_table_headers() -> list[str]:
    k_headers = [TABLE_K_HEADER_TEMPLATE.format(k=k) for k in vars.K_VALUES]
    return [TABLE_METRIC_HEADER, *k_headers]


def build_metric_row(metrics_by_k: dict[int, dict[str, float]], metric_key: str) -> list:
    values = [metrics_by_k[k][metric_key] for k in vars.K_VALUES]
    return [METRIC_LABELS[metric_key], *values]


def build_metrics_table(metrics_by_k: dict[int, dict[str, float]]) -> dict:
    """Shape the metric x k grid into headers + one row per metric for rendering."""
    rows = [build_metric_row(metrics_by_k, metric_key) for metric_key in vars.METRIC_KEYS]
    return {'headers': build_table_headers(), 'rows': rows}
