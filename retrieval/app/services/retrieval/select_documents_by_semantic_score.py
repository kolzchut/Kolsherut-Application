from app.vars import (
    COSINE_SCORE_OFFSET,
    COSINE_SCORE_SCALE,
    KEEP_LEXICAL_ONLY_DOCUMENTS,
    MIN_SEMANTIC_SCORE,
    MINIMUM_COSINE_SIMILARITY,
    SEMANTIC_SCORE_KEY,
    SEMANTIC_SCORE_RATIO,
)


def recover_cosine_similarity(elasticsearch_score: float) -> float:
    """Undo the (1 + cosine) / 2 mapping Elasticsearch applies to a cosine dense_vector."""
    return (elasticsearch_score - COSINE_SCORE_OFFSET) / COSINE_SCORE_SCALE


def collect_cosine_similarities(documents: list[dict]) -> list[float]:
    return [
        recover_cosine_similarity(document[SEMANTIC_SCORE_KEY])
        for document in documents
        if document.get(SEMANTIC_SCORE_KEY) is not None
    ]


def compute_imputed_similarity(cosine_similarities: list[float]) -> float:
    """The cosine imputed for documents BM25 found but kNN did not.

    A document absent from a kNN list of size N scores at or below the Nth-best cosine in
    that list, so the list minimum is the most generous estimate that stays admissible.
    """
    return min(cosine_similarities) if cosine_similarities else MINIMUM_COSINE_SIMILARITY


def compute_effective_semantic_floor(cosine_similarities: list[float]) -> float:
    """The higher of the absolute floor and the ratio floor, both in cosine units.

    A ratio of 0.0 means 'disabled', which is the cosine minimum - not a floor at 0.0,
    which would cut every document the embedder scored as negatively similar.
    """
    if not cosine_similarities or SEMANTIC_SCORE_RATIO <= 0.0:
        return MIN_SEMANTIC_SCORE
    return max(MIN_SEMANTIC_SCORE, SEMANTIC_SCORE_RATIO * max(cosine_similarities))


def resolve_document_similarity(document: dict, imputed_similarity: float) -> float:
    semantic_score = document.get(SEMANTIC_SCORE_KEY)
    if semantic_score is None:
        return imputed_similarity
    return recover_cosine_similarity(semantic_score)


def select_documents_by_semantic_score(documents: list[dict]) -> list[dict]:
    cosine_similarities = collect_cosine_similarities(documents)
    semantic_floor = compute_effective_semantic_floor(cosine_similarities)
    imputed_similarity = compute_imputed_similarity(cosine_similarities)
    return [
        document
        for document in documents
        if (KEEP_LEXICAL_ONLY_DOCUMENTS and document.get(SEMANTIC_SCORE_KEY) is None)
        or resolve_document_similarity(document, imputed_similarity) >= semantic_floor
    ]
