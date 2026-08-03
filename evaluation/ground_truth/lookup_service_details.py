from logging import Logger

from evaluation import strings, vars
from evaluation.clients.backend_service_client import fetch_services_by_name
from evaluation.clients.build_service_detail_map import build_service_details
from evaluation.clients.select_exact_service_match import select_exact_service_match
from evaluation.schemas import ServiceDetails

LOOKUP_PROGRESS_INTERVAL = 50


def lookup_service_details(service_name: str) -> ServiceDetails | None:
    """One name's content from the backend, or None when it has no exact match there.

    Reuses build_service_details rather than reading the fields again, because the BE returns
    the same service shape retrieval does - one reader for one shape, so the two sides of the
    table cannot end up carrying content assembled by two different rules.
    """
    service_entry = select_exact_service_match(fetch_services_by_name(service_name), service_name)
    return None if service_entry is None else build_service_details(service_entry)


def log_lookup_progress(index: int, total: int, logger: Logger) -> None:
    if index % LOOKUP_PROGRESS_INTERVAL == 0 or index == total:
        logger.info(strings.LOG_LOOKED_UP_SERVICE_DETAILS.format(index=index, total=total))


def lookup_missing_service_details(service_names: list[str],
                                   logger: Logger) -> dict[str, ServiceDetails | None]:
    """Look every given name up, one backend call each, keeping the None answers.

    The caller filters the cache before calling, so every name here is genuinely unknown. A None
    is stored like any other answer: it is the record that this name WAS asked about, which is
    what stops the next run asking again.
    """
    logger.info(strings.LOG_LOOKING_UP_SERVICE_DETAILS.format(
        count=len(service_names), base_url=vars.BACKEND_BASE_URL))
    resolved: dict[str, ServiceDetails | None] = {}
    for index, service_name in enumerate(service_names, start=1):
        resolved[service_name] = lookup_service_details(service_name)
        log_lookup_progress(index, len(service_names), logger)
    return resolved
