import logging

from evaluation.strings import EVAL_LOGGER_NAME, LOG_FORMAT


def build_logger() -> logging.Logger:
    logger = logging.getLogger(EVAL_LOGGER_NAME)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
