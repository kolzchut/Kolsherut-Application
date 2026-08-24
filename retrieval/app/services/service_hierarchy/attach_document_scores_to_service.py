from app.vars import (
    COSINE_SCORE_KEY,
    COSINE_SCORE_RATIO_KEY,
    LEXICAL_SCORE_KEY,
    SEMANTIC_SCORE_KEY,
)

# The fused RRF score reciprocal rank fusion writes over every document's 'score'.
FUSED_DOCUMENT_SCORE_KEY = 'score'
# The Service field the fused score is exposed under. Deliberately not 'score': the cards
# mapper already writes a static 'score'/'service_boost' pair the Service schema drops, and
# the retrieval score must never be confused with that boost.
SERVICE_RETRIEVAL_SCORE_FIELD = 'retrieval_score'
# Every other score reaches the service under the document's own key name.
DOCUMENT_SCORE_KEYS_COPIED_VERBATIM = (
    SEMANTIC_SCORE_KEY,
    LEXICAL_SCORE_KEY,
    COSINE_SCORE_KEY,
    COSINE_SCORE_RATIO_KEY,
)


def build_service_scores_from_document(retrieved_document: dict) -> dict:
    """One retrieved document's scores, keyed by the Service field names they land on.

    A key the document does not carry stays None: a retriever that never surfaced the
    document is not the same as one that scored it zero, so no score is ever defaulted
    to 0.0 here or anywhere downstream.
    """
    verbatim_scores = {
        score_key: retrieved_document.get(score_key)
        for score_key in DOCUMENT_SCORE_KEYS_COPIED_VERBATIM
    }
    return {
        SERVICE_RETRIEVAL_SCORE_FIELD: retrieved_document.get(FUSED_DOCUMENT_SCORE_KEY),
        **verbatim_scores,
    }


def attach_document_scores_to_service(service: dict, retrieved_document: dict) -> dict:
    """A copy of the service carrying the scores of the document that won its name.

    Returns a new dict rather than mutating the assembled service, so the hierarchy the
    caller built stays untouched.
    """
    return {**service, **build_service_scores_from_document(retrieved_document)}
