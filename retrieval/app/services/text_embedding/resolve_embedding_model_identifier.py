from app.strings import ERROR_UNKNOWN_EMBEDDING_PROVIDER
from app.vars import (
    EMBEDDING_MODEL_PATH,
    EMBEDDING_PROVIDER,
    EMBEDDING_PROVIDER_GEMINI,
    EMBEDDING_PROVIDER_LOCAL,
    GEMINI_EMBEDDING_MODEL,
)


def resolve_embedding_model_identifier() -> str:
    """Which model the active provider actually calls, stamped into the index mappings '_meta'.

    Keyed off the same EMBEDDING_PROVIDER as the provider registry so the two never disagree.
    """
    model_identifiers = {
        EMBEDDING_PROVIDER_LOCAL: EMBEDDING_MODEL_PATH,
        EMBEDDING_PROVIDER_GEMINI: GEMINI_EMBEDDING_MODEL,
    }
    model_identifier = model_identifiers.get(EMBEDDING_PROVIDER)
    if model_identifier is None:
        raise ValueError(ERROR_UNKNOWN_EMBEDDING_PROVIDER.format(
            provider=EMBEDDING_PROVIDER, supported=', '.join(model_identifiers)))
    return model_identifier
