from evaluation import vars
from evaluation.schemas import Example, QueryEvaluation, ServiceScores
from evaluation.metrics.precision_recall_f1 import precision_at_k, recall_at_k, f1_score
from evaluation.metrics.reciprocal_rank import reciprocal_rank
from evaluation.metrics.hit_rate import hit_rate
from evaluation.metrics.ndcg import ndcg_at_k
from evaluation.metrics.average_precision import average_precision_at_k
from evaluation.metrics.compute_returned_set_metrics import compute_returned_set_metrics
from evaluation.metrics.compute_service_name_diff import (
    find_missed_ground_truth_names, find_unexpected_retrieved_names,
)


def build_hit_flags(ranked_names: list[str], ground_truth_names: set[str], k: int) -> list[int]:
    return [1 if service_name in ground_truth_names else 0 for service_name in ranked_names[:k]]


def compute_metrics_at_k(hit_flags: list[int], ground_truth_size: int, k: int) -> dict[str, float]:
    num_hits = sum(hit_flags)
    precision = precision_at_k(num_hits, k)
    recall = recall_at_k(num_hits, ground_truth_size)
    return {
        vars.METRIC_MRR: reciprocal_rank(hit_flags),
        vars.METRIC_RECALL: recall,
        vars.METRIC_PRECISION: precision,
        vars.METRIC_F1: f1_score(precision, recall),
        vars.METRIC_HIT_RATE: hit_rate(num_hits),
        vars.METRIC_NDCG: ndcg_at_k(hit_flags, ground_truth_size, k),
        vars.METRIC_MAP: average_precision_at_k(hit_flags, ground_truth_size, k),
    }


def evaluate_query(example: Example, ranked_names: list[str],
                   ordered_ground_truth_names: tuple[str, ...],
                   service_scores: dict[str, ServiceScores]) -> QueryEvaluation:
    """Takes the ground truth in the incumbent site's order, not as a set: the order is what
    makes the missed-name list rankable. Membership tests use the set derived here.

    service_scores is carried onto the record untouched and read by no metric: every metric
    below computes from ranked_names and ground_truth_names exactly as it did before."""
    ground_truth_names = set(ordered_ground_truth_names)
    ground_truth_size = len(ground_truth_names)
    metrics_by_k = {}
    hits_by_k = {}
    for k in vars.K_VALUES:
        hit_flags = build_hit_flags(ranked_names, ground_truth_names, k)
        hits_by_k[k] = sum(hit_flags)
        metrics_by_k[k] = compute_metrics_at_k(hit_flags, ground_truth_size, k)
    return QueryEvaluation(
        query=example.query, ground_truth_size=ground_truth_size,
        empty_ground_truth=ground_truth_size == 0,
        metrics_by_k=metrics_by_k, hits_by_k=hits_by_k,
        returned_count=len(ranked_names),
        set_metrics=compute_returned_set_metrics(ranked_names, ground_truth_names),
        missed_ground_truth_names=find_missed_ground_truth_names(
            ordered_ground_truth_names, ranked_names),
        unexpected_retrieved_names=find_unexpected_retrieved_names(
            ranked_names, ground_truth_names),
        service_scores=service_scores,
    )
