def build_rank_contributions(ranked_documents: list[dict], rank_constant: int, weight: float) -> dict:
    return {
        document['service_id']: weight / (rank_constant + rank)
        for rank, document in enumerate(ranked_documents, start=1)
    }


def sum_reciprocal_ranks(
    ranked_document_lists: list[list[dict]], rank_constant: int, weights: list[float]
) -> dict:
    fused_scores: dict = {}
    for ranked_documents, weight in zip(ranked_document_lists, weights):
        contributions = build_rank_contributions(ranked_documents, rank_constant, weight)
        for service_id, contribution in contributions.items():
            fused_scores[service_id] = fused_scores.get(service_id, 0.0) + contribution
    return fused_scores


def index_documents_by_service_id(ranked_document_lists: list[list[dict]]) -> dict:
    return {
        document['service_id']: document
        for ranked_documents in ranked_document_lists
        for document in ranked_documents
    }


def fuse_rankings_by_reciprocal_rank(
    ranked_document_lists: list[list[dict]], rank_constant: int, weights: list[float]
) -> list[dict]:
    fused_scores = sum_reciprocal_ranks(ranked_document_lists, rank_constant, weights)
    documents_by_service_id = index_documents_by_service_id(ranked_document_lists)
    fused_documents = [
        {**documents_by_service_id[service_id], 'score': fused_score}
        for service_id, fused_score in fused_scores.items()
    ]
    return sorted(fused_documents, key=lambda document: document['score'], reverse=True)
