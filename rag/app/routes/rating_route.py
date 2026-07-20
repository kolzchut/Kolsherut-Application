from fastapi import APIRouter

from app.schemas.rating_schemas import AskRatingRequest, AskRatingResponse
from app.services.logging.update_ask_log_rating import update_ask_log_rating
from app.strings import RATING_STATUS_OK
from app.vars import RATING_ROUTE_PATH

rating_router = APIRouter()


@rating_router.post(RATING_ROUTE_PATH, response_model=AskRatingResponse)
def rate_ask_answer(rating_request: AskRatingRequest) -> AskRatingResponse:
    update_ask_log_rating(
        rating_request.log_index,
        rating_request.log_id,
        rating_request.rating,
        rating_request.description,
    )
    return AskRatingResponse(status=RATING_STATUS_OK)
