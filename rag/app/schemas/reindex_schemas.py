from typing import Optional

from pydantic import BaseModel


class ReindexRequest(BaseModel):
    limit: Optional[int] = None


class ReindexResponse(BaseModel):
    total: int
    embedded: int
    skipped_no_text: int
    not_found: int
