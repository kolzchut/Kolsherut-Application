from fastapi import APIRouter

from app.strings import HEALTH_STATUS_OK
from app.vars import HEALTH_ROUTE_PATH

health_router = APIRouter()


@health_router.get(HEALTH_ROUTE_PATH)
def get_health_status() -> dict:
    return {'status': HEALTH_STATUS_OK}
