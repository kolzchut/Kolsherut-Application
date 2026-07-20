from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routes.ask_route import ask_router
from app.routes.health_route import health_router
from app.routes.mock_fe_route import mock_fe_router
from app.routes.rating_route import rating_router
from app.routes.reindex_cards_route import reindex_cards_router
from app.routes.retrieval_route import retrieval_router
from app.routes.update_card_route import update_card_router
from app.services.elasticsearch.async_elasticsearch_client import get_async_elasticsearch_client
from app.services.logging.get_terminal_logger import get_terminal_logger
from app.services.startup.warm_models import warm_models
from app.strings import APP_TITLE, ERROR_INTERNAL_SERVER, SERVICE_STARTUP_MESSAGE
from app.vars import SERVER_HOST, SERVER_PORT


@asynccontextmanager
async def load_models_on_startup(app: FastAPI):
    warm_models()
    get_terminal_logger().info(SERVICE_STARTUP_MESSAGE)
    yield
    await get_async_elasticsearch_client().close()


app = FastAPI(title=APP_TITLE, lifespan=load_models_on_startup)
app.include_router(mock_fe_router)
app.include_router(health_router)
app.include_router(update_card_router)
app.include_router(reindex_cards_router)
app.include_router(retrieval_router)
app.include_router(ask_router)
app.include_router(rating_router)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
    get_terminal_logger().error(ERROR_INTERNAL_SERVER.format(error=error))
    return JSONResponse(status_code=500, content={'detail': ERROR_INTERNAL_SERVER.format(error=error)})


if __name__ == '__main__':
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
