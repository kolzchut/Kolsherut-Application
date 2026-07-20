from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import CARD_ID_FIELD_NAME, CARDS_INDEX_NAME


def fetch_card_by_id(card_id: str) -> dict | None:
    search_response = get_elasticsearch_client().search(
        index=CARDS_INDEX_NAME,
        query={'term': {CARD_ID_FIELD_NAME: card_id}},
        size=1,
    )
    hits = search_response['hits']['hits']
    return hits[0]['_source'] if hits else None
