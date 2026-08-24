from app.services.text_embedding.embedding_provider_schema import EmbeddingProvider
from app.strings import EMBEDDING_DIMENSION_PROBE_TEXT


def probe_embedding_dimensions(provider: EmbeddingProvider) -> int:
    return len(provider.embed_query(EMBEDDING_DIMENSION_PROBE_TEXT))
