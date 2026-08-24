from evaluation import vars


def smooth_count(count: float) -> float:
    """Shift counts off zero so every ratio stays finite and defined."""
    return count + vars.COUNT_RATIO_SMOOTHING


def count_parity_ratio(returned_count: int, ground_truth_count: int) -> float:
    """Symmetric, scale-free agreement between the two counts, in [0, 1].

    1.0 is exact parity; over- and under-returning are penalised equally. Bounded, so it
    can be threshold-gated like any other metric.
    """
    smoothed_returned = smooth_count(returned_count)
    smoothed_ground_truth = smooth_count(ground_truth_count)
    return min(smoothed_returned, smoothed_ground_truth) / max(smoothed_returned, smoothed_ground_truth)
