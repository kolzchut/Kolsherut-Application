from pydantic import BaseModel

from app.schemas.retrieval_schemas import RetrievedDocument


class ChatHistoryMessage(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    prompt: str
    history: list[ChatHistoryMessage] = []


class AskResponse(BaseModel):
    answer: str
    documents: list[RetrievedDocument]
    log_id: str
    log_index: str
