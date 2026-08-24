def build_retrieved_document(hit: dict) -> dict:
    return {
        'service_id': hit['_source']['service_id'],
        'text': hit['_source']['embedded_text'],
        'context_text': hit['_source'].get('context_text', ''),
        'score': hit['_score'],
    }
