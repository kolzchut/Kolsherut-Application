def precision_at_k(num_hits: int, k: int) -> float:
    return num_hits / k if k else 0.0


def recall_at_k(num_hits: int, ground_truth_size: int) -> float:
    return num_hits / ground_truth_size if ground_truth_size else 0.0


def f1_score(precision: float, recall: float) -> float:
    denominator = precision + recall
    return (2 * precision * recall) / denominator if denominator else 0.0
