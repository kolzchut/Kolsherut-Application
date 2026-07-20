from app.services.card_embedding.build_card_texts import build_card_texts
from app.services.card_embedding.card_has_embeddable_content import card_has_embeddable_content
from app.services.elasticsearch.bulk_store_card_embeddings import bulk_store_card_embeddings
from app.services.elasticsearch.ensure_rag_index_exists import ensure_rag_index_exists
from app.services.embedding.embedding_model import embed_passages_batch
from app.strings import CARD_EMBED_STATUS_EMBEDDED, CARD_EMBED_STATUS_SKIPPED_NO_TEXT
from app.vars import CARD_ID_FIELD_NAME


def build_pending_document(card: dict) -> dict:
    embedded_text, context_text = build_card_texts(card)
    return {
        'card_id': card[CARD_ID_FIELD_NAME],
        'embedded_text': embedded_text,
        'context_text': context_text,
    }


def embed_card_batch(cards: list[dict]) -> dict:
    documents = [build_pending_document(card) for card in cards if card_has_embeddable_content(card)]
    skipped = len(cards) - len(documents)
    if not documents:
        return {CARD_EMBED_STATUS_EMBEDDED: 0, CARD_EMBED_STATUS_SKIPPED_NO_TEXT: skipped}
    embeddings = embed_passages_batch([document['embedded_text'] for document in documents])
    ensure_rag_index_exists(len(embeddings[0]))
    for document, embedding in zip(documents, embeddings):
        document['embedding'] = embedding
    bulk_store_card_embeddings(documents)
    return {CARD_EMBED_STATUS_EMBEDDED: len(documents), CARD_EMBED_STATUS_SKIPPED_NO_TEXT: skipped}
