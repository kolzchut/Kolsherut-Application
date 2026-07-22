from app.services.service_text_rendering.dedupe_preserving_order import dedupe_preserving_order
from app.vars import (
    SERVICE_DESCRIPTION_FIELD,
    SERVICE_DETAILS_FIELD,
    SERVICE_EMAIL_FIELD,
    SERVICE_NAME_FIELD,
    SERVICE_ORGANIZATION_KIND_FIELD,
    SERVICE_ORGANIZATION_NAMES_FIELD,
    SERVICE_PAYMENT_DETAILS_FIELD,
    SERVICE_PAYMENT_REQUIRED_FIELD,
    SERVICE_PHONE_NUMBERS_FIELD,
    SERVICE_SITUATION_HEBREW_FIELDS,
)


def collect_hebrew_situations(service: dict) -> list:
    situation_names = []
    for situation_field in SERVICE_SITUATION_HEBREW_FIELDS:
        situation_names.extend(service.get(situation_field) or [])
    return dedupe_preserving_order(situation_names)


def build_service_values(service: dict) -> dict:
    return {
        'name': service.get(SERVICE_NAME_FIELD),
        'description': service.get(SERVICE_DESCRIPTION_FIELD),
        'details': service.get(SERVICE_DETAILS_FIELD),
        'situations_hebrew': collect_hebrew_situations(service),
        'organization_names': dedupe_preserving_order(service.get(SERVICE_ORGANIZATION_NAMES_FIELD) or []),
        'organization_kind': dedupe_preserving_order(service.get(SERVICE_ORGANIZATION_KIND_FIELD) or []),
        'phone_numbers': service.get(SERVICE_PHONE_NUMBERS_FIELD),
        'email_address': service.get(SERVICE_EMAIL_FIELD),
        'payment_required': service.get(SERVICE_PAYMENT_REQUIRED_FIELD),
        'payment_details': service.get(SERVICE_PAYMENT_DETAILS_FIELD),
    }
