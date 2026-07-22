from app.services.elasticsearch.fetch_cards_by_service_ids import fetch_cards_by_service_ids
from app.services.service_hierarchy.build_service_hierarchy import build_service_hierarchy
from app.services.service_hierarchy.order_services_by_ranking import order_services_by_ranking


async def assemble_services_from_documents(retrieved_documents: list[dict]) -> list[dict]:
    ranked_service_ids = [document['service_id'] for document in retrieved_documents]
    card_hits = await fetch_cards_by_service_ids(ranked_service_ids)
    services_by_name = build_service_hierarchy(card_hits)
    return order_services_by_ranking(services_by_name, card_hits, ranked_service_ids)
