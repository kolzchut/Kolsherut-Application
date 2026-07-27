from evaluation import vars
from evaluation.metrics.count_parity_ratio import count_parity_ratio
from evaluation.metrics.precision_recall_f1 import f1_score, precision_at_k, recall_at_k


def count_hits(ranked_names: list[str], ground_truth_names: set[str]) -> int:
    """Counted over the whole returned list, never over a per-k slice - hits_by_k tops out
    at the largest k and would undercount whenever retrieval returns more than that."""
    return sum(1 for service_name in ranked_names if service_name in ground_truth_names)


def compute_returned_set_metrics(
    ranked_names: list[str], ground_truth_names: set[str]
) -> dict[str, float]:
    """Precision, recall and F1 over the actually-returned list.

    precision_at_k with k = len(ranked_names) IS precision over the returned set, so the
    existing pure metric functions are reused rather than duplicated.
    """
    num_hits = count_hits(ranked_names, ground_truth_names)
    precision = precision_at_k(num_hits, len(ranked_names))
    recall = recall_at_k(num_hits, len(ground_truth_names))
    return {
        vars.METRIC_PRECISION_AT_RETURNED: precision,
        vars.METRIC_RECALL_AT_RETURNED: recall,
        vars.METRIC_F1_AT_RETURNED: f1_score(precision, recall),
        vars.METRIC_COUNT_PARITY: count_parity_ratio(len(ranked_names), len(ground_truth_names)),
    }
