from fastapi import APIRouter, HTTPException

from app.schemas.update_card_schemas import UpdateCardRequest, UpdateCardResponse
from app.services.card_embedding.embed_card import embed_card
from app.strings import (
    CARD_EMBED_STATUS_EMBEDDED,
    CARD_EMBED_STATUS_NOT_FOUND,
    CARD_EMBED_STATUS_SKIPPED_NO_TEXT,
    ERROR_CARD_HAS_NO_EMBEDDABLE_TEXT,
    ERROR_CARD_NOT_FOUND,
)
from app.vars import UPDATE_CARD_ROUTE_PATH

update_card_router = APIRouter()


@update_card_router.post(UPDATE_CARD_ROUTE_PATH, response_model=UpdateCardResponse)
def update_card_embedding(update_card_request: UpdateCardRequest) -> UpdateCardResponse:
    card_id = update_card_request.card_id
    result = embed_card(card_id)
    if result.status == CARD_EMBED_STATUS_NOT_FOUND:
        raise HTTPException(status_code=404, detail=ERROR_CARD_NOT_FOUND.format(card_id=card_id))
    if result.status == CARD_EMBED_STATUS_SKIPPED_NO_TEXT:
        raise HTTPException(status_code=422, detail=ERROR_CARD_HAS_NO_EMBEDDABLE_TEXT.format(card_id=card_id))
    return UpdateCardResponse(
        card_id=card_id,
        status=CARD_EMBED_STATUS_EMBEDDED,
        embedded_text=result.embedded_text,
        context_text=result.context_text,
    )
