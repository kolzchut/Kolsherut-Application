import os
from pathlib import Path

from dotenv import load_dotenv

EVALUATION_ROOT = Path(__file__).resolve().parent

load_dotenv(EVALUATION_ROOT / '.env')

# Services under evaluation (already running; this pipeline is a pure HTTP client).
RETRIEVAL_BASE_URL = os.getenv('RETRIEVAL_BASE_URL', 'http://localhost:8200')
BE_BASE_URL = os.getenv('BE_BASE_URL', 'http://localhost:5000')
RETRIEVE_ENDPOINT_PATH = '/api/retrieve'
BE_SEARCH_ENDPOINT_PATH = '/search'
REQUEST_TIMEOUT_SECONDS = float(os.getenv('EVAL_REQUEST_TIMEOUT_SECONDS', '30'))

# Dataset (Hebrew query + Open Eligibility slugs) and generated outputs.
DATASET_PATH = EVALUATION_ROOT / 'data' / 'queries_slugs.csv'
DATASET_HAS_HEADER = True
QUERY_COLUMN_INDEX = 0
SLUGS_COLUMN_INDEX = 1
SLUGS_SEPARATOR = ','

RESULTS_DIR = EVALUATION_ROOT / 'results'
SUMMARY_JSON_PATH = RESULTS_DIR / 'summary.json'
PER_QUERY_CSV_PATH = RESULTS_DIR / 'per_query.csv'
REPORT_HTML_PATH = RESULTS_DIR / 'report.html'
DASHBOARD_TEMPLATE_PATH = EVALUATION_ROOT / 'dashboard' / 'dashboard.html'
DASHBOARD_DATA_PLACEHOLDER = '__SUMMARY_JSON__'

# Ranking cutoffs every metric is reported at.
K_VALUES = [3, 5, 10, 25, 50]

# Slug classification: which taxonomy branch maps to the BE responseId vs situationId field.
RESPONSE_SLUG_PREFIX = 'human_services'
SITUATION_SLUG_PREFIX = 'human_situations'

# BE /search body fields we never vary while filtering by taxonomy.
BE_EMPTY_SEARCH_QUERY = ''
BE_EMPTY_BY = ''
BE_EMPTY_SERVICE_NAME = ''

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
