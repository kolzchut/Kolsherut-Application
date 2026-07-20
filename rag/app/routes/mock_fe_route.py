from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.vars import MOCK_FE_INDEX_PATH, MOCK_FE_ROUTE_PATH

mock_fe_router = APIRouter()


@mock_fe_router.get(MOCK_FE_ROUTE_PATH, include_in_schema=False)
def serve_mock_fe() -> FileResponse:
    return FileResponse(MOCK_FE_INDEX_PATH)
