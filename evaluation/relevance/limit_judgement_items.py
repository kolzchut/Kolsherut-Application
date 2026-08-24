from evaluation import relevance_strings
from evaluation.relevance_schemas import JudgementItem


def limit_judgement_items(items: list[JudgementItem], limit: int) -> list[JudgementItem]:
    """The first N pairs, in the frozen files' own order.

    Truncation is by position only - nothing selects which pairs are interesting, which would be
    the judge's job rather than the transport's.
    """
    return items[:limit]


def build_judge_limit_log_line(items: list[JudgementItem], limit: int) -> str:
    """The line that states exactly how many pairs this run is NOT judging.

    Logged unconditionally whenever --judge-limit is set: a silently truncated judgement set reads
    as full coverage in the Mission 5 statistics, which is the failure this line exists to prevent.
    """
    judged_count = len(limit_judgement_items(items, limit))
    return relevance_strings.LOG_JUDGE_LIMIT_APPLIED.format(
        limit=limit, judged=judged_count, skipped=len(items) - judged_count, total=len(items))
