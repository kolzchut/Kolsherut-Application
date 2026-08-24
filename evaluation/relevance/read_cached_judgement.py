from evaluation import relevance_vars
from evaluation.relevance.judgement_cache import build_judgement_cache_key
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement


def build_cached_judgement(item: JudgementItem, cache_entry: dict) -> ServiceJudgement:
    """A cached verdict re-attached to this run's identity.

    The verdict comes from the cache; side and rank come from the item, because those are this
    run's retrieval provenance and the cache deliberately never stored them.
    """
    return ServiceJudgement(
        query=item.query, side=item.side, rank=item.rank, service_name=item.service_name,
        verdict=cache_entry[relevance_vars.JUDGEMENT_VERDICT_KEY])


def split_items_by_cache(items: list[JudgementItem], cache: dict[str, dict]
                         ) -> tuple[list[ServiceJudgement], list[JudgementItem]]:
    """The verdicts already known, and the items still to judge.

    A pair can appear on both sides of the diff only across different queries, so each item is
    looked up on its own key; two items sharing a cache key both reuse the one cached verdict.
    """
    cached_judgements = []
    pending_items = []
    for item in items:
        cache_entry = cache.get(build_judgement_cache_key(item.query, item.service_name))
        if cache_entry:
            cached_judgements.append(build_cached_judgement(item, cache_entry))
        else:
            pending_items.append(item)
    return cached_judgements, pending_items
