from evaluation import relevance_statistics_vars, relevance_vars, strings
from evaluation.metrics.central_tendency import mean
from evaluation.metrics.precision_recall_f1 import f1_score, precision_at_k, recall_at_k
from evaluation.relevance.frozen_query_record import FrozenQueryRecord
from evaluation.schemas import ServiceJudgement


def count_verdicts_by_query(judgements: list[ServiceJudgement], side: str,
                            verdict: str) -> dict[str, int]:
    """How many pairs of one side carry one verdict, per query. `unclear` and unjudged pairs are
    simply not counted here: neither is evidence that the golden set was wrong."""
    counts: dict[str, int] = {}
    for judgement in judgements:
        if judgement.side == side and judgement.verdict == verdict:
            counts[judgement.query] = counts.get(judgement.query, 0) + 1
    return counts


def build_adjusted_query_metrics(record: FrozenQueryRecord, unexpected_judged_relevant: int,
                                 missed_judged_irrelevant: int) -> dict[str, float]:
    """One query's three adjusted metrics, using the frozen snapshot's own hits, |R| and |G|.

    Precision credits the unexpected services the judge called relevant - they were retrieved and
    they were good, the golden set simply did not list them. Recall shrinks the golden set by the
    missed services the judge called irrelevant - never by the `unclear` ones, which are no evidence
    that the golden set was wrong. The recall denominator is guarded: recall_at_k returns 0.0 when
    it is zero, which happens when every golden-set service was missed AND judged irrelevant.
    """
    precision = precision_at_k(record.hits + unexpected_judged_relevant, record.returned_count)
    recall = recall_at_k(record.hits, record.ground_truth_size - missed_judged_irrelevant)
    return {
        relevance_statistics_vars.ADJUSTED_PRECISION_AT_RETURNED_KEY: precision,
        relevance_statistics_vars.ADJUSTED_RECALL_AT_RETURNED_KEY: recall,
        relevance_statistics_vars.ADJUSTED_F1_AT_RETURNED_KEY: f1_score(precision, recall),
    }


def select_adjustable_records(records: list[FrozenQueryRecord]) -> list[FrozenQueryRecord]:
    """The same queries aggregate_set_metrics averages over: retrieval was called, and the golden
    set is non-empty. Empty-golden-set queries are excluded because recall would be 0/0, exactly as
    the unadjusted set metrics exclude them - otherwise the two pairs are not comparable."""
    return [record for record in records
            if record.returned_count is not None and record.ground_truth_size > 0]


def build_adjusted_metrics_by_query(records: list[FrozenQueryRecord],
                                    judgements: list[ServiceJudgement]) -> list[dict[str, float]]:
    relevant_by_query = count_verdicts_by_query(
        judgements, strings.SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED, relevance_vars.VERDICT_RELEVANT)
    irrelevant_by_query = count_verdicts_by_query(
        judgements, strings.SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH, relevance_vars.VERDICT_IRRELEVANT)
    return [
        build_adjusted_query_metrics(record, relevant_by_query.get(record.query, 0),
                                     irrelevant_by_query.get(record.query, 0))
        for record in select_adjustable_records(records)
    ]


def aggregate_adjusted_set_metrics(records: list[FrozenQueryRecord],
                                   judgements: list[ServiceJudgement]) -> dict[str, float]:
    """Mean of each adjusted metric over queries, mirroring aggregate_set_metrics exactly.

    The per-query mean, not a pooled ratio, so the adjusted numbers sit next to the unadjusted ones
    on the same footing and the difference between them is the judge's contribution alone.
    """
    per_query = build_adjusted_metrics_by_query(records, judgements)
    return {
        metric_key: mean([metrics[metric_key] for metrics in per_query])
        for metric_key in relevance_statistics_vars.ADJUSTED_SET_METRIC_KEYS
    }
