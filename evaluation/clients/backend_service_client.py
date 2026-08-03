import requests

from evaluation import vars


def build_service_name_search_payload(service_name: str) -> dict:
    """The /search body that narrows the route to one service by name.

    `searchQuery` is sent empty on purpose. The route calls `.replace` on it unconditionally, so
    it cannot be omitted, and an empty one keeps `freeSearch` false - which is what routes the
    request down the filtered branch instead of scoring the name as free text.
    """
    return {
        vars.BACKEND_SEARCH_QUERY_FIELD: '',
        vars.BACKEND_SEARCH_IS_FAST_FIELD: vars.BACKEND_SEARCH_IS_FAST,
        vars.BACKEND_SEARCH_SERVICE_NAME_FIELD: service_name,
    }


def fetch_services_by_name(service_name: str) -> list[dict]:
    """Every service the BE matches for this name, or an empty list when it matches none.

    404 is the route's answer for "no results on the fast branch", so it is read as an empty
    match rather than raised: a golden-set name the BE cannot find is an expected outcome that
    leaves the row's content cells blank, not a failure of the run. Every other status still
    raises, so a down or broken BE cannot masquerade as a dataset full of unknown services.
    """
    url = f'{vars.BACKEND_BASE_URL}{vars.BACKEND_SEARCH_ENDPOINT_PATH}'
    response = requests.post(url, json=build_service_name_search_payload(service_name),
                             timeout=vars.REQUEST_TIMEOUT_SECONDS)
    if response.status_code == vars.BACKEND_NOT_FOUND_STATUS_CODE:
        return []
    response.raise_for_status()
    return response.json().get(vars.BACKEND_SEARCH_RESULTS_FIELD) or []
