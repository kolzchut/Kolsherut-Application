from pydantic import BaseModel

from app.schemas.service_hierarchy_schemas import Service


class RetrievedDocument(BaseModel):
    service_id: str
    text: str
    context_text: str = ''
    score: float
    # Raw per-retriever scores kept alongside the fused score so the score cut is
    # inspectable from the API. None means that retriever never surfaced the document;
    # semantic_score is the Elasticsearch cosine score, i.e. (1 + cosine) / 2.
    semantic_score: float | None = None
    lexical_score: float | None = None


class RetrieveRequest(BaseModel):
    query: str


class RetrieveResponse(BaseModel):
    documents: list[RetrievedDocument]
    services: list[Service] = []
    log_id: str
    log_index: str
