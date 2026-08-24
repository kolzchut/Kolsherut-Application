def format_list_value(values: list) -> str:
    formatted_items = (format_field_value(item) for item in values)
    return ', '.join(formatted_item for formatted_item in formatted_items if formatted_item)


def format_field_value(value) -> str:
    if value is None:
        return ''
    if isinstance(value, list):
        return format_list_value(value)
    return str(value).strip()
