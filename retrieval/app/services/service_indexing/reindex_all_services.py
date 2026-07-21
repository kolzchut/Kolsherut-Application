from itertools import islice
from typing import Optional

from app.services.elasticsearch.refresh_retrieval_index import refresh_retrieval_index
from app.services.elasticsearch.scan_all_services import scan_all_services
from app.services.service_indexing.chunk_iterable import chunk_iterable
from app.services.service_indexing.embed_service_batch import embed_service_batch
from app.strings import (
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)
from app.vars import SERVICE_EMBED_BATCH_SIZE


def build_empty_counts() -> dict:
    return {
        SERVICE_EMBED_STATUS_EMBEDDED: 0,
        SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT: 0,
        SERVICE_EMBED_STATUS_NOT_FOUND: 0,
    }


def add_batch_counts(counts: dict, batch_counts: dict) -> None:
    for status, amount in batch_counts.items():
        counts[status] += amount


def reindex_all_services(limit: Optional[int] = None) -> dict:
    services = scan_all_services()
    if limit is not None:
        services = islice(services, limit)
    counts = build_empty_counts()
    for service_batch in chunk_iterable(services, SERVICE_EMBED_BATCH_SIZE):
        add_batch_counts(counts, embed_service_batch(service_batch))
    if counts[SERVICE_EMBED_STATUS_EMBEDDED] > 0:
        refresh_retrieval_index()
    return counts
