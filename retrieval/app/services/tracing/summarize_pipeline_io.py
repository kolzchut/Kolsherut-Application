from app.vars import LEXICAL_SCORE_KEY, SEMANTIC_SCORE_KEY


def summarize_hits(hits: list[dict]) -> list[dict]:
    return [{'service_id': hit['_source']['service_id'], 'score': hit['_score']} for hit in hits]


def summarize_documents(documents: list[dict]) -> list[dict]:
    return [{'service_id': document['service_id'], 'score': document['score']} for document in documents]


def summarize_scored_documents(documents: list[dict]) -> list[dict]:
    """Like summarize_documents, but keeps the raw retriever scores so the score cut's
    knee is visible in the trace."""
    return [
        {
            'service_id': document['service_id'],
            'score': document['score'],
            SEMANTIC_SCORE_KEY: document.get(SEMANTIC_SCORE_KEY),
            LEXICAL_SCORE_KEY: document.get(LEXICAL_SCORE_KEY),
        }
        for document in documents
    ]
