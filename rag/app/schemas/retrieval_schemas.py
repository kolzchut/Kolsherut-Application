from pydantic import BaseModel

from app.vars import RETRIEVAL_TOP_K


class RetrievalRequest(BaseModel):
    query: str
    top_k: int = RETRIEVAL_TOP_K


class RetrievedDocument(BaseModel):
    card_id: str
    text: str
    context_text: str = ''
    score: float


class RetrievalResponse(BaseModel):
    documents: list[RetrievedDocument]
