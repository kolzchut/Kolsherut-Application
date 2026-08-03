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

# The incumbent backend, used for ONE thing: looking a service's description and tags up by name.
# Missed golden-set services were never returned by retrieval, so their content cannot come off a
# retrieval response - but /search reads the same srm__cards fields and returns the same service
# shape, so both sides of the table end up carrying content from one source.
BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'http://localhost:5000')
BACKEND_SEARCH_ENDPOINT_PATH = '/search'
# The search route's request fields. `service_name` is what narrows the query to one service;
# `search_query` is required by the route (it calls .replace on it unconditionally) and is sent
# empty so the route takes its filtered branch rather than its free-text one.
BACKEND_SEARCH_QUERY_FIELD = 'searchQuery'
BACKEND_SEARCH_IS_FAST_FIELD = 'isFast'
BACKEND_SEARCH_SERVICE_NAME_FIELD = 'serviceName'
BACKEND_SEARCH_RESULTS_FIELD = 'data'
# Deliberately the FAST branch. The rest branch pages from offset 50, so a name matching fewer
# than fifty cards comes back empty; the cost is that the route answers 404 rather than an empty
# list when nothing matched, which the client reads as "not found" instead of as a failure.
BACKEND_SEARCH_IS_FAST = True
BACKEND_NOT_FOUND_STATUS_CODE = 404

# Dataset: the raw golden set, and the service names scraped from it once and reused.
DATASET_PATH = EVALUATION_ROOT / 'data' / 'Raw-Golden-Set.csv'
GROUND_TRUTH_PATH = EVALUATION_ROOT / 'data' / 'golden-set-ground-truth.json'
# Descriptions and tags looked up from the BE, cached next to the ground truth and committed for
# the same reason: it is stable reference data about services, not a measurement of retrieval, so
# re-running must not depend on the BE being up or re-ask it 900 questions it already answered.
SERVICE_DETAILS_CACHE_PATH = EVALUATION_ROOT / 'data' / 'service-details-cache.json'
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

# Headless-browser scraping config lives in scraper_vars.py.

RESULTS_DIR = EVALUATION_ROOT / 'results'
SUMMARY_JSON_PATH = RESULTS_DIR / 'summary.json'
PER_QUERY_CSV_PATH = RESULTS_DIR / 'per_query.csv'
# Long format (one row per query x service), because the unexpected-name lists run to
# hundreds of services - per_query.csv carries only their counts.
SERVICE_DIFF_CSV_PATH = RESULTS_DIR / 'service_diff.csv'
# The same two sides as JSON, one object per service with its retrieval scores attached, so a
# relevance judge can read a query's false positives without joining two files. RESULTS_DIR is
# gitignored: both are run artifacts, never committed data.
UNEXPECTED_RETRIEVED_JSON_PATH = RESULTS_DIR / 'unexpected_retrieved.json'
MISSED_GROUND_TRUTH_JSON_PATH = RESULTS_DIR / 'missed_ground_truth.json'
# The third side: what retrieval returned AND the incumbent site shows - the true positives. Same
# schema as the other two, so nothing downstream has to special-case it. It is the side that makes
# the raw ranking readable: without it the other two renumber over the gaps it leaves.
MUTUAL_RETRIEVED_JSON_PATH = RESULTS_DIR / 'mutual_retrieved.json'
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

# Set-level metrics, computed over the ACTUAL returned list instead of a fixed cutoff.
# These are the only metrics that can reward truncation: cutting a non-hit off the tail
# shrinks precision's denominator while the numerator holds, so precision@returned rises,
# and recall@returned only falls when a real hit is cut - so F1@returned has an interior
# maximum over the threshold. Every metric above divides by k, so it can only stay flat
# or drop when documents are removed. Deliberately kept out of METRIC_KEYS: they have no
# k, and compute_overall_score would silently absorb them into the headline score.
METRIC_PRECISION_AT_RETURNED = 'precision_at_returned'
METRIC_RECALL_AT_RETURNED = 'recall_at_returned'
METRIC_F1_AT_RETURNED = 'f1_at_returned'
METRIC_COUNT_PARITY = 'count_parity'
SET_METRIC_KEYS = [METRIC_PRECISION_AT_RETURNED, METRIC_RECALL_AT_RETURNED, METRIC_F1_AT_RETURNED]
PER_QUERY_SET_METRIC_KEYS = [*SET_METRIC_KEYS, METRIC_COUNT_PARITY]

# Count parity: how closely our returned count tracks the incumbent site's. Counts are
# log-skewed (median 8, mean 18.7, max 230), so ratios are smoothed by +1 to stay finite
# when either side is 0, and medians/geometric means lead over arithmetic means.
COUNT_RATIO_SMOOTHING = 1
COUNT_STAT_MEAN_COUNT_PARITY = 'mean_count_parity'
COUNT_STAT_MEDIAN_RETURNED_COUNT = 'median_returned_count'
COUNT_STAT_MEDIAN_GROUND_TRUTH_COUNT = 'median_ground_truth_count'
COUNT_STAT_RATIO_OF_MEDIAN_COUNTS = 'ratio_of_median_counts'
COUNT_STAT_MEDIAN_ABSOLUTE_COUNT_ERROR = 'median_absolute_count_error'
COUNT_STAT_GEOMETRIC_MEAN_COUNT_RATIO = 'geometric_mean_count_ratio'
COUNT_STAT_KEYS = [
    COUNT_STAT_MEAN_COUNT_PARITY, COUNT_STAT_MEDIAN_RETURNED_COUNT,
    COUNT_STAT_MEDIAN_GROUND_TRUTH_COUNT, COUNT_STAT_RATIO_OF_MEDIAN_COUNTS,
    COUNT_STAT_MEDIAN_ABSOLUTE_COUNT_ERROR, COUNT_STAT_GEOMETRIC_MEAN_COUNT_RATIO,
]

# Per-service retrieval scores. One constant serves three roles, because the three names are
# deliberately identical: the field read off each retrieval `services[]` entry, the attribute
# on ServiceScores, and the JSON / CSV key it is written out under. Ordered as the FE badges
# read them - fused, then cosine, then ratio, then BM25 - so the report needs no rearranging.
SERVICE_SCORE_RETRIEVAL_KEY = 'retrieval_score'
SERVICE_SCORE_COSINE_KEY = 'cosine_score'
SERVICE_SCORE_COSINE_RATIO_KEY = 'cosine_score_ratio'
SERVICE_SCORE_LEXICAL_KEY = 'lexical_score'
SERVICE_SCORE_SEMANTIC_KEY = 'semantic_score'
SERVICE_SCORE_KEYS = [
    SERVICE_SCORE_RETRIEVAL_KEY, SERVICE_SCORE_COSINE_KEY, SERVICE_SCORE_COSINE_RATIO_KEY,
    SERVICE_SCORE_LEXICAL_KEY, SERVICE_SCORE_SEMANTIC_KEY,
]
# The per-query block in summary.json that holds the score map, keyed by service name.
PER_QUERY_SERVICE_SCORES_KEY = 'service_scores'

# Per-service content. Same three-roles-one-constant rule as the scores above: each name is the
# attribute on ServiceDetails, the JSON key inside a diff-file service object, and the CSV header.
# The two tag sets are carried as ids AND names - ids so a row joins back to the taxonomy, names
# so it can be read without one.
SERVICE_DETAIL_DESCRIPTION_KEY = 'service_description'
SERVICE_DETAIL_RESPONSE_IDS_KEY = 'response_ids'
SERVICE_DETAIL_RESPONSE_NAMES_KEY = 'response_names'
SERVICE_DETAIL_SITUATION_IDS_KEY = 'situation_ids'
SERVICE_DETAIL_SITUATION_NAMES_KEY = 'situation_names'
SERVICE_DETAIL_KEYS = [
    SERVICE_DETAIL_DESCRIPTION_KEY, SERVICE_DETAIL_RESPONSE_IDS_KEY,
    SERVICE_DETAIL_RESPONSE_NAMES_KEY, SERVICE_DETAIL_SITUATION_IDS_KEY,
    SERVICE_DETAIL_SITUATION_NAMES_KEY,
]
# Which of the five are tag sets rather than free text: the ones written as a joined list.
SERVICE_DETAIL_TAG_KEYS = [
    SERVICE_DETAIL_RESPONSE_IDS_KEY, SERVICE_DETAIL_RESPONSE_NAMES_KEY,
    SERVICE_DETAIL_SITUATION_IDS_KEY, SERVICE_DETAIL_SITUATION_NAMES_KEY,
]
# The per-query block in summary.json that holds the detail map, keyed by service name.
PER_QUERY_SERVICE_DETAILS_KEY = 'service_details'
# Fields read off one service object, as both retrieval and the BE return it. SERVICE_NAME_FIELD
# is what every map below is keyed on, after normalization.
SERVICE_NAME_FIELD = 'service_name'
# Fields of one `responses[]` / `situations[]` tag object, as both retrieval and the BE return it.
SERVICE_TAG_ID_FIELD = 'id'
SERVICE_TAG_NAME_FIELD = 'name'
SERVICE_RESPONSES_FIELD = 'responses'
SERVICE_SITUATIONS_FIELD = 'situations'

# Diff-JSON payload keys. Only the wrapper and per-query keys live here: each service object
# reuses SERVICE_SCORE_KEYS verbatim, so the JSON, the CSV and the FE badges name the same five
# scores identically and nothing has to be mapped between them.
DIFF_JSON_SIDE_KEY = 'side'
DIFF_JSON_GENERATED_FROM_KEY = 'generated_from'
DIFF_JSON_QUERIES_KEY = 'queries'
DIFF_JSON_COUNT_KEY = 'count'
DIFF_JSON_SERVICES_KEY = 'services'

# Final single-number score: weighted mean of every metric across every k. Missing
# metric weights default to 1.0 (equal weight for all 7 x 5 = 35 cells).
SCORE_WEIGHTS = {}

# CI gate (report-only when both are falsy). Non-zero exit when a threshold is unmet.
MIN_OVERALL_SCORE = None
PER_METRIC_THRESHOLDS = {}
