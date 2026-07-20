def summarize_hits(hits: list[dict]) -> list[dict]:
    return [{'card_id': hit['_source']['card_id'], 'score': hit['_score']} for hit in hits]


def summarize_documents(documents: list[dict]) -> list[dict]:
    return [{'card_id': document['card_id'], 'score': document['score']} for document in documents]
