from app.schemas.reindex_schemas import ReindexProgressEvent
from app.services.service_indexing.reindex_counts import total_processed
from app.strings import (
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)


def build_reindex_event(event_type: str, counts: dict) -> ReindexProgressEvent:
    return ReindexProgressEvent(
        event=event_type,
        total=total_processed(counts),
        embedded=counts[SERVICE_EMBED_STATUS_EMBEDDED],
        skipped_no_text=counts[SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT],
        not_found=counts[SERVICE_EMBED_STATUS_NOT_FOUND],
    )
