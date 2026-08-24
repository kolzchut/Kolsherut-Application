from math import log2


def discounted_cumulative_gain(hit_flags: list[int]) -> float:
    return sum(hit_flag / log2(index + 2) for index, hit_flag in enumerate(hit_flags))


def ideal_discounted_cumulative_gain(ground_truth_size: int, k: int) -> float:
    ideal_hits = min(ground_truth_size, k)
    return sum(1.0 / log2(index + 2) for index in range(ideal_hits))


def ndcg_at_k(hit_flags: list[int], ground_truth_size: int, k: int) -> float:
    """Normalized DCG with binary relevance: actual DCG over the best achievable DCG."""
    ideal = ideal_discounted_cumulative_gain(ground_truth_size, k)
    return discounted_cumulative_gain(hit_flags) / ideal if ideal else 0.0
