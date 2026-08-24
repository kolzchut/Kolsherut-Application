from evaluation import vars
from evaluation.schemas import ServiceDetails


def serialize_service_details(service_details: ServiceDetails | None) -> dict:
    """Flatten one service's content into its five JSON keys.

    None in serializes as five JSON nulls, exactly as serialize_service_scores does for an
    unscored service, and it means the same kind of thing: no record of this service was ever
    obtained. That is deliberately NOT the same as a service whose record says it has no
    description or no tags - that one serializes as an empty string and empty lists. Collapsing
    the two would turn "we never found it" into "we found it and it has nothing".
    """
    if service_details is None:
        return {detail_key: None for detail_key in vars.SERVICE_DETAIL_KEYS}
    return {
        vars.SERVICE_DETAIL_DESCRIPTION_KEY: service_details.service_description,
        vars.SERVICE_DETAIL_RESPONSE_IDS_KEY: list(service_details.response_ids),
        vars.SERVICE_DETAIL_RESPONSE_NAMES_KEY: list(service_details.response_names),
        vars.SERVICE_DETAIL_SITUATION_IDS_KEY: list(service_details.situation_ids),
        vars.SERVICE_DETAIL_SITUATION_NAMES_KEY: list(service_details.situation_names),
    }


def deserialize_service_details(payload: dict) -> ServiceDetails:
    """Rebuild one ServiceDetails from the keys serialize_service_details wrote.

    Lives next to its inverse so the two cannot drift apart, and reads the same key constants,
    so adding a detail is one edit in vars.py and one in each function here.
    """
    return ServiceDetails(
        service_description=payload.get(vars.SERVICE_DETAIL_DESCRIPTION_KEY) or '',
        response_ids=tuple(payload.get(vars.SERVICE_DETAIL_RESPONSE_IDS_KEY) or ()),
        response_names=tuple(payload.get(vars.SERVICE_DETAIL_RESPONSE_NAMES_KEY) or ()),
        situation_ids=tuple(payload.get(vars.SERVICE_DETAIL_SITUATION_IDS_KEY) or ()),
        situation_names=tuple(payload.get(vars.SERVICE_DETAIL_SITUATION_NAMES_KEY) or ()),
    )


def serialize_service_detail_map(service_detail_map: dict[str, ServiceDetails]) -> dict:
    """Serialize a whole per-query detail map, keeping its normalized service names as keys."""
    return {
        service_name: serialize_service_details(details)
        for service_name, details in service_detail_map.items()
    }
