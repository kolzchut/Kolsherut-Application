from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RETRIEVAL_EMBEDDINGS_INDEX_NAME


def refresh_retrieval_index() -> None:
    get_elasticsearch_client().indices.refresh(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME)
