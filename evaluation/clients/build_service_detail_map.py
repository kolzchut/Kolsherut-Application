from evaluation import vars
from evaluation.schemas import ServiceDetails
from evaluation.scraper.normalize_service_name import normalize_service_name


def read_tag_field(service_entry: dict, tags_field: str, tag_field: str) -> tuple[str, ...]:
    """One column of one tag set - every response id, or every situation name, and so on.

    Blank values are dropped rather than kept as empty strings: a tag object missing its name is
    one fewer name, not a nameless tag. The two columns of a set are therefore free to differ in
    length, which is the honest shape - they are not positionally paired anywhere downstream.
    """
    tags = service_entry.get(tags_field) or []
    return tuple(tag[tag_field] for tag in tags if tag.get(tag_field))


def build_service_details(service_entry: dict) -> ServiceDetails:
    """Read the description and the two tag sets off one `services[]` entry.

    Works unchanged on a retrieval response and on a BE search response: both render the same
    srm__cards fields through the same service mapper, so the shape is identical. Nothing is
    defaulted to a placeholder - an absent description stays empty and is written blank.
    """
    return ServiceDetails(
        service_description=service_entry.get(vars.SERVICE_DETAIL_DESCRIPTION_KEY) or '',
        response_ids=read_tag_field(
            service_entry, vars.SERVICE_RESPONSES_FIELD, vars.SERVICE_TAG_ID_FIELD),
        response_names=read_tag_field(
            service_entry, vars.SERVICE_RESPONSES_FIELD, vars.SERVICE_TAG_NAME_FIELD),
        situation_ids=read_tag_field(
            service_entry, vars.SERVICE_SITUATIONS_FIELD, vars.SERVICE_TAG_ID_FIELD),
        situation_names=read_tag_field(
            service_entry, vars.SERVICE_SITUATIONS_FIELD, vars.SERVICE_TAG_NAME_FIELD),
    )


def build_service_detail_map(service_entries: list[dict]) -> dict[str, ServiceDetails]:
    """Map normalized service name to its content, so it joins to the ranked-name list.

    Keyed and first-wins exactly as build_service_score_map is, and for the same reasons: the
    ranked names are normalized, and the entry that won a name in the rank collapse is the one
    whose content belongs to it.
    """
    detail_map: dict[str, ServiceDetails] = {}
    for service_entry in service_entries:
        service_name = normalize_service_name(
            service_entry.get(vars.SERVICE_NAME_FIELD) or '')
        if service_name and service_name not in detail_map:
            detail_map[service_name] = build_service_details(service_entry)
    return detail_map
