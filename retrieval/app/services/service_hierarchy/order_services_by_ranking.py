from app.services.service_hierarchy.attach_document_scores_to_service import (
    attach_document_scores_to_service,
)

# The service_id key every retrieved document carries, joining documents[] to the cards.
DOCUMENT_SERVICE_ID_KEY = 'service_id'


def build_service_id_to_name(card_hits: list[dict]) -> dict:
    return {hit['_source'].get('service_id'): hit['_source'].get('service_name') for hit in card_hits}


def order_services_by_ranking(
    services_by_name: dict, card_hits: list[dict], retrieved_documents: list[dict]
) -> list[dict]:
    """Collapse the fused document order into one service per service_name, best rank wins.

    The scores are attached here because this is the only place where the fused rank order
    and the name collapse are both in hand: the document being iterated when a name is first
    seen is the document that won that name. Joining services[i].id back to documents[]
    instead would attach an arbitrary card hit's scores whenever a name spans several
    service_ids, since build_service_hierarchy keys on name in card return order.
    """
    service_id_to_name = build_service_id_to_name(card_hits)
    ordered_services = []
    seen_names = set()
    for retrieved_document in retrieved_documents:
        service_name = service_id_to_name.get(retrieved_document.get(DOCUMENT_SERVICE_ID_KEY))
        if service_name is None or service_name in seen_names:
            continue
        seen_names.add(service_name)
        ordered_services.append(
            attach_document_scores_to_service(services_by_name[service_name], retrieved_document)
        )
    return ordered_services
