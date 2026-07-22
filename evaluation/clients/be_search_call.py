import requests

from evaluation import vars
from evaluation.strings import ERROR_BE_UNSUCCESSFUL_RESPONSE

BE_SUCCESS_FIELD = 'success'
BE_MESSAGE_FIELD = 'message'
BE_DATA_FIELD = 'data'


def build_be_search_body(response_id: str, situation_id: str, is_fast: bool) -> dict:
    return {
        'searchQuery': vars.BE_EMPTY_SEARCH_QUERY,
        'isFast': is_fast,
        'responseId': response_id,
        'situationId': situation_id,
        'by': vars.BE_EMPTY_BY,
        'serviceName': vars.BE_EMPTY_SERVICE_NAME,
    }


def call_be_search(response_id: str, situation_id: str, is_fast: bool) -> list[dict]:
    """One POST /search filtered by taxonomy slug. Fast mode 404s on empty -> treat as no results."""
    url = f'{vars.BE_BASE_URL}{vars.BE_SEARCH_ENDPOINT_PATH}'
    body = build_be_search_body(response_id, situation_id, is_fast)
    response = requests.post(url, json=body, timeout=vars.REQUEST_TIMEOUT_SECONDS)
    if response.status_code == 404:
        return []
    response.raise_for_status()
    payload = response.json()
    if payload.get(BE_SUCCESS_FIELD) is False:
        raise RuntimeError(ERROR_BE_UNSUCCESSFUL_RESPONSE.format(
            response_id=response_id, situation_id=situation_id, message=payload.get(BE_MESSAGE_FIELD)))
    return payload.get(BE_DATA_FIELD, [])
