from logging import Logger

from evaluation import human_review_strings, human_review_vars
from evaluation.human_review.build_review_sample import build_review_sample
from evaluation.human_review.build_sample_strata import (
    build_sample_strata, render_sample_strata_log_line,
)
from evaluation.human_review.read_judged_pairs import read_judged_pairs
from evaluation.report.write_review_sheet_csv import write_review_sheet_csv


def emit_review_sample(sample_size: int, logger: Logger) -> int:
    """Phase 6.1 end to end: judged pairs in, the blank-answer review sheet out.

    Nothing here fills the sheet in, and nothing may: the two answer cells are the human's, and a
    seeded default would make raw_agreement and cohens_kappa a measurement of an LLM against itself.

    The strata are logged before the path, so the operator sees which cells the draw covered at the
    moment the sheet is handed over rather than after the review.
    """
    judged_pairs = read_judged_pairs(logger)
    sample_rows = build_review_sample(judged_pairs, sample_size)
    logger.info(render_sample_strata_log_line(build_sample_strata(judged_pairs, sample_rows)))
    written = write_review_sheet_csv(sample_rows)
    logger.info(human_review_strings.LOG_WROTE_REVIEW_SAMPLE.format(
        count=written, available=len(judged_pairs),
        path=human_review_vars.REVIEW_SAMPLE_CSV_PATH))
    return written
