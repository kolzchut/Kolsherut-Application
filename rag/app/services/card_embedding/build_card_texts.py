from app.services.embedding_document.render_card_text import render_card_text
from app.strings import (
    CARD_CONTEXT_TEXT_TEMPLATE,
    CARD_EMBEDDING_TEXT_TEMPLATE,
    CARD_FIELD_MACROS,
)


def build_card_texts(card: dict) -> tuple[str, str]:
    embedded_text = render_card_text(card, CARD_EMBEDDING_TEXT_TEMPLATE, CARD_FIELD_MACROS)
    context_text = render_card_text(card, CARD_CONTEXT_TEXT_TEMPLATE, CARD_FIELD_MACROS)
    return embedded_text, context_text
