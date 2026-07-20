from typing import Literal, Optional

from pydantic import BaseModel


class AskRatingRequest(BaseModel):
    log_id: str
    log_index: str
    rating: Literal[1, -1]
    description: Optional[str] = None


class AskRatingResponse(BaseModel):
    status: str
