import requests

from evaluation import vars
from evaluation.clients.parse_retrieval_response import parse_retrieval_response
from evaluation.retrieval_schemas import RetrievalResult

QUERY_REQUEST_FIELD = 'query'


def fetch_retrieval_result(query: str) -> RetrievalResult:
    """POST the free-text query to retrieval, return its ranked names, scores and content.

    Parsing lives in parse_retrieval_response so it stays pure; this function is only the call.
    """
    url = f'{vars.RETRIEVAL_BASE_URL}{vars.RETRIEVE_ENDPOINT_PATH}'
    response = requests.post(
        url, json={QUERY_REQUEST_FIELD: query}, timeout=vars.REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    return parse_retrieval_response(response.json())
