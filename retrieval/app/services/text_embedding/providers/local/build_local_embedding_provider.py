from app.services.text_embedding.embedding_provider_schema import EmbeddingProvider
from app.services.text_embedding.providers.local.load_local_embedding_model import load_local_embedding_model
from app.vars import EMBEDDING_PASSAGE_PREFIX, EMBEDDING_PROVIDER_LOCAL, EMBEDDING_QUERY_PREFIX


def embed_local_documents(texts: list[str]) -> list[list[float]]:
    """The E5 passage prefix lives here and nowhere else in the embedding path."""
    return load_local_embedding_model().embed_documents(
        [EMBEDDING_PASSAGE_PREFIX + text for text in texts]
    )


def embed_local_query(text: str) -> list[float]:
    return load_local_embedding_model().embed_query(EMBEDDING_QUERY_PREFIX + text)


def build_local_embedding_provider() -> EmbeddingProvider:
    return EmbeddingProvider(
        name=EMBEDDING_PROVIDER_LOCAL,
        embed_documents=embed_local_documents,
        embed_query=embed_local_query,
    )
