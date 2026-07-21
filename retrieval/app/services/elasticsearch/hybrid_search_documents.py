import asyncio

from app.services.elasticsearch.bm25_search_documents import bm25_search_documents
from app.services.elasticsearch.knn_search_documents import knn_search_documents
from app.services.tracing.time_async_call import time_async_call


async def hybrid_search_documents(
    query: str, query_embedding: list[float], top_k: int
) -> tuple[tuple, tuple]:
    return await asyncio.gather(
        time_async_call(knn_search_documents(query_embedding, top_k)),
        time_async_call(bm25_search_documents(query, top_k)),
    )
