from logging import Logger

from evaluation import relevance_input_vars, relevance_report_vars, relevance_strings, relevance_vars
from evaluation.relevance.build_judgement_items import build_judgement_items
from evaluation.relevance.build_relevance_block import build_relevance_block
from evaluation.relevance.judge_relevance import judge_relevance
from evaluation.relevance.limit_judgement_items import (
    build_judge_limit_log_line, limit_judgement_items,
)
from evaluation.report.build_score_band_table import build_score_band_tables
from evaluation.report.write_relevance_csv import write_relevance_csv
from evaluation.report.write_score_band_csv import render_score_band_table, write_score_band_csv
from evaluation.relevance_schemas import JudgementItem


def read_items_to_judge(judge_limit: int | None, logger: Logger) -> list[JudgementItem]:
    """Every pair in the frozen snapshot, truncated only if --judge-limit says so.

    The skipped count is logged before the truncation happens, because a silently truncated
    judgement set reads as full coverage in the Mission 5 statistics.
    """
    items = build_judgement_items()
    logger.info(relevance_strings.LOG_BUILT_JUDGEMENT_ITEMS.format(
        count=len(items), directory=relevance_input_vars.JUDGE_INPUT_DIR))
    if judge_limit is None:
        return items
    logger.warning(build_judge_limit_log_line(items, judge_limit))
    return limit_judgement_items(items, judge_limit)


def write_relevance_reports(judgements: list, items: list[JudgementItem], logger: Logger) -> None:
    """The judgement table, then the two score-band tables it feeds."""
    row_count = write_relevance_csv(judgements, items)
    logger.info(relevance_strings.LOG_WROTE_RELEVANCE_CSV.format(
        count=row_count, path=relevance_vars.RELEVANCE_JUDGEMENTS_CSV_PATH))
    band_records = build_score_band_tables(judgements, items)
    print(render_score_band_table(band_records))
    logger.info(relevance_strings.LOG_WROTE_SCORE_BAND_CSV.format(
        count=write_score_band_csv(band_records),
        path=relevance_report_vars.RELEVANCE_BY_SCORE_BAND_CSV_PATH))


def run_relevance_judging(judge_limit: int | None, logger: Logger) -> dict:
    """Opt-in judging, end to end: frozen snapshot in, judgement table, band tables and the
    `relevance` block of summary.json out.

    The block is returned rather than written here so summary.json is written once, by the one writer
    that owns it - and so an unjudged run simply never produces a block to write.
    """
    items = read_items_to_judge(judge_limit, logger)
    judgements = judge_relevance(items, logger)
    write_relevance_reports(judgements, items, logger)
    return build_relevance_block(items, judgements)
