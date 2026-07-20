from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RAG_EMBEDDINGS_INDEX_NAME


def refresh_rag_index() -> None:
    get_elasticsearch_client().indices.refresh(index=RAG_EMBEDDINGS_INDEX_NAME)
