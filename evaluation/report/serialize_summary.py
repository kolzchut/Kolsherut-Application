from evaluation import vars
from evaluation.strings import COUNT_STAT_LABELS, METRIC_LABELS, SET_METRIC_LABELS
from evaluation.schemas import QueryEvaluation


def serialize_query_evaluation(evaluation: QueryEvaluation) -> dict:
    return {
        'query': evaluation.query,
        'ground_truth_size': evaluation.ground_truth_size,
        'returned_count': evaluation.returned_count,
        'empty_ground_truth': evaluation.empty_ground_truth,
        'skip_reason': evaluation.skip_reason,
        'hits_by_k': evaluation.hits_by_k,
        'metrics_by_k': evaluation.metrics_by_k,
        'set_metrics': evaluation.set_metrics,
        'missed_ground_truth_names': list(evaluation.missed_ground_truth_names),
        'unexpected_retrieved_names': list(evaluation.unexpected_retrieved_names),
    }


def build_summary(aggregate: dict, overall_score: float,
                  evaluations: list[QueryEvaluation]) -> dict:
    """Assemble the full JSON payload consumed by the CI gate and the HTML dashboard."""
    return {
        'overall_score': overall_score,
        'metrics': aggregate['metrics'],
        'set_metrics': aggregate['set_metrics'],
        'count_stats': aggregate['count_stats'],
        'meta': aggregate['meta'],
        'k_values': vars.K_VALUES,
        'metric_keys': vars.METRIC_KEYS,
        'metric_labels': METRIC_LABELS,
        'set_metric_keys': vars.PER_QUERY_SET_METRIC_KEYS,
        'set_metric_labels': SET_METRIC_LABELS,
        'count_stat_keys': vars.COUNT_STAT_KEYS,
        'count_stat_labels': COUNT_STAT_LABELS,
        'per_query': [serialize_query_evaluation(evaluation) for evaluation in evaluations],
    }
