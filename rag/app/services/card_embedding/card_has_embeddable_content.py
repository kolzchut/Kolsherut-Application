from app.services.embedding_document.format_field_value import format_field_value
from app.strings import CARD_FIELD_MACROS


def card_has_embeddable_content(card: dict) -> bool:
    return any(format_field_value(card.get(field_name)) for field_name in CARD_FIELD_MACROS)
