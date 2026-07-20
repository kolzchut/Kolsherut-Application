from time import perf_counter
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks

from app.schemas.ask_schemas import AskRequest, AskResponse
from app.schemas.retrieval_schemas import RetrievedDocument
from app.services.generation.langchain_service import generate_answer
from app.services.logging.build_ask_log_event import build_ask_log_event
from app.services.logging.build_weekly_logs_index_name import build_weekly_logs_index_name
from app.services.logging.log_ask_to_elasticsearch import log_ask_to_elasticsearch
from app.services.logging.log_ask_to_terminal import log_ask_to_terminal
from app.services.retrieval.retrieve_documents_with_trace import retrieve_documents_with_trace
from app.services.tracing.build_llm_step import build_llm_step
from app.vars import ASK_ROUTE_PATH, RETRIEVAL_TOP_K

ask_router = APIRouter()


@ask_router.post(ASK_ROUTE_PATH, response_model=AskResponse)
async def ask_with_full_rag_pipeline(
    ask_request: AskRequest, background_tasks: BackgroundTasks
) -> AskResponse:
    log_id = uuid4().hex
    log_index = build_weekly_logs_index_name()
    started_at = perf_counter()
    retrieved_documents, retrieval_steps = await retrieve_documents_with_trace(
        ask_request.prompt, RETRIEVAL_TOP_K
    )
    llm_started_at = perf_counter()
    answer = await generate_answer(ask_request.prompt, ask_request.history, retrieved_documents)
    llm_step = build_llm_step(
        ask_request.prompt, retrieved_documents, answer, (perf_counter() - llm_started_at) * 1000
    )
    event = build_ask_log_event(
        log_id,
        ask_request.prompt,
        [message.model_dump() for message in ask_request.history],
        answer,
        retrieved_documents,
        (perf_counter() - started_at) * 1000,
        [*retrieval_steps, llm_step],
    )
    log_ask_to_terminal(event)
    background_tasks.add_task(log_ask_to_elasticsearch, log_index, event)
    return AskResponse(
        answer=answer,
        documents=[RetrievedDocument(**document) for document in retrieved_documents],
        log_id=log_id,
        log_index=log_index,
    )
