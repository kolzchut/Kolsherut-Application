from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RAG_EMBEDDINGS_INDEX_NAME


def build_rag_index_settings() -> dict:
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


def build_rag_index_mappings(embedding_dimensions: int) -> dict:
    return {
        'properties': {
            'card_id': {'type': 'keyword'},
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


def ensure_rag_index_exists(embedding_dimensions: int) -> None:
    elasticsearch_client = get_elasticsearch_client()
    if elasticsearch_client.indices.exists(index=RAG_EMBEDDINGS_INDEX_NAME):
        return
    elasticsearch_client.indices.create(
        index=RAG_EMBEDDINGS_INDEX_NAME,
        settings=build_rag_index_settings(),
        mappings=build_rag_index_mappings(embedding_dimensions),
    )
