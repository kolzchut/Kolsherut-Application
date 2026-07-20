from itertools import islice
from typing import Optional

from app.services.card_embedding.chunk_iterable import chunk_iterable
from app.services.card_embedding.embed_card_batch import embed_card_batch
from app.services.elasticsearch.refresh_rag_index import refresh_rag_index
from app.services.elasticsearch.scan_all_cards import scan_all_cards
from app.strings import (
    CARD_EMBED_STATUS_EMBEDDED,
    CARD_EMBED_STATUS_NOT_FOUND,
    CARD_EMBED_STATUS_SKIPPED_NO_TEXT,
)
from app.vars import CARD_EMBED_BATCH_SIZE


def build_empty_counts() -> dict:
    return {
        CARD_EMBED_STATUS_EMBEDDED: 0,
        CARD_EMBED_STATUS_SKIPPED_NO_TEXT: 0,
        CARD_EMBED_STATUS_NOT_FOUND: 0,
    }


def add_batch_counts(counts: dict, batch_counts: dict) -> None:
    for status, amount in batch_counts.items():
        counts[status] += amount


def reindex_all_cards(limit: Optional[int] = None) -> dict:
    cards = scan_all_cards()
    if limit is not None:
        cards = islice(cards, limit)
    counts = build_empty_counts()
    for card_batch in chunk_iterable(cards, CARD_EMBED_BATCH_SIZE):
        add_batch_counts(counts, embed_card_batch(card_batch))
    if counts[CARD_EMBED_STATUS_EMBEDDED] > 0:
        refresh_rag_index()
    return counts
