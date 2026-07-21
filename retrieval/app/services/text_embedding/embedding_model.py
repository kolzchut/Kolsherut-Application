from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings

from app.vars import EMBEDDING_MODEL_PATH, EMBEDDING_PASSAGE_PREFIX, EMBEDDING_QUERY_PREFIX


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_PATH)


def embed_passage_text(text: str) -> list[float]:
    return get_embedding_model().embed_query(EMBEDDING_PASSAGE_PREFIX + text)


def embed_passages_batch(texts: list[str]) -> list[list[float]]:
    prefixed_texts = [EMBEDDING_PASSAGE_PREFIX + text for text in texts]
    return get_embedding_model().embed_documents(prefixed_texts)


def embed_query_text(text: str) -> list[float]:
    return get_embedding_model().embed_query(EMBEDDING_QUERY_PREFIX + text)
