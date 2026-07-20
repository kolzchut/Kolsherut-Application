from app.vars import (
    CARD_NESTED_ITEM_HREF_FIELD,
    CARD_NESTED_ITEM_NAME_FIELD,
    CARD_NESTED_ITEM_SYNONYMS_FIELD,
    CARD_NESTED_ITEM_TITLE_FIELD,
)


def format_synonyms(synonyms: list) -> str:
    return ', '.join(str(synonym).strip() for synonym in synonyms if str(synonym).strip())


def format_named_item(item: dict) -> str:
    name = str(item.get(CARD_NESTED_ITEM_NAME_FIELD, '') or '').strip()
    synonyms_text = format_synonyms(item.get(CARD_NESTED_ITEM_SYNONYMS_FIELD) or [])
    if name and synonyms_text:
        return f'{name} ({synonyms_text})'
    return name


def format_url_item(item: dict) -> str:
    title = str(item.get(CARD_NESTED_ITEM_TITLE_FIELD, '') or '').strip()
    href = str(item.get(CARD_NESTED_ITEM_HREF_FIELD, '') or '').strip()
    return f'{title} {href}'.strip()
