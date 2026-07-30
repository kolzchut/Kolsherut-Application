from app.services.service_indexing.chunk_iterable import chunk_iterable
from app.services.text_embedding.providers.gemini.call_gemini_embed_content import call_gemini_embed_content
from app.vars import GEMINI_EMBED_REQUEST_BATCH_SIZE


def embed_gemini_texts(texts: list[str], task_type: str) -> list[list[float]]:
    """Re-chunks the caller's batch to the transport limit and flattens the vectors back in order."""
    chunks = chunk_iterable(texts, GEMINI_EMBED_REQUEST_BATCH_SIZE)
    return [vector for chunk in chunks for vector in call_gemini_embed_content(chunk, task_type)]
