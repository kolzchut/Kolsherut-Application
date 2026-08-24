from pydantic import BaseModel

from app.strings import SSE_DATA_LINE_TEMPLATE


def format_sse_event(payload: BaseModel) -> str:
    return SSE_DATA_LINE_TEMPLATE.format(payload=payload.model_dump_json())
