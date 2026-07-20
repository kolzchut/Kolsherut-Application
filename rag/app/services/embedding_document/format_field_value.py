from app.services.embedding_document.format_nested_item import format_named_item, format_url_item
from app.vars import CARD_NESTED_ITEM_HREF_FIELD


def format_dict_value(value: dict) -> str:
    if CARD_NESTED_ITEM_HREF_FIELD in value:
        return format_url_item(value)
    return format_named_item(value)


def format_list_value(values: list) -> str:
    formatted_items = (format_field_value(item) for item in values)
    return ', '.join(formatted_item for formatted_item in formatted_items if formatted_item)


def format_field_value(value) -> str:
    if value is None:
        return ''
    if isinstance(value, dict):
        return format_dict_value(value)
    if isinstance(value, list):
        return format_list_value(value)
    return str(value).strip()
