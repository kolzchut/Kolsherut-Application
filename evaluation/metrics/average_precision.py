def average_precision_at_k(hit_flags: list[int], ground_truth_size: int, k: int) -> float:
    """Mean of precision taken at each relevant position, normalized by the ideal hit count."""
    normalizer = min(ground_truth_size, k)
    if normalizer == 0:
        return 0.0
    hits_so_far = 0
    precision_sum = 0.0
    for index, hit_flag in enumerate(hit_flags):
        if hit_flag:
            hits_so_far += 1
            precision_sum += hits_so_far / (index + 1)
    return precision_sum / normalizer
