from evaluation.schemas import Example
from evaluation.clients.be_search_call import call_be_search


def pick_primary_slug(slugs: list[str]) -> str:
    """Each query maps to one response + one situation; take the first, ignore any extras."""
    return slugs[0] if slugs else ''


def union_services_by_id(service_lists: list[list[dict]]) -> list[dict]:
    services_by_id = {}
    for services in service_lists:
        for service in services:
            services_by_id.setdefault(service.get('id'), service)
    return list(services_by_id.values())


def fetch_ground_truth_services(response_id: str, situation_id: str, cache: dict) -> list[dict]:
    """Fast + rest BE calls unioned (covers the offset-50 pagination gap), memoized per slug pair."""
    cache_key = (response_id, situation_id)
    if cache_key not in cache:
        fast_services = call_be_search(response_id, situation_id, is_fast=True)
        rest_services = call_be_search(response_id, situation_id, is_fast=False)
        cache[cache_key] = union_services_by_id([fast_services, rest_services])
    return cache[cache_key]


def build_ground_truth(example: Example, cache: dict) -> tuple[set[str], bool]:
    """Ground-truth service_ids: services the BE returns for the query's response + situation slug."""
    response_id = pick_primary_slug(example.response_slugs)
    situation_id = pick_primary_slug(example.situation_slugs)
    services = fetch_ground_truth_services(response_id, situation_id, cache)
    ground_truth_ids = {service['id'] for service in services}
    return ground_truth_ids, len(services) == 0
