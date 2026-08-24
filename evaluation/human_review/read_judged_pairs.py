from logging import Logger

from evaluation import human_review_strings, relevance_vars
from evaluation.human_review.stratify_judged_pairs import JudgedPair
from evaluation.relevance.build_judgement_items import build_judgement_items
from evaluation.relevance.judgement_cache import load_judgement_cache
from evaluation.relevance.read_cached_judgement import split_items_by_cache
from evaluation.report.pair_judged_items import pair_items_with_judgements


def read_judged_pairs(logger: Logger) -> list[JudgedPair]:
    """Every frozen pair that already carries an LLM verdict, read entirely from local files.

    No API key and no network: Mission 6 audits verdicts Mission 4 already produced, so the labels
    come from the committed cache and the pairs from the frozen snapshot. The read-back path uses this
    too, which is what lets it redraw the sheet instead of persisting the answers alongside it.

    A missing or stale cache raises. Sampling zero rows would emit an empty sheet a human could
    dutifully fill in, and the resulting agreement report would be a measurement of nothing.

    A PARTIALLY judged cache only warns, because sampling the judged part is legitimate - but it is
    loud, because the sheet would otherwise read as a sample of the whole snapshot.
    """
    items = build_judgement_items()
    cache = load_judgement_cache()
    if cache is None:
        raise FileNotFoundError(human_review_strings.ERROR_NO_JUDGEMENTS_TO_SAMPLE.format(
            path=relevance_vars.JUDGEMENT_CACHE_PATH))
    judgements, pending_items = split_items_by_cache(items, cache)
    if pending_items:
        logger.warning(human_review_strings.LOG_REVIEW_SAMPLE_PARTIAL_LABELS.format(
            pending=len(pending_items), total=len(items), judged=len(judgements)))
    return pair_items_with_judgements(items, judgements)
