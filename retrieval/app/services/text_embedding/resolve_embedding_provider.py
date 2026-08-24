from functools import lru_cache

from app.services.text_embedding.embedding_provider_schema import EmbeddingProvider
from app.services.text_embedding.providers.gemini.build_gemini_embedding_provider import (
    build_gemini_embedding_provider,
)
from app.services.text_embedding.providers.local.build_local_embedding_provider import (
    build_local_embedding_provider,
)
from app.strings import ERROR_UNKNOWN_EMBEDDING_PROVIDER
from app.vars import EMBEDDING_PROVIDER, EMBEDDING_PROVIDER_GEMINI, EMBEDDING_PROVIDER_LOCAL


@lru_cache(maxsize=1)
def resolve_embedding_provider() -> EmbeddingProvider:
    """The only place providers are named together; each builder constructs its backend lazily."""
    builders = {
        EMBEDDING_PROVIDER_LOCAL: build_local_embedding_provider,
        EMBEDDING_PROVIDER_GEMINI: build_gemini_embedding_provider,
    }
    builder = builders.get(EMBEDDING_PROVIDER)
    if builder is None:
        raise ValueError(ERROR_UNKNOWN_EMBEDDING_PROVIDER.format(
            provider=EMBEDDING_PROVIDER, supported=', '.join(builders)))
    return builder()
