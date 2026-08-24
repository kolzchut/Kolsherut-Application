import time

from evaluation import scraper_vars


def build_search_response_recorder() -> tuple[list, callable]:
    """Records every POST to the BE's /search so we can tell the fast and rest calls apart."""
    recorded = []

    def record_response(response) -> None:
        is_search = response.request.method == scraper_vars.SEARCH_REQUEST_METHOD \
            and response.url.endswith(scraper_vars.SEARCH_REQUEST_PATH)
        if is_search:
            recorded.append(response.url)

    return recorded, record_response


def poll_until(page, predicate, timeout_ms: int) -> bool:
    """Pump the page's event loop until the predicate holds, or the timeout runs out."""
    deadline = time.monotonic() + timeout_ms / 1000
    while not predicate():
        if time.monotonic() >= deadline:
            return False
        page.wait_for_timeout(scraper_vars.POLL_INTERVAL_MS)
    return True


def has_element(page, selector: str) -> bool:
    return page.locator(selector).count() > 0


def is_results_ready(page) -> bool:
    """Loader gone and the list has settled into either results or the empty state."""
    if has_element(page, scraper_vars.LOADER_SELECTOR):
        return False
    return has_element(page, scraper_vars.SERVICE_NAME_SELECTOR) or has_element(page, scraper_vars.NO_RESULTS_SELECTOR)


def wait_for_results_ready(page, recorded_searches: list) -> bool:
    """Both /search calls answered, then the DOM settled. Waiting on the DOM alone would
    catch the partial isFast:true render, or a stale pre-rendered SSG snapshot."""
    poll_until(page, lambda: len(recorded_searches) >= scraper_vars.EXPECTED_SEARCH_RESPONSES,
               scraper_vars.SEARCH_RESPONSE_TIMEOUT_MS)
    return poll_until(page, lambda: is_results_ready(page), scraper_vars.RESULTS_READY_TIMEOUT_MS)
