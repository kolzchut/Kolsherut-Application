from evaluation import vars
from evaluation.strings import LOG_THRESHOLD_FAILED

OVERALL_SCORE_NAME = 'overall_score'
METRIC_THRESHOLD_SEPARATOR = '@'


def lookup_metric_value(metrics_by_k: dict, threshold_name: str) -> float:
    metric_key, k_text = threshold_name.split(METRIC_THRESHOLD_SEPARATOR)
    return metrics_by_k[int(k_text)][metric_key]


def collect_threshold_targets(overall_score: float, metrics_by_k: dict) -> dict[str, float]:
    targets = {}
    if vars.MIN_OVERALL_SCORE is not None:
        targets[OVERALL_SCORE_NAME] = overall_score
    for threshold_name in vars.PER_METRIC_THRESHOLDS:
        targets[threshold_name] = lookup_metric_value(metrics_by_k, threshold_name)
    return targets


def threshold_for(threshold_name: str) -> float:
    if threshold_name == OVERALL_SCORE_NAME:
        return vars.MIN_OVERALL_SCORE
    return vars.PER_METRIC_THRESHOLDS[threshold_name]


def check_thresholds(overall_score: float, metrics_by_k: dict) -> list[str]:
    """Return a failure message per unmet threshold (empty list = pass / report-only)."""
    targets = collect_threshold_targets(overall_score, metrics_by_k)
    failures = []
    for threshold_name, value in targets.items():
        threshold = threshold_for(threshold_name)
        if value < threshold:
            failures.append(LOG_THRESHOLD_FAILED.format(name=threshold_name, value=value, threshold=threshold))
    return failures
