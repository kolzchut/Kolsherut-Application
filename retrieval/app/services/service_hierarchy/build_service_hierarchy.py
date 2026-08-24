from app.services.service_hierarchy.add_branch_to_service import add_branch_to_service
from app.services.service_hierarchy.create_service_from_card import create_service_from_card
from app.services.service_hierarchy.sort_organizations_by_branch_count import (
    sort_organizations_by_branch_count,
)
from app.vars import CARDS_INNER_HITS_NAME


def extract_branch_sources(hit: dict) -> list[dict]:
    inner_hits = hit['inner_hits'][CARDS_INNER_HITS_NAME]['hits']['hits']
    return [inner_hit['_source'] for inner_hit in inner_hits]


def build_service_hierarchy(card_hits: list[dict]) -> dict:
    services_by_name = {}
    for hit in card_hits:
        service_source = hit['_source']
        service_name = service_source.get('service_name')
        if service_name not in services_by_name:
            services_by_name[service_name] = create_service_from_card(service_source)
        service = services_by_name[service_name]
        for branch_source in extract_branch_sources(hit):
            add_branch_to_service(service, branch_source)
    return {name: sort_organizations_by_branch_count(service) for name, service in services_by_name.items()}
