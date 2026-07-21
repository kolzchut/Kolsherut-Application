from app.services.elasticsearch.async_elasticsearch_client import get_async_elasticsearch_client
from app.services.elasticsearch.build_cards_by_service_ids_query import build_cards_by_service_ids_query
from app.vars import CARDS_INDEX_NAME


async def fetch_cards_by_service_ids(service_ids: list[str]) -> list[dict]:
    if not service_ids:
        return []
    search_response = await get_async_elasticsearch_client().search(
        index=CARDS_INDEX_NAME,
        body=build_cards_by_service_ids_query(service_ids),
    )
    return search_response['hits']['hits']
