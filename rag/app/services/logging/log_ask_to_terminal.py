from app.services.logging.get_terminal_logger import get_terminal_logger
from app.strings import ASK_LOG_TERMINAL_MESSAGE


def format_timings(timings_ms: dict) -> str:
    return ' '.join(f'{step}={round(duration_ms, 1)}ms' for step, duration_ms in timings_ms.items())


def log_ask_to_terminal(event: dict) -> None:
    get_terminal_logger().info(
        ASK_LOG_TERMINAL_MESSAGE.format(
            log_id=event['log_id'],
            model=event['model'],
            latency_ms=event['latency_ms'],
            timings=format_timings(event['timings_ms']),
            prompt=event['prompt'],
            answer=event['answer'],
        )
    )
