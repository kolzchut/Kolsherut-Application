from typing import NamedTuple, Optional

from app.services.elasticsearch.ensure_retrieval_index_exists import ensure_retrieval_index_exists
from app.services.elasticsearch.fetch_service_by_id import fetch_service_by_id
from app.services.elasticsearch.store_service_embedding import store_service_embedding
from app.services.service_indexing.build_service_texts import build_service_texts
from app.services.service_indexing.service_has_embeddable_content import service_has_embeddable_content
from app.services.text_embedding.embedding_model import embed_passage_text
from app.strings import (
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)


class ServiceEmbedResult(NamedTuple):
    status: str
    embedded_text: str
    context_text: str


def embed_service(service_id: str, service: Optional[dict] = None, refresh='wait_for') -> ServiceEmbedResult:
    service_source = service if service is not None else fetch_service_by_id(service_id)
    if service_source is None:
        return ServiceEmbedResult(SERVICE_EMBED_STATUS_NOT_FOUND, '', '')
    if not service_has_embeddable_content(service_source):
        return ServiceEmbedResult(SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT, '', '')
    embedded_text, context_text = build_service_texts(service_source)
    embedding = embed_passage_text(embedded_text)
    ensure_retrieval_index_exists(len(embedding))
    store_service_embedding(service_id, embedded_text, context_text, embedding, refresh=refresh)
    return ServiceEmbedResult(SERVICE_EMBED_STATUS_EMBEDDED, embedded_text, context_text)
