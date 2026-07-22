from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.services.logging.ensure_retrieve_logs_index_exists import ensure_retrieve_logs_index_exists
from app.services.logging.get_terminal_logger import get_terminal_logger
from app.strings import ERROR_RETRIEVE_LOG_FAILED


def log_retrieve_to_elasticsearch(log_index: str, event: dict) -> None:
    try:
        ensure_retrieve_logs_index_exists(log_index)
        get_elasticsearch_client().update(
            index=log_index,
            id=event['log_id'],
            doc=event,
            doc_as_upsert=True,
        )
    except Exception as error:
        get_terminal_logger().error(ERROR_RETRIEVE_LOG_FAILED.format(error=error))
