from app.strings import (
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)


def build_empty_counts() -> dict:
    return {
        SERVICE_EMBED_STATUS_EMBEDDED: 0,
        SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT: 0,
        SERVICE_EMBED_STATUS_NOT_FOUND: 0,
    }


def add_batch_counts(counts: dict, batch_counts: dict) -> dict:
    return {status: counts[status] + batch_counts.get(status, 0) for status in counts}


def total_processed(counts: dict) -> int:
    return sum(counts.values())
