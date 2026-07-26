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

# Console report.
OVERALL_SCORE_LINE = 'Overall score: {score:.4f}'
TABLE_METRIC_HEADER = 'Metric'
TABLE_K_HEADER_TEMPLATE = '@{k}'
META_LINE_TEMPLATE = (
    'queries={num_queries} | evaluated={num_evaluated} | '
    'skipped_unsupported={num_skipped_unsupported} | '
    'skipped_empty_gt={num_skipped_empty_gt} | '
    'avg_ground_truth_size={avg_ground_truth_size:.2f}'
)

# Per-query CSV.
PER_QUERY_CSV_QUERY_HEADER = 'query'
PER_QUERY_CSV_GT_SIZE_HEADER = 'ground_truth_size'
PER_QUERY_CSV_EMPTY_GT_HEADER = 'empty_ground_truth'
PER_QUERY_CSV_SKIP_REASON_HEADER = 'skip_reason'
PER_QUERY_CSV_HITS_HEADER_TEMPLATE = 'hits@{k}'

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
LOG_WROTE_RESULTS = 'Wrote results to {summary}, {csv} and {html}'
LOG_THRESHOLDS_PASSED = 'All thresholds passed'
LOG_THRESHOLD_FAILED = 'Threshold failed: {name} = {value:.4f} < {threshold:.4f}'

# Errors (raised at the orchestrator boundary).
ERROR_MISSING_GROUND_TRUTH = 'No scraped ground truth for "{query}". Re-run with --rescrape.'
