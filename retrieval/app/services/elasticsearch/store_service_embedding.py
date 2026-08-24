from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RETRIEVAL_EMBEDDINGS_INDEX_NAME


def store_service_embedding(
    service_id: str,
    embedded_text: str,
    context_text: str,
    embedding: list[float],
    refresh='wait_for',
) -> None:
    get_elasticsearch_client().index(
        index=RETRIEVAL_EMBEDDINGS_INDEX_NAME,
        id=service_id,
        document={
            'service_id': service_id,
            'embedded_text': embedded_text,
            'context_text': context_text,
            'embedding': embedding,
        },
        refresh=refresh,
    )
