import math

from evaluation import relevance_report_vars, relevance_vars, strings
from evaluation.report.pair_judged_items import pair_items_with_judgements
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement

BAND_START_ROUNDING_DIGITS = 10


def compute_band_start(score: float) -> float:
    """The band's lower edge. Rounded because 0.05 has no exact binary representation and the
    unrounded product would emit 0.35000000000000003 as a band label."""
    width = relevance_report_vars.SCORE_BAND_WIDTH
    return round(math.floor(score / width) * width, BAND_START_ROUNDING_DIGITS)


def group_verdicts_by_band(judged_pairs: list[tuple[JudgementItem, ServiceJudgement]],
                           score_column: str) -> dict[float, list[str]]:
    """The verdicts of every judged unexpected-side pair, bucketed by its score band.

    Only the unexpected side is bucketed: the missed side has no scores at all by construction, so
    it has no band to fall into. A pair whose score is None is left out rather than banded at zero.
    """
    verdicts_by_band: dict[float, list[str]] = {}
    for item, judgement in judged_pairs:
        if judgement.side != strings.SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED:
            continue
        score = item.scores.get(score_column)
        if score is None:
            continue
        verdicts_by_band.setdefault(compute_band_start(score), []).append(judgement.verdict)
    return verdicts_by_band


def build_band_record(score_column: str, band_start: float, verdicts: list[str]) -> dict:
    """One band: how many pairs fell in it, and the share of each verdict within it.

    The share is per band, not per dataset - the question the table answers is "where in the score
    range does the judge disagree with the golden set?", which is a within-band proportion.
    """
    record = {
        relevance_report_vars.BAND_TABLE_SCORE_COLUMN_KEY: score_column,
        relevance_report_vars.BAND_TABLE_BAND_START_KEY: band_start,
        relevance_report_vars.BAND_TABLE_BAND_END_KEY: round(
            band_start + relevance_report_vars.SCORE_BAND_WIDTH, BAND_START_ROUNDING_DIGITS),
        relevance_report_vars.BAND_TABLE_COUNT_KEY: len(verdicts),
    }
    for verdict in relevance_vars.VERDICTS:
        verdict_count = verdicts.count(verdict)
        record[f'{verdict}{relevance_report_vars.BAND_TABLE_COUNT_SUFFIX}'] = verdict_count
        record[f'{verdict}{relevance_report_vars.BAND_TABLE_SHARE_SUFFIX}'] = (
            verdict_count / len(verdicts))
    return record


def build_score_band_table(judgements: list[ServiceJudgement], items: list[JudgementItem],
                           score_column: str) -> list[dict]:
    """One record per populated band of one score column, ascending."""
    verdicts_by_band = group_verdicts_by_band(
        pair_items_with_judgements(items, judgements), score_column)
    return [build_band_record(score_column, band_start, verdicts_by_band[band_start])
            for band_start in sorted(verdicts_by_band)]


def build_score_band_tables(judgements: list[ServiceJudgement],
                            items: list[JudgementItem]) -> list[dict]:
    """Both band tables, one after the other: cosine_score, then cosine_score_ratio.

    The ratio table is the threshold-selection evidence, because SEMANTIC_SCORE_RATIO is what
    actually cuts on it; the raw cosine table is what says whether the cosine separates relevance
    at all.
    """
    return [
        record
        for score_column in relevance_report_vars.SCORE_BAND_COLUMNS
        for record in build_score_band_table(judgements, items, score_column)
    ]
