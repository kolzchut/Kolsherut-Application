from app.services.elasticsearch.async_elasticsearch_client import get_async_elasticsearch_client
from app.vars import RAG_EMBEDDINGS_INDEX_NAME


async def bm25_search_documents(query: str, top_k: int) -> list[dict]:
    search_response = await get_async_elasticsearch_client().search(
        index=RAG_EMBEDDINGS_INDEX_NAME,
        query={'match': {'embedded_text': query}},
        size=top_k,
    )
    return search_response['hits']['hits']
