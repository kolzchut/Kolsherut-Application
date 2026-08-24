from elasticsearch.helpers import scan

from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import (
    RETRIEVAL_EMBEDDINGS_INDEX_NAME,
    SERVICE_SCAN_BATCH_SIZE,
    SERVICE_SCAN_SCROLL_KEEP_ALIVE,
)


def fetch_embedded_service_ids() -> set:
    elasticsearch_client = get_elasticsearch_client()
    if not elasticsearch_client.indices.exists(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME):
        return set()
    scan_hits = scan(
        elasticsearch_client,
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        query={'query': {'match_all': {}}, '_source': False},
        size=SERVICE_SCAN_BATCH_SIZE,
        scroll=SERVICE_SCAN_SCROLL_KEEP_ALIVE,
    )
    return {hit['_id'] for hit in scan_hits}
