from dataclasses import replace
from logging import Logger

from evaluation import strings, vars
from evaluation.ground_truth.lookup_service_details import lookup_missing_service_details
from evaluation.ground_truth.service_details_cache import (
    read_service_details_cache, write_service_details_cache,
)
from evaluation.schemas import QueryEvaluation, ServiceDetails


def collect_missed_service_names(evaluations: list[QueryEvaluation]) -> list[str]:
    """Every missed name across the run, deduped and ordered, so one lookup serves every query
    that missed the same service - the golden set repeats services across queries heavily."""
    return sorted({service_name for evaluation in evaluations
                   for service_name in evaluation.missed_ground_truth_names})


def attach_details(evaluation: QueryEvaluation,
                   details_by_name: dict[str, ServiceDetails | None]) -> QueryEvaluation:
    """Merge the looked-up content into one query's detail map.

    Retrieval's own entries win: for a name it returned, its response is the content that came
    with the thing that was actually scored, and only the names it never returned are filled in
    from the backend. A name that resolved to None is left OUT of the map entirely, so it
    serializes as nulls rather than as a service with an empty description.
    """
    missed_details = {
        service_name: details_by_name[service_name]
        for service_name in evaluation.missed_ground_truth_names
        if details_by_name.get(service_name) is not None
    }
    return replace(evaluation, service_details={**missed_details, **evaluation.service_details})


def enrich_missed_service_details(evaluations: list[QueryEvaluation],
                                  logger: Logger) -> list[QueryEvaluation]:
    """Fill in the content of every golden-set service retrieval never returned.

    Runs once over the whole run rather than per query, and only for names the cache has never
    been asked about, so a repeat run makes no backend calls at all.
    """
    cached = read_service_details_cache()
    logger.info(strings.LOG_SERVICE_DETAILS_CACHE_HIT.format(
        path=vars.SERVICE_DETAILS_CACHE_PATH, count=len(cached)))
    missing = [name for name in collect_missed_service_names(evaluations) if name not in cached]
    details_by_name = {**cached, **lookup_missing_service_details(missing, logger)}
    write_service_details_cache(details_by_name)
    unresolved = sum(1 for details in details_by_name.values() if details is None)
    logger.info(strings.LOG_WROTE_SERVICE_DETAILS.format(
        path=vars.SERVICE_DETAILS_CACHE_PATH,
        found=len(details_by_name) - unresolved, unresolved=unresolved))
    return [attach_details(evaluation, details_by_name) for evaluation in evaluations]
