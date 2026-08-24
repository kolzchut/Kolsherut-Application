from typing import Iterator, Optional

from app.schemas.reindex_schemas import ReindexProgressEvent
from app.services.elasticsearch.refresh_retrieval_index import refresh_retrieval_index
from app.services.service_indexing.build_reindex_event import build_reindex_event
from app.services.service_indexing.chunk_iterable import chunk_iterable
from app.services.service_indexing.embed_service_batch import embed_service_batch
from app.services.service_indexing.reindex_counts import (
    add_batch_counts,
    build_empty_counts,
    total_processed,
)
from app.services.service_indexing.select_services_to_index import select_services_to_index
from app.strings import REINDEX_EVENT_DONE, REINDEX_EVENT_PROGRESS, SERVICE_EMBED_STATUS_EMBEDDED
from app.vars import REINDEX_PROGRESS_INTERVAL, SERVICE_EMBED_BATCH_SIZE


def reindex_all_services(
    limit: Optional[int] = None, resume: bool = False
) -> Iterator[ReindexProgressEvent]:
    services = select_services_to_index(limit, resume)
    counts = build_empty_counts()
    last_reported = 0
    for service_batch in chunk_iterable(services, SERVICE_EMBED_BATCH_SIZE):
        counts = add_batch_counts(counts, embed_service_batch(service_batch))
        if total_processed(counts) - last_reported >= REINDEX_PROGRESS_INTERVAL:
            last_reported = total_processed(counts)
            yield build_reindex_event(REINDEX_EVENT_PROGRESS, counts)
    if counts[SERVICE_EMBED_STATUS_EMBEDDED] > 0:
        refresh_retrieval_index()
    yield build_reindex_event(REINDEX_EVENT_DONE, counts)
