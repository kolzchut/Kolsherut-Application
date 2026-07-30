from app.services.text_embedding.resolve_embedding_provider import resolve_embedding_provider


def embed_passage_text(text: str) -> list[float]:
    return resolve_embedding_provider().embed_documents([text])[0]


def embed_passages_batch(texts: list[str]) -> list[list[float]]:
    return resolve_embedding_provider().embed_documents(texts)


def embed_query_text(text: str) -> list[float]:
    return resolve_embedding_provider().embed_query(text)
