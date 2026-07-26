import requests

from evaluation import vars
from evaluation.scraper.normalize_service_name import normalize_and_dedupe

SERVICES_FIELD = 'services'
SERVICE_NAME_FIELD = 'service_name'


def fetch_retrieval_ranked_names(query: str) -> list[str]:
    """POST the free-text query to retrieval, return its ranked service names.

    Reads `services` rather than `documents`: it is the same name-collapsed, rank-ordered
    shape the FE renders, which is what the scraped ground truth is made of.
    """
    url = f'{vars.RETRIEVAL_BASE_URL}{vars.RETRIEVE_ENDPOINT_PATH}'
    response = requests.post(url, json={'query': query}, timeout=vars.REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    services = response.json().get(SERVICES_FIELD, [])
    raw_names = [service.get(SERVICE_NAME_FIELD) or '' for service in services]
    return list(normalize_and_dedupe(raw_names))
