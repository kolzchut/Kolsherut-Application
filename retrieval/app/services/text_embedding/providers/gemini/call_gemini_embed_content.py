from time import sleep

from google.genai import types

from app.services.logging.get_terminal_logger import get_terminal_logger
from app.services.text_embedding.normalize_embedding_vector import normalize_embedding_vector
from app.services.text_embedding.providers.gemini.get_gemini_client import get_gemini_client
from app.strings import ERROR_GEMINI_EMBED_FAILED, GEMINI_EMBED_RETRY_MESSAGE
from app.vars import (
    GEMINI_EMBED_MAX_ATTEMPTS,
    GEMINI_EMBED_RETRY_BASE_SECONDS,
    GEMINI_EMBEDDING_DIMENSIONS,
    GEMINI_EMBEDDING_MODEL,
)


def build_embed_config(task_type: str) -> types.EmbedContentConfig:
    return types.EmbedContentConfig(
        task_type=task_type,
        output_dimensionality=GEMINI_EMBEDDING_DIMENSIONS,
    )


def request_gemini_embeddings(texts: list[str], task_type: str) -> list[list[float]]:
    """Truncated Matryoshka outputs are not unit-norm, so every vector is re-normalized."""
    response = get_gemini_client().models.embed_content(
        model=GEMINI_EMBEDDING_MODEL,
        contents=texts,
        config=build_embed_config(task_type),
    )
    return [normalize_embedding_vector(embedding.values) for embedding in response.embeddings]


def call_gemini_embed_content(texts: list[str], task_type: str) -> list[list[float]]:
    """The one sanctioned try/except in the embedding path: the network retry boundary."""
    for attempt in range(1, GEMINI_EMBED_MAX_ATTEMPTS + 1):
        try:
            return request_gemini_embeddings(texts, task_type)
        except Exception as error:  # noqa: BLE001 - retry on everything, do not classify SDK errors
            if attempt == GEMINI_EMBED_MAX_ATTEMPTS:
                raise RuntimeError(ERROR_GEMINI_EMBED_FAILED.format(
                    attempts=attempt, error=error)) from error
            delay = GEMINI_EMBED_RETRY_BASE_SECONDS * 2 ** (attempt - 1)
            get_terminal_logger().warning(GEMINI_EMBED_RETRY_MESSAGE.format(
                attempt=attempt, attempts=GEMINI_EMBED_MAX_ATTEMPTS, error=error, delay=delay))
            sleep(delay)
