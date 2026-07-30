from logging import Logger

from evaluation.human_review.emit_review_sample import emit_review_sample
from evaluation.human_review.run_agreement_report import run_agreement_report


def run_human_review_stage(review_sample: int | None, agreement: bool, logger: Logger) -> bool:
    """Mission 6's two stages, and whether this run was one of them.

    Returns True when either flag was given, and the caller then does NO evaluation. Both stages read
    only the frozen snapshot and the committed label cache, so a retrieval run would add nothing to
    either - and it would actively hurt: it calls the service, re-scrapes nothing useful, and
    overwrites results/ with whatever arm happens to be serving, which is how three different arms
    landed in that directory in one afternoon.

    Both stages in one run is allowed and is a no-op in the useful direction: --review-sample writes a
    blank sheet, so --agreement immediately after it reports an empty review rather than a filled one.
    """
    if review_sample is None and not agreement:
        return False
    if review_sample is not None:
        emit_review_sample(review_sample, logger)
    if agreement:
        run_agreement_report(logger)
    return True
