from logging import Logger

from evaluation import human_review_strings, human_review_vars
from evaluation.human_review.align_verdicts import align_verdicts
from evaluation.human_review.build_review_sample import build_review_sample
from evaluation.human_review.build_sample_strata import build_sample_strata
from evaluation.human_review.check_agreement_gate import check_agreement_gate
from evaluation.human_review.load_review_verdicts import load_review_verdicts
from evaluation.human_review.read_judged_pairs import read_judged_pairs
from evaluation.human_review_schemas import HumanVerdict, ReviewSampleRow
from evaluation.metrics.agreement_statistics import build_agreement_statistics
from evaluation.report.build_agreement_table import build_agreement_table
from evaluation.report.render_table import render_titled_table
from evaluation.report.write_agreement_report import write_agreement_report


def redraw_sample_for_sheet(human_verdicts: list[HumanVerdict],
                            logger: Logger) -> tuple[list, list[ReviewSampleRow]]:
    """The same rows the sheet was emitted from, rebuilt from the seed rather than read off disk.

    Sized by the sheet's own row count, which is the one number the sheet still carries after the
    verdict, reason and score columns were withheld. Reproducibility is what makes this sound: the
    seed and that count fix the draw completely, and align_verdicts then checks every redrawn identity
    against the sheet's, so a cache or snapshot that moved underneath raises instead of mis-joining.
    """
    judged_pairs = read_judged_pairs(logger)
    return judged_pairs, build_review_sample(judged_pairs, len(human_verdicts))


def run_agreement_report(logger: Logger) -> dict:
    """Phase 6.2 end to end: the filled-in sheet in, agreement_report.json and the gate out.

    The gate is reported, never acted on. A failure means returning to Task 4.3.2 to revise the prompt
    only, re-judge and re-sample - all decisions, none of them things a threshold should trigger. So
    this logs the outcome and exits normally, and the caller's exit code stays a statement about the
    retrieval metrics rather than about the judge's calibration.
    """
    human_verdicts = load_review_verdicts()
    judged_pairs, sample_rows = redraw_sample_for_sheet(human_verdicts, logger)
    aligned = align_verdicts(human_verdicts, sample_rows)
    logger.info(human_review_strings.LOG_LOADED_REVIEW_VERDICTS.format(
        reviewed=len(aligned), total=len(human_verdicts),
        path=human_review_vars.REVIEW_SAMPLE_CSV_PATH))
    statistics = build_agreement_statistics(len(human_verdicts), aligned)
    payload = write_agreement_report(statistics, check_agreement_gate(statistics),
                                     build_sample_strata(judged_pairs, sample_rows))
    print(render_titled_table(human_review_strings.AGREEMENT_TABLE_TITLE,
                              build_agreement_table(payload)))
    logger.info(human_review_strings.LOG_WROTE_AGREEMENT_REPORT.format(
        path=human_review_vars.AGREEMENT_REPORT_JSON_PATH))
    logger.info(human_review_strings.LOG_AGREEMENT_GATE_OUTCOME.format(
        outcome=payload[human_review_vars.GATE_KEY][human_review_vars.GATE_OUTCOME_KEY]))
    return payload
