from evaluation import vars


def metric_weight(metric_key: str) -> float:
    return vars.SCORE_WEIGHTS.get(metric_key, 1.0)


def collect_weighted_cells(metrics_by_k: dict[int, dict[str, float]]) -> tuple[float, float]:
    weighted_sum = 0.0
    total_weight = 0.0
    for per_metric in metrics_by_k.values():
        for metric_key, value in per_metric.items():
            weight = metric_weight(metric_key)
            weighted_sum += weight * value
            total_weight += weight
    return weighted_sum, total_weight


def compute_overall_score(metrics_by_k: dict[int, dict[str, float]]) -> float:
    """Single [0,1] score: weighted mean of every metric across every k."""
    weighted_sum, total_weight = collect_weighted_cells(metrics_by_k)
    return weighted_sum / total_weight if total_weight else 0.0
