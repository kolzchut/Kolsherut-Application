from app.services.service_text_rendering.build_service_values import build_service_values
from app.services.service_text_rendering.render_service_text import render_service_text
from app.strings import (
    SERVICE_DISPLAY_TEXT_TEMPLATE,
    SERVICE_EMBEDDING_TEXT_TEMPLATE,
    SERVICE_FIELD_MACROS,
)


def build_service_texts(service: dict) -> tuple[str, str]:
    service_values = build_service_values(service)
    embedded_text = render_service_text(service_values, SERVICE_EMBEDDING_TEXT_TEMPLATE, SERVICE_FIELD_MACROS)
    context_text = render_service_text(service_values, SERVICE_DISPLAY_TEXT_TEMPLATE, SERVICE_FIELD_MACROS)
    return embedded_text, context_text
