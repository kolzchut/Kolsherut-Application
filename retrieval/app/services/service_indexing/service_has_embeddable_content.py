from app.services.service_text_rendering.format_field_value import format_field_value
from app.vars import SERVICE_DESCRIPTION_FIELD, SERVICE_NAME_FIELD


def service_has_embeddable_content(service: dict) -> bool:
    name_text = format_field_value(service.get(SERVICE_NAME_FIELD))
    description_text = format_field_value(service.get(SERVICE_DESCRIPTION_FIELD))
    return bool(name_text or description_text)
