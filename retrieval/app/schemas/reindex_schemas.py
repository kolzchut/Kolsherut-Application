from typing import Optional

from pydantic import BaseModel


class ReindexRequest(BaseModel):
    limit: Optional[int] = None
    resume: bool = False


class ReindexProgressEvent(BaseModel):
    event: str
    total: int
    embedded: int
    skipped_no_text: int
    not_found: int
