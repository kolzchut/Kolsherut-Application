from evaluation import human_review_strings, human_review_vars, relevance_vars
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement

JudgedPair = tuple[JudgementItem, ServiceJudgement]
StratumKey = tuple[str, str]


def build_stratum_keys() -> list[StratumKey]:
    """Every side x verdict cell, in one FIXED order.

    The order is what makes the draw reproducible: a seeded generator only repeats itself if it is
    asked for the same things in the same sequence, and a dict built by iterating the pairs would be
    ordered by whichever verdict happened to come back first. Taken from the two existing
    vocabularies - the sides the audit covers and the verdicts the judge may return - so a new
    verdict becomes a new stratum with no edit here.
    """
    return [(side, verdict)
            for side in human_review_vars.REVIEW_SAMPLE_SIDES
            for verdict in relevance_vars.VERDICTS]


def group_pairs_by_stratum(judged_pairs: list[JudgedPair]) -> dict[StratumKey, list[JudgedPair]]:
    """The judged pairs split into their side x verdict cells, every cell present even when empty.

    Stratifying on the verdict as well as the side is the whole mechanism: the two sides are very
    unequal and the verdicts within a side are more unequal still, so a draw stratified by side alone
    would still let one verdict swallow that side's whole allocation.

    Pairs of a side the audit does not cover are DROPPED here rather than allocated a cell - see
    REVIEW_SAMPLE_SIDES for why the draw stays on the two disagreement sides.
    """
    groups: dict[StratumKey, list[JudgedPair]] = {key: [] for key in build_stratum_keys()}
    for item, judgement in judged_pairs:
        stratum_key = (judgement.side, judgement.verdict)
        if stratum_key in groups:
            groups[stratum_key].append((item, judgement))
    return groups


def count_pairs_by_stratum(judged_pairs: list[JudgedPair]) -> dict[StratumKey, int]:
    """Cell sizes only - what the budget allocation reads, and what the log line reports."""
    return {key: len(pairs) for key, pairs in group_pairs_by_stratum(judged_pairs).items()}


def build_stratum_label(key: StratumKey) -> str:
    """A cell's name wherever one is reported. Tuple keys are not JSON, and 'side/verdict' reads the
    same in the log line and in the report field."""
    side, verdict = key
    return human_review_strings.STRATUM_LABEL.format(side=side, verdict=verdict)
