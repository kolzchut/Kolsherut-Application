from functools import lru_cache

from google import genai

from app.strings import ERROR_MISSING_GEMINI_API_KEY
from app.vars import GEMINI_EMBEDDER_API_KEY


@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
    """The API-key check lives here, not at import time, so a local-arm deployment never trips it."""
    if not GEMINI_EMBEDDER_API_KEY:
        raise ValueError(ERROR_MISSING_GEMINI_API_KEY)
    return genai.Client(api_key=GEMINI_EMBEDDER_API_KEY)
