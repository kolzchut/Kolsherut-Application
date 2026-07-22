from evaluation import vars
from evaluation.schemas import QueryEvaluation


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def mean_metric_at_k(evaluations: list[QueryEvaluation], metric_key: str, k: int) -> float:
    return mean([evaluation.metrics_by_k[k][metric_key] for evaluation in evaluations])


def aggregate_metrics_by_k(evaluations: list[QueryEvaluation]) -> dict[int, dict[str, float]]:
    return {
        k: {metric_key: mean_metric_at_k(evaluations, metric_key, k) for metric_key in vars.METRIC_KEYS}
        for k in vars.K_VALUES
    }


def build_meta(all_evaluations: list[QueryEvaluation], evaluated: list[QueryEvaluation]) -> dict:
    return {
        'num_queries': len(all_evaluations),
        'num_evaluated': len(evaluated),
        'num_skipped_empty_gt': sum(1 for e in all_evaluations if e.empty_ground_truth),
        'num_be_404': sum(1 for e in all_evaluations if e.be_returned_empty),
        'avg_ground_truth_size': mean([e.ground_truth_size for e in evaluated]),
    }


def aggregate_metrics(all_evaluations: list[QueryEvaluation]) -> dict:
    """Mean each metric per k over queries with a non-empty ground truth, plus run meta."""
    evaluated = [evaluation for evaluation in all_evaluations if not evaluation.empty_ground_truth]
    return {'metrics': aggregate_metrics_by_k(evaluated), 'meta': build_meta(all_evaluations, evaluated)}
