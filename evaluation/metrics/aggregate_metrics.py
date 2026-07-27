from evaluation import vars
from evaluation.metrics.aggregate_count_statistics import aggregate_count_statistics
from evaluation.metrics.aggregate_set_metrics import aggregate_set_metrics
from evaluation.metrics.central_tendency import mean
from evaluation.schemas import QueryEvaluation


def mean_metric_at_k(evaluations: list[QueryEvaluation], metric_key: str, k: int) -> float:
    return mean([evaluation.metrics_by_k[k][metric_key] for evaluation in evaluations])


def aggregate_metrics_by_k(evaluations: list[QueryEvaluation]) -> dict[int, dict[str, float]]:
    return {
        k: {metric_key: mean_metric_at_k(evaluations, metric_key, k) for metric_key in vars.METRIC_KEYS}
        for k in vars.K_VALUES
    }


def build_meta(all_evaluations: list[QueryEvaluation], evaluated: list[QueryEvaluation],
               non_skipped: list[QueryEvaluation]) -> dict:
    return {
        'num_queries': len(all_evaluations),
        'num_evaluated': len(evaluated),
        'num_skipped_unsupported': sum(1 for e in all_evaluations if e.skip_reason),
        'num_skipped_empty_gt': sum(1 for e in all_evaluations if e.empty_ground_truth),
        'avg_ground_truth_size': mean([e.ground_truth_size for e in evaluated]),
        'avg_returned_count': mean([e.returned_count or 0 for e in non_skipped]),
    }


def aggregate_metrics(all_evaluations: list[QueryEvaluation]) -> dict:
    """Mean each metric per k over queries with a non-empty ground truth, plus run meta.

    set_metrics and count_stats are siblings of metrics, never entries inside it:
    compute_overall_score iterates whatever keys a per-k metrics dict happens to hold, so
    anything added there would silently shift the headline score.
    """
    evaluated = [evaluation for evaluation in all_evaluations if not evaluation.empty_ground_truth]
    non_skipped = [evaluation for evaluation in all_evaluations if not evaluation.skip_reason]
    return {
        'metrics': aggregate_metrics_by_k(evaluated),
        'set_metrics': aggregate_set_metrics(evaluated),
        'count_stats': aggregate_count_statistics(non_skipped),
        'meta': build_meta(all_evaluations, evaluated, non_skipped),
    }
