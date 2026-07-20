from fastapi.concurrency import run_in_threadpool

from app.services.elasticsearch.hybrid_search_documents import hybrid_search_documents
from app.services.embedding.embedding_model import embed_query_text
from app.services.retrieval.build_retrieved_document import build_retrieved_document
from app.services.retrieval.reciprocal_rank_fusion import fuse_rankings_by_reciprocal_rank
from app.services.retrieval.reranker import rerank_documents
from app.services.tracing.build_retrieval_steps import build_retrieval_steps
from app.services.tracing.time_async_call import time_async_call
from app.vars import CANDIDATE_POOL_SIZE, RERANK_POOL_SIZE, RRF_RANK_CONSTANT


async def retrieve_documents_with_trace(query: str, top_k: int) -> tuple[list[dict], list[dict]]:
    query_embedding, bi_encoder_ms = await time_async_call(run_in_threadpool(embed_query_text, query))
    (knn_hits, knn_ms), (bm25_hits, bm25_ms) = await hybrid_search_documents(
        query, query_embedding, CANDIDATE_POOL_SIZE
    )
    knn_documents = [build_retrieved_document(hit) for hit in knn_hits]
    bm25_documents = [build_retrieved_document(hit) for hit in bm25_hits]
    fused_documents = fuse_rankings_by_reciprocal_rank(
        [knn_documents, bm25_documents], RRF_RANK_CONSTANT
    )[:RERANK_POOL_SIZE]
    reranked_documents, cross_encoder_ms = await rerank_fused_documents(query, fused_documents)
    steps = build_retrieval_steps(
        query, query_embedding, bi_encoder_ms, knn_hits, knn_ms, bm25_hits, bm25_ms,
        fused_documents, reranked_documents, cross_encoder_ms,
    )
    return reranked_documents[:top_k], steps


async def rerank_fused_documents(query: str, fused_documents: list[dict]) -> tuple[list[dict], float]:
    if not fused_documents:
        return [], 0.0
    return await time_async_call(run_in_threadpool(rerank_documents, query, fused_documents))
