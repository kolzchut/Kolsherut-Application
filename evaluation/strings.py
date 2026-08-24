APP_TITLE = 'Kolsherut Retrieval Evaluation'

# Human-readable metric labels, keyed by the metric identifiers in vars.py.
METRIC_LABELS = {
    'mrr': 'MRR',
    'recall': 'Recall',
    'precision': 'Precision',
    'f1': 'F1',
    'hit_rate': 'Hit-Rate',
    'ndcg': 'nDCG',
    'map': 'MAP',
}

# Set-level metric and count-parity labels, keyed by the identifiers in vars.py.
SET_METRIC_LABELS = {
    'precision_at_returned': 'Precision@returned',
    'recall_at_returned': 'Recall@returned',
    'f1_at_returned': 'F1@returned',
    'count_parity': 'Count-Parity',
}
COUNT_STAT_LABELS = {
    'mean_count_parity': 'Mean count parity',
    'median_returned_count': 'Median returned',
    'median_ground_truth_count': 'Median ground truth',
    'ratio_of_median_counts': 'Ratio of medians',
    'median_absolute_count_error': 'Median |count error|',
    'geometric_mean_count_ratio': 'Geometric-mean count ratio',
}

# Console report.
OVERALL_SCORE_LINE = 'Overall score: {score:.4f}'
TABLE_METRIC_HEADER = 'Metric'
TABLE_VALUE_HEADER = 'Value'
TABLE_K_HEADER_TEMPLATE = '@{k}'
SET_METRICS_TABLE_TITLE = 'Set metrics over the returned list'
COUNT_STATS_TABLE_TITLE = 'Count parity'
META_LINE_TEMPLATE = (
    'queries={num_queries} | evaluated={num_evaluated} | '
    'skipped_unsupported={num_skipped_unsupported} | '
    'skipped_empty_gt={num_skipped_empty_gt} | '
    'avg_ground_truth_size={avg_ground_truth_size:.2f} | '
    'avg_returned_count={avg_returned_count:.2f}'
)

# Per-query CSV.
PER_QUERY_CSV_QUERY_HEADER = 'query'
PER_QUERY_CSV_GT_SIZE_HEADER = 'ground_truth_size'
PER_QUERY_CSV_RETURNED_COUNT_HEADER = 'returned_count'
PER_QUERY_CSV_EMPTY_GT_HEADER = 'empty_ground_truth'
PER_QUERY_CSV_SKIP_REASON_HEADER = 'skip_reason'
PER_QUERY_CSV_MISSED_COUNT_HEADER = 'missed_ground_truth_count'
PER_QUERY_CSV_UNEXPECTED_COUNT_HEADER = 'unexpected_retrieved_count'
PER_QUERY_CSV_HITS_HEADER_TEMPLATE = 'hits@{k}'

# Service-diff CSV: the names behind those two counts, one row per query x service.
SERVICE_DIFF_CSV_QUERY_HEADER = 'query'
SERVICE_DIFF_CSV_SIDE_HEADER = 'side'
SERVICE_DIFF_CSV_RANK_HEADER = 'rank'
SERVICE_DIFF_CSV_SERVICE_NAME_HEADER = 'service_name'
SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH = 'missed_ground_truth'
SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED = 'unexpected_retrieved'
# The agreement side. Named a `side` like the other two even though it is not a difference, so a
# reader gets the whole (returned union golden set) partition from one column instead of having to
# know that the rows both systems agree on are simply absent.
SERVICE_DIFF_SIDE_MUTUAL_RETRIEVED = 'mutual_retrieved'

# Why a golden-set URL yields no usable ground truth.
SKIP_REASON_NOT_A_RESULTS_PAGE = 'URL does not render a results page (card page or homepage fallback)'

# CLI.
CLI_DESCRIPTION = 'Evaluate the retrieval service against service names scraped from the staging site.'
CLI_LIMIT_HELP = 'Evaluate only the first N queries.'
CLI_RESCRAPE_HELP = 'Re-scrape the staging site, ignoring the cached ground truth.'

# Logging.
EVAL_LOGGER_NAME = 'kolsherut-evaluation'
LOG_FORMAT = '%(asctime)s | %(levelname)s | %(name)s | %(message)s'

# Progress + result log messages.
LOG_LOADED_DATASET = 'Loaded {count} queries from {path}'
LOG_GROUND_TRUTH_CACHE_HIT = 'Reusing scraped ground truth {path} ({count} entries)'
LOG_SCRAPING_GROUND_TRUTH = 'Scraping ground truth from {base_url} ({count} pages, this takes a few minutes)'
LOG_SCRAPED_PAGE = 'Scraped {index}/{total}: {count} services | {query}'
LOG_SKIPPED_PAGE = 'Scraped {index}/{total}: skipped ({reason}) | {query}'
LOG_WROTE_GROUND_TRUTH = 'Wrote ground truth to {path} ({scraped} scraped, {skipped} skipped)'
LOG_EVALUATING_QUERY = 'Evaluating query {index}/{total}: {query}'
LOG_SKIPPING_QUERY = 'Skipping query {index}/{total} ({reason}): {query}'
# Missed-side content lookup. The unresolved count is logged at every run rather than once at
# write time, because those names are the rows whose content cells come out blank, and a reader
# comparing sides needs to know the blanks are unresolved names and not empty services.
LOG_SERVICE_DETAILS_CACHE_HIT = 'Reusing service content {path} ({count} names)'
LOG_LOOKING_UP_SERVICE_DETAILS = 'Looking up {count} service names on {base_url}'
LOG_LOOKED_UP_SERVICE_DETAILS = 'Looked up {index}/{total} service names'
LOG_WROTE_SERVICE_DETAILS = (
    'Wrote service content to {path}: {found} resolved, {unresolved} with no exact match'
)
LOG_WROTE_RESULTS = (
    'Wrote results to {summary}, {csv}, {diff}, {unexpected_json}, {missed_json}, {mutual_json} '
    'and {html}'
)
LOG_THRESHOLDS_PASSED = 'All thresholds passed'
LOG_THRESHOLD_FAILED = 'Threshold failed: {name} = {value:.4f} < {threshold:.4f}'

# Errors (raised at the orchestrator boundary).
ERROR_MISSING_GROUND_TRUTH = 'No scraped ground truth for "{query}". Re-run with --rescrape.'
