from collections.abc import Iterator

from elasticsearch.helpers import scan

from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import CARD_SCAN_BATCH_SIZE, CARD_SCAN_SCROLL_KEEP_ALIVE, CARDS_INDEX_NAME


def scan_all_cards() -> Iterator[dict]:
    scan_hits = scan(
        get_elasticsearch_client(),
        index=CARDS_INDEX_NAME,
        query={'query': {'match_all': {}}},
        size=CARD_SCAN_BATCH_SIZE,
        scroll=CARD_SCAN_SCROLL_KEEP_ALIVE,
    )
    return (hit['_source'] for hit in scan_hits)
