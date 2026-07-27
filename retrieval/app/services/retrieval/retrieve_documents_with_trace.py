from time import perf_counter

from fastapi.concurrency import run_in_threadpool

from app.services.elasticsearch.hybrid_search_documents import hybrid_search_documents
from app.services.retrieval.attach_retriever_scores import (
    attach_retriever_scores,
    build_scores_by_service_id,
)
from app.services.retrieval.build_retrieved_document import build_retrieved_document
from app.services.retrieval.reciprocal_rank_fusion import fuse_rankings_by_reciprocal_rank
from app.services.retrieval.truncate_documents_by_score import truncate_documents_by_score
from app.services.text_embedding.embedding_model import embed_query_text
from app.services.tracing.build_retrieval_steps import build_retrieval_steps
from app.services.tracing.time_async_call import time_async_call
from app.vars import CANDIDATE_POOL_SIZE, LEXICAL_WEIGHT, RRF_RANK_CONSTANT, SEMANTIC_WEIGHT


def fuse_and_attach_retriever_scores(knn_documents: list[dict], bm25_documents: list[dict]) -> list[dict]:
    """Fuse the two rankings, then restore the raw scores fusion overwrote."""
    semantic_scores = build_scores_by_service_id(knn_documents)
    lexical_scores = build_scores_by_service_id(bm25_documents)
    fused_documents = fuse_rankings_by_reciprocal_rank(
        [knn_documents, bm25_documents], RRF_RANK_CONSTANT, [SEMANTIC_WEIGHT, LEXICAL_WEIGHT]
    )
    return attach_retriever_scores(fused_documents, semantic_scores, lexical_scores)


async def retrieve_documents_with_trace(query: str) -> tuple[list[dict], list[dict]]:
    query_embedding, bi_encoder_ms = await time_async_call(run_in_threadpool(embed_query_text, query))
    (knn_hits, knn_ms), (bm25_hits, bm25_ms) = await hybrid_search_documents(
        query, query_embedding, CANDIDATE_POOL_SIZE
    )
    knn_documents = [build_retrieved_document(hit) for hit in knn_hits]
    bm25_documents = [build_retrieved_document(hit) for hit in bm25_hits]
    fusion_started_at = perf_counter()
    fused_documents = fuse_and_attach_retriever_scores(knn_documents, bm25_documents)
    fusion_ms = (perf_counter() - fusion_started_at) * 1000
    score_cut_started_at = perf_counter()
    score_selected_documents, retrieved_documents = truncate_documents_by_score(fused_documents)
    score_cut_ms = (perf_counter() - score_cut_started_at) * 1000
    steps = build_retrieval_steps(
        query, query_embedding, bi_encoder_ms, knn_hits, knn_ms, bm25_hits, bm25_ms,
        fused_documents, score_selected_documents, retrieved_documents, fusion_ms, score_cut_ms,
    )
    return retrieved_documents, steps
