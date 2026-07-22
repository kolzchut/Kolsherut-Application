def build_service_id_to_name(card_hits: list[dict]) -> dict:
    return {hit['_source'].get('service_id'): hit['_source'].get('service_name') for hit in card_hits}


def order_services_by_ranking(
    services_by_name: dict, card_hits: list[dict], ranked_service_ids: list[str]
) -> list[dict]:
    service_id_to_name = build_service_id_to_name(card_hits)
    ordered_services = []
    seen_names = set()
    for service_id in ranked_service_ids:
        service_name = service_id_to_name.get(service_id)
        if service_name is None or service_name in seen_names:
            continue
        seen_names.add(service_name)
        ordered_services.append(services_by_name[service_name])
    return ordered_services
