from app.services.elasticsearch.async_elasticsearch_client import get_async_elasticsearch_client
from app.vars import KNN_NUM_CANDIDATES, RETRIEVAL_EMBEDDINGS_INDEX_NAME


async def knn_search_documents(query_embedding: list[float], top_k: int) -> list[dict]:
    search_response = await get_async_elasticsearch_client().search(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        knn={
            'field': 'embedding',
            'query_vector': query_embedding,
            'k': top_k,
            'num_candidates': max(KNN_NUM_CANDIDATES, top_k),
        },
        size=top_k,
    )
    return search_response['hits']['hits']
