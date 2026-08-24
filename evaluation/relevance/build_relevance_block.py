from evaluation import relevance_statistics_vars
from evaluation.metrics.adjusted_set_metrics import aggregate_adjusted_set_metrics
from evaluation.metrics.aggregate_relevance_statistics import aggregate_relevance_statistics
from evaluation.relevance.read_frozen_query_records import read_frozen_query_records
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement


def build_relevance_block(items: list[JudgementItem],
                          judgements: list[ServiceJudgement]) -> dict:
    """The `relevance` block of summary.json: verdict counts, the two rates, adjusted set metrics.

    A SIBLING of set_metrics and count_stats, never nested inside `metrics`: compute_overall_score
    averages whatever keys it finds in each per-k metrics dict, so anything folded in there would
    silently redefine the headline score and break comparison with the baseline arm.

    Every input is the frozen snapshot's - the pairs, their verdicts, and the per-query counts the
    adjusted metrics divide by - so the whole block describes one arm rather than mixing the judged
    snapshot with the live run this summary otherwise reports on.
    """
    records = read_frozen_query_records()
    return {
        **aggregate_relevance_statistics(items, judgements, records),
        relevance_statistics_vars.RELEVANCE_ADJUSTED_SET_METRICS_KEY:
            aggregate_adjusted_set_metrics(records, judgements),
    }
