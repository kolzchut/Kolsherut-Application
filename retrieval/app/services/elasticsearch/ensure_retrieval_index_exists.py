from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.services.text_embedding.resolve_embedding_model_identifier import (
    resolve_embedding_model_identifier,
)
from app.vars import (
    DENSE_VECTOR_DIMENSIONS_KEY,
    EMBEDDING_PROVIDER,
    EMBEDDING_VECTOR_FIELD_NAME,
    INDEX_MAPPINGS_META_KEY,
    INDEX_MAPPINGS_PROPERTIES_KEY,
    INDEX_META_EMBEDDING_DIMENSIONS_KEY,
    INDEX_META_EMBEDDING_MODEL_KEY,
    INDEX_META_EMBEDDING_PROVIDER_KEY,
    RETRIEVAL_EMBEDDINGS_INDEX_NAME,
)


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
    """'_meta' records which embedder produced the vectors, so assert_index_matches_provider
    can refuse to boot a provider against another provider's index."""
    return {
        INDEX_MAPPINGS_META_KEY: {
            INDEX_META_EMBEDDING_PROVIDER_KEY: EMBEDDING_PROVIDER,
            INDEX_META_EMBEDDING_MODEL_KEY: resolve_embedding_model_identifier(),
            INDEX_META_EMBEDDING_DIMENSIONS_KEY: embedding_dimensions,
        },
        INDEX_MAPPINGS_PROPERTIES_KEY: {
            'service_id': {'type': 'keyword'},
            'embedded_text': {'type': 'text', 'analyzer': 'hebrew_icu'},
            'context_text': {'type': 'text', 'analyzer': 'hebrew_icu'},
            EMBEDDING_VECTOR_FIELD_NAME: {
                'type': 'dense_vector',
                DENSE_VECTOR_DIMENSIONS_KEY: embedding_dimensions,
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
