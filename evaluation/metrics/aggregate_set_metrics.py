from evaluation import vars
from evaluation.metrics.central_tendency import mean
from evaluation.schemas import QueryEvaluation


def mean_set_metric(evaluations: list[QueryEvaluation], metric_key: str) -> float:
    return mean([evaluation.set_metrics[metric_key] for evaluation in evaluations])


def aggregate_set_metrics(evaluations: list[QueryEvaluation]) -> dict[str, float]:
    """Mean each set-level metric over queries with a non-empty ground truth.

    Empty-ground-truth queries are excluded here (recall would be 0/0), but they are kept
    in the count statistics - "the site returned nothing, so should we" is exactly a
    count-parity signal.
    """
    return {metric_key: mean_set_metric(evaluations, metric_key) for metric_key in vars.SET_METRIC_KEYS}
