from pydantic import BaseModel

from app.schemas.service_hierarchy_schemas import Service


class RetrievedDocument(BaseModel):
    service_id: str
    text: str
    context_text: str = ''
    score: float


class RetrieveRequest(BaseModel):
    query: str


class RetrieveResponse(BaseModel):
    documents: list[RetrievedDocument]
    services: list[Service] = []
    log_id: str
    log_index: str
