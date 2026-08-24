from collections.abc import Iterator

from elasticsearch.helpers import scan

from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import SERVICE_SCAN_BATCH_SIZE, SERVICE_SCAN_SCROLL_KEEP_ALIVE, SERVICES_INDEX_NAME


def scan_all_services() -> Iterator[dict]:
    scan_hits = scan(
        get_elasticsearch_client(),
        index=SERVICES_INDEX_NAME,
        query={'query': {'match_all': {}}},
        size=SERVICE_SCAN_BATCH_SIZE,
        scroll=SERVICE_SCAN_SCROLL_KEEP_ALIVE,
    )
    return (hit['_source'] for hit in scan_hits)
