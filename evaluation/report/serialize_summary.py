from evaluation import vars
from evaluation.strings import METRIC_LABELS
from evaluation.schemas import QueryEvaluation


def serialize_query_evaluation(evaluation: QueryEvaluation) -> dict:
    return {
        'query': evaluation.query,
        'ground_truth_size': evaluation.ground_truth_size,
        'empty_ground_truth': evaluation.empty_ground_truth,
        'be_returned_empty': evaluation.be_returned_empty,
        'hits_by_k': evaluation.hits_by_k,
        'metrics_by_k': evaluation.metrics_by_k,
    }


def build_summary(aggregate: dict, overall_score: float,
                  evaluations: list[QueryEvaluation]) -> dict:
    """Assemble the full JSON payload consumed by the CI gate and the HTML dashboard."""
    return {
        'overall_score': overall_score,
        'metrics': aggregate['metrics'],
        'meta': aggregate['meta'],
        'k_values': vars.K_VALUES,
        'metric_keys': vars.METRIC_KEYS,
        'metric_labels': METRIC_LABELS,
        'per_query': [serialize_query_evaluation(evaluation) for evaluation in evaluations],
    }
