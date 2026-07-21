def summarize_hits(hits: list[dict]) -> list[dict]:
    return [{'service_id': hit['_source']['service_id'], 'score': hit['_score']} for hit in hits]


def summarize_documents(documents: list[dict]) -> list[dict]:
    return [{'service_id': document['service_id'], 'score': document['score']} for document in documents]
