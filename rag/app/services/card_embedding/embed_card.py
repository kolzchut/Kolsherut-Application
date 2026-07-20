from typing import NamedTuple, Optional

from app.services.card_embedding.build_card_texts import build_card_texts
from app.services.card_embedding.card_has_embeddable_content import card_has_embeddable_content
from app.services.elasticsearch.ensure_rag_index_exists import ensure_rag_index_exists
from app.services.elasticsearch.fetch_card_by_id import fetch_card_by_id
from app.services.elasticsearch.store_card_embedding import store_card_embedding
from app.services.embedding.embedding_model import embed_passage_text
from app.strings import (
    CARD_EMBED_STATUS_EMBEDDED,
    CARD_EMBED_STATUS_NOT_FOUND,
    CARD_EMBED_STATUS_SKIPPED_NO_TEXT,
)


class CardEmbedResult(NamedTuple):
    status: str
    embedded_text: str
    context_text: str


def embed_card(card_id: str, card: Optional[dict] = None, refresh='wait_for') -> CardEmbedResult:
    card_source = card if card is not None else fetch_card_by_id(card_id)
    if card_source is None:
        return CardEmbedResult(CARD_EMBED_STATUS_NOT_FOUND, '', '')
    if not card_has_embeddable_content(card_source):
        return CardEmbedResult(CARD_EMBED_STATUS_SKIPPED_NO_TEXT, '', '')
    embedded_text, context_text = build_card_texts(card_source)
    embedding = embed_passage_text(embedded_text)
    ensure_rag_index_exists(len(embedding))
    store_card_embedding(card_id, embedded_text, context_text, embedding, refresh=refresh)
    return CardEmbedResult(CARD_EMBED_STATUS_EMBEDDED, embedded_text, context_text)
