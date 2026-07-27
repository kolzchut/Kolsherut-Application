from app.services.retrieval.select_documents_by_semantic_score import (
    select_documents_by_semantic_score,
)
from app.vars import MAX_RETURNED_SERVICES, MIN_FUSED_SCORE


def filter_documents_by_min_fused_score(fused_documents: list[dict]) -> list[dict]:
    return [document for document in fused_documents if document['score'] >= MIN_FUSED_SCORE]


def cap_documents_to_max_returned(documents: list[dict]) -> list[dict]:
    if MAX_RETURNED_SERVICES <= 0:
        return documents
    return documents[:MAX_RETURNED_SERVICES]


def truncate_documents_by_score(fused_documents: list[dict]) -> tuple[list[dict], list[dict]]:
    """Narrow the fused pool down to what is actually returned.

    Returns both the post-floor list and the post-cap list so tracing can attribute each
    dropped document to the rule that dropped it.
    """
    score_selected_documents = select_documents_by_semantic_score(
        filter_documents_by_min_fused_score(fused_documents)
    )
    return score_selected_documents, cap_documents_to_max_returned(score_selected_documents)
