from time import perf_counter
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks

from app.schemas.retrieve_schemas import RetrieveRequest, RetrieveResponse, RetrievedDocument
from app.services.logging.build_retrieve_log_event import build_retrieve_log_event
from app.services.logging.build_weekly_logs_index_name import build_weekly_logs_index_name
from app.services.logging.log_retrieve_to_elasticsearch import log_retrieve_to_elasticsearch
from app.services.logging.log_retrieve_to_terminal import log_retrieve_to_terminal
from app.services.retrieval.retrieve_documents_with_trace import retrieve_documents_with_trace
from app.services.service_hierarchy.assemble_services_from_documents import (
    assemble_services_from_documents,
)
from app.vars import RETRIEVE_ROUTE_PATH

retrieve_router = APIRouter()


@retrieve_router.post(RETRIEVE_ROUTE_PATH, response_model=RetrieveResponse)
async def retrieve_services(
    retrieve_request: RetrieveRequest, background_tasks: BackgroundTasks
) -> RetrieveResponse:
    log_id = uuid4().hex
    log_index = build_weekly_logs_index_name()
    started_at = perf_counter()
    retrieved_documents, retrieval_steps = await retrieve_documents_with_trace(retrieve_request.query)
    services = await assemble_services_from_documents(retrieved_documents)
    event = build_retrieve_log_event(
        log_id,
        retrieve_request.query,
        retrieved_documents,
        (perf_counter() - started_at) * 1000,
        retrieval_steps,
    )
    log_retrieve_to_terminal(event)
    background_tasks.add_task(log_retrieve_to_elasticsearch, log_index, event)
    return RetrieveResponse(
        documents=[RetrievedDocument(**document) for document in retrieved_documents],
        services=services,
        log_id=log_id,
        log_index=log_index,
    )
