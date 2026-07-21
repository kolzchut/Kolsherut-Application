from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import SERVICE_ID_FIELD_NAME, SERVICES_INDEX_NAME


def fetch_service_by_id(service_id: str) -> dict | None:
    search_response = get_elasticsearch_client().search(
        index=SERVICES_INDEX_NAME,
        query={'term': {SERVICE_ID_FIELD_NAME: service_id}},
        size=1,
    )
    hits = search_response['hits']['hits']
    return hits[0]['_source'] if hits else None
