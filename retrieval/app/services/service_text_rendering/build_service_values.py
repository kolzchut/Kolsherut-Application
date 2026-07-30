from app.services.service_text_rendering.collect_union_of_list_fields import collect_union_of_list_fields
from app.services.service_text_rendering.strip_html_markup import strip_html_markup
from app.vars import (
    SERVICE_DESCRIPTION_FIELD,
    SERVICE_DETAILS_FIELD,
    SERVICE_EMAIL_FIELD,
    SERVICE_NAME_FIELD,
    SERVICE_ORGANIZATION_KIND_FIELDS,
    SERVICE_ORGANIZATION_NAME_FIELDS,
    SERVICE_PAYMENT_DETAILS_FIELD,
    SERVICE_PAYMENT_REQUIRED_FIELD,
    SERVICE_PHONE_NUMBERS_FIELD,
    SERVICE_RESPONSE_HEBREW_FIELDS,
    SERVICE_SITUATION_HEBREW_FIELDS,
)


def build_service_values(service: dict) -> dict:
    return {
        'name': service.get(SERVICE_NAME_FIELD),
        'description': service.get(SERVICE_DESCRIPTION_FIELD),
        'details': strip_html_markup(service.get(SERVICE_DETAILS_FIELD)),
        'situations_hebrew': collect_union_of_list_fields(service, SERVICE_SITUATION_HEBREW_FIELDS),
        'responses_hebrew': collect_union_of_list_fields(service, SERVICE_RESPONSE_HEBREW_FIELDS),
        'organization_names': collect_union_of_list_fields(service, SERVICE_ORGANIZATION_NAME_FIELDS),
        'organization_kind': collect_union_of_list_fields(service, SERVICE_ORGANIZATION_KIND_FIELDS),
        'phone_numbers': service.get(SERVICE_PHONE_NUMBERS_FIELD),
        'email_address': service.get(SERVICE_EMAIL_FIELD),
        'payment_required': service.get(SERVICE_PAYMENT_REQUIRED_FIELD),
        'payment_details': service.get(SERVICE_PAYMENT_DETAILS_FIELD),
    }
