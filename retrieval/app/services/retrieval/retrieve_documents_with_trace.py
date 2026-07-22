from time import perf_counter

from fastapi.concurrency import run_in_threadpool

from app.services.elasticsearch.hybrid_search_documents import hybrid_search_documents
from app.services.retrieval.build_retrieved_document import build_retrieved_document
from app.services.retrieval.reciprocal_rank_fusion import fuse_rankings_by_reciprocal_rank
from app.services.text_embedding.embedding_model import embed_query_text
from app.services.tracing.build_retrieval_steps import build_retrieval_steps
from app.services.tracing.time_async_call import time_async_call
from app.vars import (
    CANDIDATE_POOL_SIZE,
    LEXICAL_WEIGHT,
    MIN_FUSED_SCORE,
    RRF_RANK_CONSTANT,
    SEMANTIC_WEIGHT,
)


def filter_documents_by_min_fused_score(fused_documents: list[dict]) -> list[dict]:
    return [document for document in fused_documents if document['score'] >= MIN_FUSED_SCORE]


async def retrieve_documents_with_trace(query: str) -> tuple[list[dict], list[dict]]:
    query_embedding, bi_encoder_ms = await time_async_call(run_in_threadpool(embed_query_text, query))
    (knn_hits, knn_ms), (bm25_hits, bm25_ms) = await hybrid_search_documents(
        query, query_embedding, CANDIDATE_POOL_SIZE
    )
    knn_documents = [build_retrieved_document(hit) for hit in knn_hits]
    bm25_documents = [build_retrieved_document(hit) for hit in bm25_hits]
    fusion_started_at = perf_counter()
    fused_documents = fuse_rankings_by_reciprocal_rank(
        [knn_documents, bm25_documents], RRF_RANK_CONSTANT, [SEMANTIC_WEIGHT, LEXICAL_WEIGHT]
    )
    retrieved_documents = filter_documents_by_min_fused_score(fused_documents)
    fusion_ms = (perf_counter() - fusion_started_at) * 1000
    steps = build_retrieval_steps(
        query, query_embedding, bi_encoder_ms, knn_hits, knn_ms, bm25_hits, bm25_ms,
        fused_documents, retrieved_documents, fusion_ms,
    )
    return retrieved_documents, steps
