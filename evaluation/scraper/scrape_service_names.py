from evaluation import vars
from evaluation.schemas import ScrapedPage
from evaluation.strings import SKIP_REASON_NOT_A_RESULTS_PAGE
from evaluation.scraper.normalize_service_name import normalize_and_dedupe
from evaluation.scraper.wait_for_results_ready import (
    has_element, poll_until, wait_for_results_ready,
)


def is_results_page(page) -> bool:
    """Card pages and the homepage fallback never mount the results pane."""
    return poll_until(page, lambda: has_element(page, vars.RESULTS_CONTAINER_SELECTOR),
                      vars.RESULTS_CONTAINER_TIMEOUT_MS)


def read_service_names(page) -> tuple[str, ...]:
    """The FE concatenates the fast and rest responses without deduping, so names repeat."""
    rendered = page.locator(vars.SERVICE_NAME_SELECTOR).all_inner_texts()
    return normalize_and_dedupe(rendered)


def scrape_service_names(page, recorded_searches: list, staging_url: str) -> ScrapedPage:
    """Render one golden-set URL and read the service names the site shows.

    Cookies are cleared first: staging sits behind Cloudflare, which hands out a cookie on
    the first response and then answers 403 to every later request that presents it from an
    automated browser. Starting each page cookie-less keeps every navigation a first visit.
    """
    page.context.clear_cookies()
    recorded_searches.clear()
    page.goto(staging_url, timeout=vars.PAGE_LOAD_TIMEOUT_MS)
    if not is_results_page(page):
        return ScrapedPage(skip_reason=SKIP_REASON_NOT_A_RESULTS_PAGE)
    wait_for_results_ready(page, recorded_searches)
    return ScrapedPage(service_names=read_service_names(page))
