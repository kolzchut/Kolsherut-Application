from fastapi import APIRouter

from app.schemas.retrieval_schemas import RetrievalRequest, RetrievalResponse, RetrievedDocument
from app.services.retrieval.retrieve_documents import retrieve_documents
from app.vars import RETRIEVAL_ROUTE_PATH

retrieval_router = APIRouter()


@retrieval_router.post(RETRIEVAL_ROUTE_PATH, response_model=RetrievalResponse)
async def retrieve_matching_documents(retrieval_request: RetrievalRequest) -> RetrievalResponse:
    retrieved_documents = await retrieve_documents(retrieval_request.query, retrieval_request.top_k)
    return RetrievalResponse(
        documents=[RetrievedDocument(**retrieved_document) for retrieved_document in retrieved_documents]
    )
