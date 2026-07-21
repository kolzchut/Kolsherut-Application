from pydantic import BaseModel


class RetrievedDocument(BaseModel):
    service_id: str
    text: str
    context_text: str = ''
    score: float


class RetrieveRequest(BaseModel):
    query: str


class RetrieveResponse(BaseModel):
    documents: list[RetrievedDocument]
    log_id: str
    log_index: str
