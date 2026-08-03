from evaluation import relevance_statistics_vars, relevance_vars
from evaluation.report.pair_judged_items import build_identity, index_judgements_by_identity
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement


def build_empty_verdict_counts() -> dict[str, int]:
    """Every bucket present at zero, so a side with no pairs of some verdict still reports it.

    `unclear` is one of relevance_vars.VERDICTS and therefore a bucket in its own right; it is never
    added into `irrelevant`. `unjudged` is a separate bucket again and is not a verdict at all - it
    counts pairs the judge returned no opinion on, which must never read as an opinion.
    """
    counts = {verdict: 0 for verdict in relevance_vars.VERDICTS}
    counts[relevance_statistics_vars.VERDICT_COUNT_UNJUDGED_KEY] = 0
    return counts


def count_verdicts(items: list[JudgementItem],
                   judgements: list[ServiceJudgement]) -> dict[str, int]:
    """Bucket tally over exactly these items, items-driven so nothing is silently uncounted.

    Driven by the items rather than by the judgements because the pairs are what the dataset is: a
    pair whose chunk came back blocked or truncated has no judgement, and iterating judgements would
    make it vanish instead of landing in `unjudged`. The totals therefore always sum to len(items).
    """
    judgements_by_identity = index_judgements_by_identity(judgements)
    counts = build_empty_verdict_counts()
    for item in items:
        judgement = judgements_by_identity.get(
            build_identity(item.query, item.side, item.rank))
        bucket = (relevance_statistics_vars.VERDICT_COUNT_UNJUDGED_KEY if judgement is None
                  else judgement.verdict)
        counts[bucket] += 1
    counts[relevance_statistics_vars.VERDICT_COUNT_TOTAL_KEY] = len(items)
    return counts


def select_items_of_side(items: list[JudgementItem], side: str) -> list[JudgementItem]:
    return [item for item in items if item.side == side]


def count_verdicts_by_side(items: list[JudgementItem], judgements: list[ServiceJudgement]
                           ) -> dict[str, dict[str, int]]:
    """One bucket tally per diff side. The two sides answer different questions - golden-set noise
    on the missed side, golden-set narrowness on the unexpected side - so they are never pooled."""
    return {
        side: count_verdicts(select_items_of_side(items, side), judgements)
        for side in relevance_statistics_vars.RELEVANCE_SIDES
    }
