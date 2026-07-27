from app.vars import LEXICAL_SCORE_KEY, SEMANTIC_SCORE_KEY


def build_scores_by_service_id(ranked_documents: list[dict]) -> dict:
    """Snapshot one retriever's raw Elasticsearch scores before fusion overwrites them.

    Must be called on the per-retriever lists, not on the fused list: reciprocal rank
    fusion replaces 'score' with the rank-derived fused value.
    """
    return {document['service_id']: document['score'] for document in ranked_documents}


def attach_retriever_scores(
    fused_documents: list[dict],
    semantic_scores_by_service_id: dict,
    lexical_scores_by_service_id: dict,
) -> list[dict]:
    """Re-attach each retriever's raw score to the fused documents.

    A document a retriever never surfaced gets None rather than 0.0 - 'absent' and
    'scored zero' must stay distinguishable for the semantic floor to impute correctly.
    """
    return [
        {
            **document,
            SEMANTIC_SCORE_KEY: semantic_scores_by_service_id.get(document['service_id']),
            LEXICAL_SCORE_KEY: lexical_scores_by_service_id.get(document['service_id']),
        }
        for document in fused_documents
    ]
