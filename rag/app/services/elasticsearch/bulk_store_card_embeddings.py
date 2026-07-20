from elasticsearch.helpers import bulk

from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RAG_EMBEDDINGS_INDEX_NAME


def build_bulk_action(document: dict) -> dict:
    return {'_index': RAG_EMBEDDINGS_INDEX_NAME, '_id': document['card_id'], '_source': document}


def bulk_store_card_embeddings(documents: list[dict]) -> None:
    actions = [build_bulk_action(document) for document in documents]
    bulk(get_elasticsearch_client(), actions, refresh=False)
