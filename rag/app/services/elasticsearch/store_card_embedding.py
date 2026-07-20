from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import RAG_EMBEDDINGS_INDEX_NAME


def store_card_embedding(
    card_id: str,
    embedded_text: str,
    context_text: str,
    embedding: list[float],
    refresh='wait_for',
) -> None:
    get_elasticsearch_client().index(
        index=RAG_EMBEDDINGS_INDEX_NAME,
        id=card_id,
        document={
            'card_id': card_id,
            'embedded_text': embedded_text,
            'context_text': context_text,
            'embedding': embedding,
        },
        refresh=refresh,
    )
