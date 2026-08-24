from fastapi import APIRouter, HTTPException

from app.schemas.update_service_schemas import UpdateServiceRequest, UpdateServiceResponse
from app.services.service_indexing.embed_service import embed_service
from app.strings import (
    ERROR_SERVICE_HAS_NO_EMBEDDABLE_TEXT,
    ERROR_SERVICE_NOT_FOUND,
    SERVICE_EMBED_STATUS_EMBEDDED,
    SERVICE_EMBED_STATUS_NOT_FOUND,
    SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT,
)
from app.vars import UPDATE_SERVICE_ROUTE_PATH

update_service_router = APIRouter()


@update_service_router.post(UPDATE_SERVICE_ROUTE_PATH, response_model=UpdateServiceResponse)
def update_service_embedding(update_service_request: UpdateServiceRequest) -> UpdateServiceResponse:
    service_id = update_service_request.service_id
    result = embed_service(service_id)
    if result.status == SERVICE_EMBED_STATUS_NOT_FOUND:
        raise HTTPException(status_code=404, detail=ERROR_SERVICE_NOT_FOUND.format(service_id=service_id))
    if result.status == SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT:
        raise HTTPException(status_code=422, detail=ERROR_SERVICE_HAS_NO_EMBEDDABLE_TEXT.format(service_id=service_id))
    return UpdateServiceResponse(
        service_id=service_id,
        status=SERVICE_EMBED_STATUS_EMBEDDED,
        embedded_text=result.embedded_text,
        context_text=result.context_text,
    )
