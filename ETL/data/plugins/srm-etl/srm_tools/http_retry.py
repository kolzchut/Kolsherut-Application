"""Retry wrapper for outbound HTTP calls to third-party data sources.

Retrying is this module's single responsibility, which is why the try/except
lives here and nowhere in the call chain above it. Transient failures - a
dropped connection, a read timeout, a 5xx from the upstream - are retried with
exponential backoff. A 4xx is a real answer from a healthy server, so it is
returned unretried for the caller to handle.
"""
import time

import requests

from srm_tools.logger import logger

DEFAULT_MAX_ATTEMPTS = 4
DEFAULT_BACKOFF_SECONDS = 2
RETRYABLE_STATUS_FLOOR = 500


def is_retryable_response(response):
    return response.status_code >= RETRYABLE_STATUS_FLOOR


def backoff_delay_seconds(attempt_number, backoff_seconds):
    return backoff_seconds * (2 ** (attempt_number - 1))


def log_retry(description, attempt_number, max_attempts, reason):
    logger.info(
        'Retrying %s (attempt %d/%d) after %s',
        description, attempt_number, max_attempts, reason,
    )


def request_with_retry(perform_request, description,
                       max_attempts=DEFAULT_MAX_ATTEMPTS,
                       backoff_seconds=DEFAULT_BACKOFF_SECONDS):
    """Call perform_request(), retrying transient failures. Returns its response.

    The final attempt is never swallowed: a connection error propagates and a
    5xx response is returned as-is so the caller's raise_for_status() reports it.
    """
    for attempt_number in range(1, max_attempts + 1):
        is_last_attempt = attempt_number == max_attempts
        try:
            response = perform_request()
        except requests.RequestException as error:
            if is_last_attempt:
                raise
            log_retry(description, attempt_number, max_attempts, error)
        else:
            if is_last_attempt or not is_retryable_response(response):
                return response
            log_retry(description, attempt_number, max_attempts, f'HTTP {response.status_code}')
        time.sleep(backoff_delay_seconds(attempt_number, backoff_seconds))
