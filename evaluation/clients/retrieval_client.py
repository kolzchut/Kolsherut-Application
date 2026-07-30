import requests

from evaluation import vars
from evaluation.clients.parse_retrieval_response import parse_retrieval_response
from evaluation.schemas import ServiceScores

QUERY_REQUEST_FIELD = 'query'


def fetch_retrieval_ranked_names_and_scores(
    query: str,
) -> tuple[list[str], dict[str, ServiceScores]]:
    """POST the free-text query to retrieval, return its ranked service names and their scores.

    Parsing lives in parse_retrieval_response so it stays pure; this function is only the call.
    """
    url = f'{vars.RETRIEVAL_BASE_URL}{vars.RETRIEVE_ENDPOINT_PATH}'
    response = requests.post(
        url, json={QUERY_REQUEST_FIELD: query}, timeout=vars.REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    return parse_retrieval_response(response.json())
