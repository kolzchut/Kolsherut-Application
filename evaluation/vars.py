import os
from pathlib import Path

from dotenv import load_dotenv

EVALUATION_ROOT = Path(__file__).resolve().parent

load_dotenv(EVALUATION_ROOT / '.env')

# The service under evaluation (already running; this pipeline is a pure HTTP client).
RETRIEVAL_BASE_URL = os.getenv('RETRIEVAL_BASE_URL', 'http://localhost:8200')
RETRIEVE_ENDPOINT_PATH = '/api/retrieve'
REQUEST_TIMEOUT_SECONDS = float(os.getenv('EVAL_REQUEST_TIMEOUT_SECONDS', '30'))

# The site whose rendered results are the ground truth.
STAGING_BASE_URL = os.getenv('STAGING_BASE_URL', 'https://staging.kolsherut.org.il')

# Dataset: the raw golden set, and the service names scraped from it once and reused.
DATASET_PATH = EVALUATION_ROOT / 'data' / 'Raw-Golden-Set.csv'
GROUND_TRUTH_PATH = EVALUATION_ROOT / 'data' / 'golden-set-ground-truth.json'
DATASET_HAS_HEADER = True
QUERY_COLUMN_INDEX = 0
URL_COLUMN_INDEX = 1

# Ground-truth file keys.
GROUND_TRUTH_SOURCE_FILE_KEY = 'source_file'
GROUND_TRUTH_SOURCE_CHECKSUM_KEY = 'source_checksum'
GROUND_TRUTH_BASE_URL_KEY = 'base_url'
GROUND_TRUTH_ENTRIES_KEY = 'entries'
GROUND_TRUTH_QUERY_KEY = 'query'
GROUND_TRUTH_URL_KEY = 'url'
GROUND_TRUTH_STAGING_URL_KEY = 'staging_url'
GROUND_TRUTH_SERVICE_NAMES_KEY = 'service_names'
GROUND_TRUTH_SKIP_REASON_KEY = 'skip_reason'
CHECKSUM_PREFIX = 'sha256:'

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

RESULTS_DIR = EVALUATION_ROOT / 'results'
SUMMARY_JSON_PATH = RESULTS_DIR / 'summary.json'
PER_QUERY_CSV_PATH = RESULTS_DIR / 'per_query.csv'
REPORT_HTML_PATH = RESULTS_DIR / 'report.html'
DASHBOARD_TEMPLATE_PATH = EVALUATION_ROOT / 'dashboard' / 'dashboard.html'
DASHBOARD_DATA_PLACEHOLDER = '__SUMMARY_JSON__'

# Ranking cutoffs every metric is reported at.
K_VALUES = [3, 5, 10, 25, 50]

# Metric keys (identifiers used across metrics, aggregation, report and dashboard).
METRIC_MRR = 'mrr'
METRIC_RECALL = 'recall'
METRIC_PRECISION = 'precision'
METRIC_F1 = 'f1'
METRIC_HIT_RATE = 'hit_rate'
METRIC_NDCG = 'ndcg'
METRIC_MAP = 'map'
METRIC_KEYS = [
    METRIC_MRR, METRIC_RECALL, METRIC_PRECISION, METRIC_F1,
    METRIC_HIT_RATE, METRIC_NDCG, METRIC_MAP,
]

# Final single-number score: weighted mean of every metric across every k. Missing
# metric weights default to 1.0 (equal weight for all 7 x 5 = 35 cells).
SCORE_WEIGHTS = {}

# CI gate (report-only when both are falsy). Non-zero exit when a threshold is unmet.
MIN_OVERALL_SCORE = None
PER_METRIC_THRESHOLDS = {}
