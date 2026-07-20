from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client


def build_ask_logs_index_mappings() -> dict:
    return {
        'properties': {
            'log_id': {'type': 'keyword'},
            'timestamp': {'type': 'date'},
            'model': {'type': 'keyword'},
            'prompt': {'type': 'text'},
            'answer': {'type': 'text'},
            'history': {'type': 'object', 'enabled': False},
            'retrieved_card_ids': {'type': 'keyword'},
            'num_documents': {'type': 'integer'},
            'latency_ms': {'type': 'float'},
            'timings_ms': {
                'type': 'object',
                'properties': {
                    'bi_encoder': {'type': 'float'},
                    'knn': {'type': 'float'},
                    'bm25': {'type': 'float'},
                    'cross_encoder': {'type': 'float'},
                    'llm': {'type': 'float'},
                },
            },
            'steps': {'type': 'object', 'enabled': False},
            'rating': {'type': 'integer'},
            'rating_description': {'type': 'text'},
            'rated_at': {'type': 'date'},
        }
    }


def ensure_ask_logs_index_exists(index_name: str) -> None:
    elasticsearch_client = get_elasticsearch_client()
    if elasticsearch_client.indices.exists(index=index_name):
        return
    elasticsearch_client.indices.create(index=index_name, mappings=build_ask_logs_index_mappings())
