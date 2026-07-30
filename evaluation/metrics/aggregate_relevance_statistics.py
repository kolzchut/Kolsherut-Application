from evaluation import relevance_statistics_vars, relevance_vars, strings
from evaluation.metrics.count_relevance_verdicts import (
    count_verdicts, count_verdicts_by_side, select_items_of_side,
)
from evaluation.relevance.frozen_query_record import FrozenQueryRecord
from evaluation.schemas import JudgementItem, ServiceJudgement


def compute_decisive_rate(counts: dict[str, int], numerator_verdict: str) -> tuple[float, int, int]:
    """A verdict's share of the pairs the judge actually decided, plus both raw counts.

    `unclear` is excluded from the denominator - it is a refusal to decide, so scoring it as either
    verdict would invent an opinion - and `unjudged` is excluded for the stronger reason that no
    verdict exists at all. Neither is ever folded into `irrelevant`. Because the denominator can
    therefore be much smaller than the side, the numerator and the denominator are returned with the
    rate and reported next to it everywhere: the rate alone does not say how far it shrank.
    """
    numerator = counts[numerator_verdict]
    denominator = counts[relevance_vars.VERDICT_RELEVANT] + counts[relevance_vars.VERDICT_IRRELEVANT]
    return (numerator / denominator if denominator else 0.0), numerator, denominator


def select_empty_ground_truth_queries(records: list[FrozenQueryRecord]) -> set[str]:
    """Queries the incumbent site shows nothing for. Every service they returned is "unexpected"
    trivially, by absence of a golden set rather than by disagreement with one."""
    return {record.query for record in records if record.ground_truth_size == 0}


def build_relevance_rates(items: list[JudgementItem], judgements: list[ServiceJudgement],
                          records: list[FrozenQueryRecord]) -> dict:
    """Both §11.7 rates, and the unexpected-side one BOTH including and excluding the
    empty-golden-set rows - alongside each other, never one instead of the other."""
    empty_queries = select_empty_ground_truth_queries(records)
    missed = select_items_of_side(items, strings.SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH)
    unexpected = select_items_of_side(items, strings.SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED)
    comparable = [item for item in unexpected if item.query not in empty_queries]
    return {
        **build_missed_rate_entry(*compute_decisive_rate(
            count_verdicts(missed, judgements), relevance_vars.VERDICT_IRRELEVANT)),
        **build_unexpected_rate_entry(*compute_decisive_rate(
            count_verdicts(unexpected, judgements), relevance_vars.VERDICT_RELEVANT)),
        **build_comparable_rate_entry(*compute_decisive_rate(
            count_verdicts(comparable, judgements), relevance_vars.VERDICT_RELEVANT)),
        relevance_statistics_vars.EMPTY_GROUND_TRUTH_ROW_COUNT_KEY:
            len(unexpected) - len(comparable),
        relevance_statistics_vars.EMPTY_GROUND_TRUTH_QUERY_COUNT_KEY:
            len({item.query for item in unexpected if item.query in empty_queries}),
    }


def build_missed_rate_entry(rate: float, count: int, denominator: int) -> dict:
    return {
        relevance_statistics_vars.MISSED_TRULY_IRRELEVANT_RATE_KEY: rate,
        relevance_statistics_vars.MISSED_TRULY_IRRELEVANT_COUNT_KEY: count,
        relevance_statistics_vars.MISSED_TRULY_IRRELEVANT_DENOMINATOR_KEY: denominator,
    }


def build_unexpected_rate_entry(rate: float, count: int, denominator: int) -> dict:
    return {
        relevance_statistics_vars.UNEXPECTED_ACTUALLY_RELEVANT_RATE_KEY: rate,
        relevance_statistics_vars.UNEXPECTED_ACTUALLY_RELEVANT_COUNT_KEY: count,
        relevance_statistics_vars.UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_KEY: denominator,
    }


def build_comparable_rate_entry(rate: float, count: int, denominator: int) -> dict:
    """The excluding-empty-golden-set variant - the only one comparable to the incumbent."""
    stats_vars = relevance_statistics_vars
    return {
        stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_RATE_EXCLUDING_EMPTY_GT_KEY: rate,
        stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_COUNT_EXCLUDING_EMPTY_GT_KEY: count,
        stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_EXCLUDING_EMPTY_GT_KEY: denominator,
    }


def aggregate_relevance_statistics(items: list[JudgementItem],
                                   judgements: list[ServiceJudgement],
                                   records: list[FrozenQueryRecord]) -> dict:
    """The verdict statistics: per-side bucket counts including unjudged, plus the two rates."""
    return {
        relevance_statistics_vars.RELEVANCE_VERDICT_COUNTS_KEY:
            count_verdicts_by_side(items, judgements),
        relevance_statistics_vars.RELEVANCE_RATES_KEY:
            build_relevance_rates(items, judgements, records),
    }
