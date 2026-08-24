from evaluation import relevance_statistics_vars, vars
from evaluation.strings import COUNT_STAT_LABELS, METRIC_LABELS, SET_METRIC_LABELS
from evaluation.schemas import QueryEvaluation
from evaluation.report.serialize_service_details import serialize_service_detail_map
from evaluation.report.serialize_service_scores import serialize_service_score_map


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
        'ranked_names': list(evaluation.ranked_names),
        'missed_ground_truth_names': list(evaluation.missed_ground_truth_names),
        'unexpected_retrieved_names': list(evaluation.unexpected_retrieved_names),
        'mutual_retrieved_names': list(evaluation.mutual_retrieved_names),
        vars.PER_QUERY_SERVICE_SCORES_KEY: serialize_service_score_map(evaluation.service_scores),
        vars.PER_QUERY_SERVICE_DETAILS_KEY: serialize_service_detail_map(
            evaluation.service_details),
    }


def build_relevance_entry(relevance: dict | None) -> dict:
    """The `relevance` block, or nothing at all when the run did not judge.

    Absent rather than empty on an unjudged run: every reader - the CI gate, the console table and
    the dashboard - branches on the key existing, so an empty dict would make an unjudged run render
    a relevance panel full of zeroes as if the judge had found nothing relevant.
    """
    if relevance is None:
        return {}
    return {relevance_statistics_vars.RELEVANCE_BLOCK_KEY: relevance}


def build_summary(aggregate: dict, overall_score: float,
                  evaluations: list[QueryEvaluation],
                  relevance: dict | None = None) -> dict:
    """Assemble the full JSON payload consumed by the CI gate and the HTML dashboard.

    `relevance` is spliced in as a SIBLING of set_metrics and count_stats, exactly as they are
    siblings of `metrics`. It is never merged into aggregate['metrics']: compute_overall_score
    averages whatever keys each per-k metrics dict holds, so a relevance key inside it would
    silently redefine overall_score and break comparison with results-arm0-baseline/.
    """
    return {
        'overall_score': overall_score,
        'metrics': aggregate['metrics'],
        'set_metrics': aggregate['set_metrics'],
        'count_stats': aggregate['count_stats'],
        **build_relevance_entry(relevance),
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
