from evaluation import vars
from evaluation.schemas import Example, QueryEvaluation
from evaluation.metrics.precision_recall_f1 import precision_at_k, recall_at_k, f1_score
from evaluation.metrics.reciprocal_rank import reciprocal_rank
from evaluation.metrics.hit_rate import hit_rate
from evaluation.metrics.ndcg import ndcg_at_k
from evaluation.metrics.average_precision import average_precision_at_k


def build_hit_flags(ranked_ids: list[str], ground_truth_ids: set[str], k: int) -> list[int]:
    return [1 if service_id in ground_truth_ids else 0 for service_id in ranked_ids[:k]]


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


def evaluate_query(example: Example, ranked_ids: list[str], ground_truth_ids: set[str],
                   be_returned_empty: bool) -> QueryEvaluation:
    ground_truth_size = len(ground_truth_ids)
    metrics_by_k = {}
    hits_by_k = {}
    for k in vars.K_VALUES:
        hit_flags = build_hit_flags(ranked_ids, ground_truth_ids, k)
        hits_by_k[k] = sum(hit_flags)
        metrics_by_k[k] = compute_metrics_at_k(hit_flags, ground_truth_size, k)
    return QueryEvaluation(
        query=example.query, ground_truth_size=ground_truth_size,
        empty_ground_truth=ground_truth_size == 0, be_returned_empty=be_returned_empty,
        metrics_by_k=metrics_by_k, hits_by_k=hits_by_k,
    )
