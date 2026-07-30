from logging import Logger

from evaluation import vars
from evaluation.relevance.run_relevance_judging import run_relevance_judging
from evaluation.relevance_statistics_strings import LOG_REWROTE_SUMMARY
from evaluation.report.serialize_summary import build_summary
from evaluation.report.write_results import rewrite_summary_artifacts


def judge_and_rewrite_summary(judge: bool, judge_limit: int | None, aggregate: dict,
                              overall_score: float, evaluations: list,
                              logger: Logger) -> dict | None:
    """Opt-in judging, run only AFTER every base artifact is on disk, then a second summary write.

    The ordering protects data that cannot be recovered. Retrieval is not reproducible - six
    byte-identical retrieve calls returned two different document sets, with no index churn to
    explain it - so an aborted run's artifacts can never be regenerated, only replaced by a
    different dataset. Judging is also the pipeline's most failure-prone stage: the completeness
    assertion raises on any id gap, and id omission is the EXPECTED failure mode of the lite-tier
    judge. Running it before the write would trade a finished evaluation for the likeliest
    exception, so it runs last and pays for one extra serialization instead.

    No try/except guards this. The ordering alone is the guarantee: the first write has already
    happened, so an exception here costs nothing but the block.

    overall_score cannot move - it was computed before the first write, and this second write
    re-serializes the same value with only the `relevance` sibling added.
    """
    if not judge:
        return None
    relevance = run_relevance_judging(judge_limit, logger)
    rewrite_summary_artifacts(build_summary(aggregate, overall_score, evaluations, relevance))
    logger.info(LOG_REWROTE_SUMMARY.format(summary=vars.SUMMARY_JSON_PATH,
                                           html=vars.REPORT_HTML_PATH))
    return relevance
