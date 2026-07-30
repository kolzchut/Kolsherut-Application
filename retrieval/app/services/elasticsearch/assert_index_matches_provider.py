from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.services.logging.get_terminal_logger import get_terminal_logger
from app.strings import (
    ERROR_INDEX_DIMENSIONS_MISMATCH,
    ERROR_INDEX_PROVIDER_MISMATCH,
    INDEX_MISSING_EMBEDDING_PROVIDER_META_MESSAGE,
)
from app.vars import (
    DENSE_VECTOR_DIMENSIONS_KEY,
    EMBEDDING_VECTOR_FIELD_NAME,
    INDEX_MAPPINGS_KEY,
    INDEX_MAPPINGS_META_KEY,
    INDEX_MAPPINGS_PROPERTIES_KEY,
    INDEX_META_EMBEDDING_PROVIDER_KEY,
    RETRIEVAL_EMBEDDINGS_INDEX_NAME,
)


def fetch_retrieval_index_mappings() -> dict:
    response = get_elasticsearch_client().indices.get_mapping(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME)
    return response[RETRIEVAL_EMBEDDINGS_INDEX_NAME][INDEX_MAPPINGS_KEY]


def read_stored_embedding_dimensions(index_mappings: dict) -> int | None:
    embedding_field = index_mappings.get(INDEX_MAPPINGS_PROPERTIES_KEY, {}).get(
        EMBEDDING_VECTOR_FIELD_NAME, {})
    return embedding_field.get(DENSE_VECTOR_DIMENSIONS_KEY)


def read_stored_embedding_provider(index_mappings: dict) -> str | None:
    return index_mappings.get(INDEX_MAPPINGS_META_KEY, {}).get(INDEX_META_EMBEDDING_PROVIDER_KEY)


def assert_stored_dimensions_match(
        stored_dimensions: int | None, provider_name: str, probed_dimensions: int) -> None:
    if stored_dimensions is None or stored_dimensions == probed_dimensions:
        return
    raise ValueError(ERROR_INDEX_DIMENSIONS_MISMATCH.format(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        stored_dimensions=stored_dimensions,
        provider=provider_name,
        probed_dimensions=probed_dimensions,
    ))


def warn_provider_stamp_is_missing(
        stored_dimensions: int | None, provider_name: str, probed_dimensions: int) -> None:
    get_terminal_logger().warning(INDEX_MISSING_EMBEDDING_PROVIDER_META_MESSAGE.format(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        meta_key=INDEX_MAPPINGS_META_KEY,
        provider_key=INDEX_META_EMBEDDING_PROVIDER_KEY,
        provider=provider_name,
        stored_dimensions=stored_dimensions,
        probed_dimensions=probed_dimensions,
    ))


def assert_stored_provider_matches(
        stored_provider: str | None, provider_name: str) -> None:
    if stored_provider == provider_name:
        return
    raise ValueError(ERROR_INDEX_PROVIDER_MISMATCH.format(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        stored_provider=stored_provider,
        provider=provider_name,
    ))


def assert_index_matches_provider(provider_name: str, probed_dimensions: int) -> None:
    """Refuse to serve an index the active embedder did not build: cross-provider kNN returns
    confident nonsense instead of failing, and a widened provider fails later inside bulk()."""
    if not get_elasticsearch_client().indices.exists(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME):
        return
    index_mappings = fetch_retrieval_index_mappings()
    stored_dimensions = read_stored_embedding_dimensions(index_mappings)
    assert_stored_dimensions_match(stored_dimensions, provider_name, probed_dimensions)
    stored_provider = read_stored_embedding_provider(index_mappings)
    if stored_provider is None:
        warn_provider_stamp_is_missing(stored_dimensions, provider_name, probed_dimensions)
        return
    assert_stored_provider_matches(stored_provider, provider_name)
