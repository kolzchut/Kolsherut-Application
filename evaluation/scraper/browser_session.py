from contextlib import contextmanager

from playwright.sync_api import sync_playwright

from evaluation import scraper_vars
from evaluation.scraper.wait_for_results_ready import build_search_response_recorder


@contextmanager
def browser_session():
    """One headless Chromium page for the whole scrape, plus the list of /search responses
    seen so far. The listener is registered once here so no per-page cleanup is needed.

    The user agent is overridden on purpose and must stay a plain desktop Chrome string:
    Cloudflare answers the default 'HeadlessChrome' agent with a 403 challenge page, and
    staging's nginx routes curl/wget/python-requests agents to a server-side-rendered
    pipeline that serves different markup (FE/nginx-stage.conf).
    """
    playwright = sync_playwright().start()
    browser = None
    try:
        browser = playwright.chromium.launch(
            headless=scraper_vars.BROWSER_HEADLESS, args=scraper_vars.BROWSER_LAUNCH_ARGS)
        context = browser.new_context(user_agent=scraper_vars.BROWSER_USER_AGENT)
        page = context.new_page()
        page.set_default_timeout(scraper_vars.RESULTS_READY_TIMEOUT_MS)
        recorded_searches, record_response = build_search_response_recorder()
        page.on('response', record_response)
        yield page, recorded_searches
    finally:
        if browser:
            browser.close()
        playwright.stop()
