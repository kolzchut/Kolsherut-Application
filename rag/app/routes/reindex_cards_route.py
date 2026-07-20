from fastapi import APIRouter

from app.schemas.reindex_schemas import ReindexRequest, ReindexResponse
from app.services.card_embedding.reindex_all_cards import reindex_all_cards
from app.strings import (
    CARD_EMBED_STATUS_EMBEDDED,
    CARD_EMBED_STATUS_NOT_FOUND,
    CARD_EMBED_STATUS_SKIPPED_NO_TEXT,
)
from app.vars import REINDEX_CARDS_ROUTE_PATH

reindex_cards_router = APIRouter()


@reindex_cards_router.post(REINDEX_CARDS_ROUTE_PATH, response_model=ReindexResponse)
def reindex_all_cards_route(reindex_request: ReindexRequest = ReindexRequest()) -> ReindexResponse:
    counts = reindex_all_cards(reindex_request.limit)
    embedded = counts[CARD_EMBED_STATUS_EMBEDDED]
    skipped_no_text = counts[CARD_EMBED_STATUS_SKIPPED_NO_TEXT]
    not_found = counts[CARD_EMBED_STATUS_NOT_FOUND]
    return ReindexResponse(
        total=embedded + skipped_no_text + not_found,
        embedded=embedded,
        skipped_no_text=skipped_no_text,
        not_found=not_found,
    )
