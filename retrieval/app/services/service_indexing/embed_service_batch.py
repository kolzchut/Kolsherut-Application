from app.services.elasticsearch.bulk_store_service_embeddings import bulk_store_service_embeddings
from app.services.elasticsearch.ensure_retrieval_index_exists import ensure_retrieval_index_exists
from app.services.service_indexing.build_service_texts import build_service_texts
from app.services.service_indexing.service_has_embeddable_content import service_has_embeddable_content
from app.services.text_embedding.embedding_model import embed_passages_batch
from app.strings import SERVICE_EMBED_STATUS_EMBEDDED, SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT
from app.vars import SERVICE_ID_FIELD_NAME


def build_pending_document(service: dict) -> dict:
    embedded_text, context_text = build_service_texts(service)
    return {
        'service_id': service[SERVICE_ID_FIELD_NAME],
        'embedded_text': embedded_text,
        'context_text': context_text,
    }


def embed_service_batch(services: list[dict]) -> dict:
    documents = [build_pending_document(service) for service in services if service_has_embeddable_content(service)]
    skipped = len(services) - len(documents)
    if not documents:
        return {SERVICE_EMBED_STATUS_EMBEDDED: 0, SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT: skipped}
    embeddings = embed_passages_batch([document['embedded_text'] for document in documents])
    ensure_retrieval_index_exists(len(embeddings[0]))
    for document, embedding in zip(documents, embeddings):
        document['embedding'] = embedding
    bulk_store_service_embeddings(documents)
    return {SERVICE_EMBED_STATUS_EMBEDDED: len(documents), SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT: skipped}
