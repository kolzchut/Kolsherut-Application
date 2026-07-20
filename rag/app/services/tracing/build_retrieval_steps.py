from app.services.tracing.build_pipeline_step import build_pipeline_step
from app.services.tracing.summarize_pipeline_io import summarize_documents, summarize_hits
from app.strings import (
    PIPELINE_STEP_BI_ENCODER,
    PIPELINE_STEP_BM25,
    PIPELINE_STEP_CROSS_ENCODER,
    PIPELINE_STEP_KNN,
)


def build_retrieval_steps(
    query: str,
    query_embedding: list[float],
    bi_encoder_ms: float,
    knn_hits: list[dict],
    knn_ms: float,
    bm25_hits: list[dict],
    bm25_ms: float,
    fused_documents: list[dict],
    reranked_documents: list[dict],
    cross_encoder_ms: float,
) -> list[dict]:
    candidate_card_ids = [document['card_id'] for document in fused_documents]
    return [
        build_pipeline_step(PIPELINE_STEP_BI_ENCODER, query, {'embedding_dimensions': len(query_embedding)}, bi_encoder_ms),
        build_pipeline_step(PIPELINE_STEP_KNN, query, summarize_hits(knn_hits), knn_ms),
        build_pipeline_step(PIPELINE_STEP_BM25, query, summarize_hits(bm25_hits), bm25_ms),
        build_pipeline_step(
            PIPELINE_STEP_CROSS_ENCODER,
            {'query': query, 'candidate_card_ids': candidate_card_ids},
            summarize_documents(reranked_documents),
            cross_encoder_ms,
        ),
    ]
