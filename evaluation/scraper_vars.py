import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / '.env')

# Everything the headless-browser scrape of the staging site needs. Split out of vars.py
# to keep that file within the line budget; consumed only by evaluation/scraper/.

# FE selectors. The app uses react-jss without minification, so class names are
# '<ruleKey>-0-1-<counter>' — always match on the prefix, never on the whole value.
SERVICE_NAME_SELECTOR = 'h2[class^="bannerTitle"]'
RESULTS_CONTAINER_SELECTOR = 'div[class^="resultsContainer"]'
LOADER_SELECTOR = '[class^="loader-"]'
NO_RESULTS_SELECTOR = '[class^="noResults"]'

# Scraping. The FE fires two /search calls (isFast true then false) and renders the
# first one's partial results immediately, so we wait for both before reading the DOM.
BROWSER_HEADLESS = os.getenv('EVAL_BROWSER_HEADLESS', 'true').lower() != 'false'
# Must look like a plain desktop Chrome. Cloudflare 403s the default 'HeadlessChrome' UA,
# and staging's nginx routes curl/wget/python-requests UAs to a different SSR pipeline.
BROWSER_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
)
BROWSER_LAUNCH_ARGS = ['--disable-blink-features=AutomationControlled']
SEARCH_REQUEST_PATH = '/search'
EXPECTED_SEARCH_RESPONSES = 2
PAGE_LOAD_TIMEOUT_MS = int(os.getenv('EVAL_PAGE_LOAD_TIMEOUT_MS', '60000'))
RESULTS_READY_TIMEOUT_MS = int(os.getenv('EVAL_RESULTS_READY_TIMEOUT_MS', '45000'))
RESULTS_CONTAINER_TIMEOUT_MS = int(os.getenv('EVAL_RESULTS_CONTAINER_TIMEOUT_MS', '15000'))
SEARCH_RESPONSE_TIMEOUT_MS = int(os.getenv('EVAL_SEARCH_RESPONSE_TIMEOUT_MS', '45000'))
POLL_INTERVAL_MS = 250
SEARCH_REQUEST_METHOD = 'POST'
