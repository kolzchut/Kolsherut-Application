from app.services.retrieval.select_documents_by_semantic_score import (
    collect_cosine_similarities,
    recover_cosine_similarity,
)
from app.vars import COSINE_SCORE_KEY, COSINE_SCORE_RATIO_KEY, SEMANTIC_SCORE_KEY


def compute_cosine_score(document: dict) -> float | None:
    """The cosine MIN_SEMANTIC_SCORE is compared against.

    None when kNN never surfaced the document - a BM25-only hit carries no cosine of its
    own, the semantic floor imputes one for it.
    """
    semantic_score = document.get(SEMANTIC_SCORE_KEY)
    if semantic_score is None:
        return None
    return recover_cosine_similarity(semantic_score)


def compute_cosine_score_ratio(
    cosine_score: float | None, top_cosine_similarity: float | None
) -> float | None:
    """The fraction of the pool's best cosine SEMANTIC_SCORE_RATIO is compared against.

    None when there is no cosine to compare, or when the best cosine is not positive and
    the fraction would carry no meaning.
    """
    if cosine_score is None or top_cosine_similarity is None or top_cosine_similarity <= 0.0:
        return None
    return cosine_score / top_cosine_similarity


def attach_cosine_scores_to_document(document: dict, top_cosine_similarity: float | None) -> dict:
    cosine_score = compute_cosine_score(document)
    return {
        **document,
        COSINE_SCORE_KEY: cosine_score,
        COSINE_SCORE_RATIO_KEY: compute_cosine_score_ratio(cosine_score, top_cosine_similarity),
    }


def attach_cosine_scores(documents: list[dict]) -> list[dict]:
    """Attach both semantic-floor inputs to every document, in the floors' own units.

    Must be called on the same pool the semantic floor selects from: the ratio is relative
    to that pool's best cosine, so attaching it earlier or later would report a fraction
    the cut never used.
    """
    cosine_similarities = collect_cosine_similarities(documents)
    top_cosine_similarity = max(cosine_similarities) if cosine_similarities else None
    return [
        attach_cosine_scores_to_document(document, top_cosine_similarity)
        for document in documents
    ]
