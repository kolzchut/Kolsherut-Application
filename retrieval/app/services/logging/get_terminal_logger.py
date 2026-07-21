import logging
import sys
from functools import lru_cache

from app.strings import LOG_FORMAT, RETRIEVAL_LOGGER_NAME
from app.vars import LOG_LEVEL


@lru_cache(maxsize=1)
def get_terminal_logger() -> logging.Logger:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    logger = logging.getLogger(RETRIEVAL_LOGGER_NAME)
    logger.setLevel(LOG_LEVEL)
    logger.propagate = False
    terminal_handler = logging.StreamHandler(sys.stdout)
    terminal_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.handlers = [terminal_handler]
    return logger
