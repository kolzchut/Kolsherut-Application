import requests

from evaluation import vars


def dedupe_preserving_order(service_ids: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for service_id in service_ids:
        if service_id not in seen:
            seen.add(service_id)
            ordered.append(service_id)
    return ordered


def fetch_retrieval_ranked_ids(query: str) -> list[str]:
    """POST the free-text query to the retrieval service, return the fused ranked service_ids."""
    url = f'{vars.RETRIEVAL_BASE_URL}{vars.RETRIEVE_ENDPOINT_PATH}'
    response = requests.post(url, json={'query': query}, timeout=vars.REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    documents = response.json().get('documents', [])
    return dedupe_preserving_order([document['service_id'] for document in documents])
