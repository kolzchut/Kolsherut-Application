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
