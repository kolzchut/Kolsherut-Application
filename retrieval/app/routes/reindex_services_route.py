from fastapi import APIRouter

from app.schemas.reindex_schemas import ReindexRequest, ReindexResponse
from app.services.service_indexing.reindex_all_services import reindex_all_services
from app.strings import (
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)
from app.vars import REINDEX_SERVICES_ROUTE_PATH

reindex_services_router = APIRouter()


@reindex_services_router.post(REINDEX_SERVICES_ROUTE_PATH, response_model=ReindexResponse)
def reindex_all_services_route(reindex_request: ReindexRequest = ReindexRequest()) -> ReindexResponse:
    counts = reindex_all_services(reindex_request.limit)
    embedded = counts[SERVICE_EMBED_STATUS_EMBEDDED]
    skipped_no_text = counts[SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT]
    not_found = counts[SERVICE_EMBED_STATUS_NOT_FOUND]
    return ReindexResponse(
        total=embedded + skipped_no_text + not_found,
        embedded=embedded,
        skipped_no_text=skipped_no_text,
        not_found=not_found,
    )
