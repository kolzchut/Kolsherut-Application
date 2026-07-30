from app.services.text_embedding.embedding_provider_schema import EmbeddingProvider
from app.services.text_embedding.providers.gemini.embed_gemini_texts import embed_gemini_texts
from app.vars import EMBEDDING_PROVIDER_GEMINI, GEMINI_DOCUMENT_TASK_TYPE, GEMINI_QUERY_TASK_TYPE


def embed_gemini_documents(texts: list[str]) -> list[list[float]]:
    """The Gemini task types live here and nowhere else in the embedding path."""
    return embed_gemini_texts(texts, GEMINI_DOCUMENT_TASK_TYPE)


def embed_gemini_query(text: str) -> list[float]:
    return embed_gemini_texts([text], GEMINI_QUERY_TASK_TYPE)[0]


def build_gemini_embedding_provider() -> EmbeddingProvider:
    return EmbeddingProvider(
        name=EMBEDDING_PROVIDER_GEMINI,
        embed_documents=embed_gemini_documents,
        embed_query=embed_gemini_query,
    )
