from itertools import islice
from typing import Iterator, Optional

from app.services.elasticsearch.fetch_embedded_service_ids import fetch_embedded_service_ids
from app.services.elasticsearch.scan_all_services import scan_all_services
from app.vars import SERVICE_ID_FIELD_NAME


def skip_already_embedded(services: Iterator[dict], embedded_ids: set) -> Iterator[dict]:
    return (service for service in services if service[SERVICE_ID_FIELD_NAME] not in embedded_ids)


def select_services_to_index(limit: Optional[int] = None, resume: bool = False) -> Iterator[dict]:
    services = scan_all_services()
    if resume:
        services = skip_already_embedded(services, fetch_embedded_service_ids())
    if limit is not None:
        services = islice(services, limit)
    return services
