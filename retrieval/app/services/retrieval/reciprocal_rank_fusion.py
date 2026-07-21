def build_rank_contributions(ranked_documents: list[dict], rank_constant: int) -> dict:
    return {
        document['service_id']: 1 / (rank_constant + rank)
        for rank, document in enumerate(ranked_documents, start=1)
    }


def sum_reciprocal_ranks(ranked_document_lists: list[list[dict]], rank_constant: int) -> dict:
    fused_scores: dict = {}
    for ranked_documents in ranked_document_lists:
        contributions = build_rank_contributions(ranked_documents, rank_constant)
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
    ranked_document_lists: list[list[dict]], rank_constant: int
) -> list[dict]:
    fused_scores = sum_reciprocal_ranks(ranked_document_lists, rank_constant)
    documents_by_service_id = index_documents_by_service_id(ranked_document_lists)
    fused_documents = [
        {**documents_by_service_id[service_id], 'score': fused_score}
        for service_id, fused_score in fused_scores.items()
    ]
    return sorted(fused_documents, key=lambda document: document['score'], reverse=True)
