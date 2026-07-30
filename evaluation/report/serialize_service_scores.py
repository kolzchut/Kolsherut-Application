from evaluation import vars
from evaluation.schemas import ServiceScores

# Every field None. Stands in for a service retrieval never scored, so the two sides of the
# diff share one key set instead of one side omitting the columns entirely.
UNSCORED_SERVICE = ServiceScores()


def serialize_service_scores(service_scores: ServiceScores | None) -> dict:
    """Flatten one service's scores into its five JSON keys, in FE-badge order.

    None in, or None on any field, serializes as JSON null. Nothing is rounded, defaulted or
    recomputed here: "no retriever surfaced this" must not read as "a retriever scored zero".
    """
    scores = service_scores or UNSCORED_SERVICE
    return {
        vars.SERVICE_SCORE_RETRIEVAL_KEY: scores.retrieval_score,
        vars.SERVICE_SCORE_COSINE_KEY: scores.cosine_score,
        vars.SERVICE_SCORE_COSINE_RATIO_KEY: scores.cosine_score_ratio,
        vars.SERVICE_SCORE_LEXICAL_KEY: scores.lexical_score,
        vars.SERVICE_SCORE_SEMANTIC_KEY: scores.semantic_score,
    }


def serialize_service_score_map(service_score_map: dict[str, ServiceScores]) -> dict:
    """Serialize a whole per-query score map, keeping its normalized service names as keys."""
    return {
        service_name: serialize_service_scores(scores)
        for service_name, scores in service_score_map.items()
    }
