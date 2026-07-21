from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RETRIEVAL_EMBEDDINGS_INDEX_NAME


def build_retrieval_index_settings() -> dict:
    return {
        'analysis': {
            'analyzer': {
                'hebrew_icu': {
                    'tokenizer': 'icu_tokenizer',
                    'filter': ['icu_folding'],
                }
            }
        }
    }


def build_retrieval_index_mappings(embedding_dimensions: int) -> dict:
    return {
        'properties': {
            'service_id': {'type': 'keyword'},
            'embedded_text': {'type': 'text', 'analyzer': 'hebrew_icu'},
            'context_text': {'type': 'text', 'analyzer': 'hebrew_icu'},
            'embedding': {
                'type': 'dense_vector',
                'dims': embedding_dimensions,
                'index': True,
                'similarity': 'cosine',
            },
        }
    }


def ensure_retrieval_index_exists(embedding_dimensions: int) -> None:
    elasticsearch_client = get_elasticsearch_client()
    if elasticsearch_client.indices.exists(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME):
        return
    elasticsearch_client.indices.create(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        settings=build_retrieval_index_settings(),
        mappings=build_retrieval_index_mappings(embedding_dimensions),
    )
