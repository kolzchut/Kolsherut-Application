from math import exp, log

from evaluation import vars
from evaluation.metrics.central_tendency import mean, median
from evaluation.metrics.count_parity_ratio import count_parity_ratio, smooth_count
from evaluation.schemas import QueryEvaluation


def build_count_pairs(evaluations: list[QueryEvaluation]) -> list[tuple[int, int]]:
    return [(evaluation.returned_count or 0, evaluation.ground_truth_size) for evaluation in evaluations]


def geometric_mean_count_ratio(count_pairs: list[tuple[int, int]]) -> float:
    """Directional companion to count parity: below 1 we under-return, above 1 we over-return.

    Geometric rather than arithmetic because the counts are log-skewed - a single
    230-service query would otherwise dominate the mean.
    """
    if not count_pairs:
        return 0.0
    log_ratios = [
        log(smooth_count(returned) / smooth_count(ground_truth))
        for returned, ground_truth in count_pairs
    ]
    return exp(mean(log_ratios))


def build_count_statistics(count_pairs: list[tuple[int, int]]) -> dict[str, float]:
    returned_counts = [returned for returned, _ in count_pairs]
    ground_truth_counts = [ground_truth for _, ground_truth in count_pairs]
    median_returned = median(returned_counts)
    median_ground_truth = median(ground_truth_counts)
    return {
        vars.COUNT_STAT_MEAN_COUNT_PARITY: mean(
            [count_parity_ratio(returned, ground_truth) for returned, ground_truth in count_pairs]
        ),
        vars.COUNT_STAT_MEDIAN_RETURNED_COUNT: median_returned,
        vars.COUNT_STAT_MEDIAN_GROUND_TRUTH_COUNT: median_ground_truth,
        vars.COUNT_STAT_RATIO_OF_MEDIAN_COUNTS: smooth_count(median_returned) / smooth_count(median_ground_truth),
        vars.COUNT_STAT_MEDIAN_ABSOLUTE_COUNT_ERROR: median(
            [abs(returned - ground_truth) for returned, ground_truth in count_pairs]
        ),
        vars.COUNT_STAT_GEOMETRIC_MEAN_COUNT_RATIO: geometric_mean_count_ratio(count_pairs),
    }


def aggregate_count_statistics(evaluations: list[QueryEvaluation]) -> dict[str, float]:
    """Count parity over every non-skipped query, including the empty-ground-truth ones."""
    return build_count_statistics(build_count_pairs(evaluations))
