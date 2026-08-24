from typing import Iterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.reindex_schemas import ReindexRequest
from app.services.service_indexing.reindex_all_services import reindex_all_services
from app.services.streaming.format_sse_event import format_sse_event
from app.strings import SSE_MEDIA_TYPE
from app.vars import REINDEX_SERVICES_ROUTE_PATH

reindex_services_router = APIRouter()


def stream_reindex_events(reindex_request: ReindexRequest) -> Iterator[str]:
    for event in reindex_all_services(reindex_request.limit, reindex_request.resume):
        yield format_sse_event(event)


@reindex_services_router.post(REINDEX_SERVICES_ROUTE_PATH)
def reindex_all_services_route(reindex_request: ReindexRequest = ReindexRequest()) -> StreamingResponse:
    return StreamingResponse(stream_reindex_events(reindex_request), media_type=SSE_MEDIA_TYPE)
