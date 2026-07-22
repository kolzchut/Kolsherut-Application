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
    'skipped_empty_gt={num_skipped_empty_gt} | be_404={num_be_404} | '
    'avg_ground_truth_size={avg_ground_truth_size:.2f}'
)

# Per-query CSV.
PER_QUERY_CSV_QUERY_HEADER = 'query'
PER_QUERY_CSV_GT_SIZE_HEADER = 'ground_truth_size'
PER_QUERY_CSV_EMPTY_GT_HEADER = 'empty_ground_truth'
PER_QUERY_CSV_HITS_HEADER_TEMPLATE = 'hits@{k}'

# Logging.
EVAL_LOGGER_NAME = 'kolsherut-evaluation'
LOG_FORMAT = '%(asctime)s | %(levelname)s | %(name)s | %(message)s'

# Progress + result log messages.
LOG_LOADED_DATASET = 'Loaded {count} queries from {path}'
LOG_EVALUATING_QUERY = 'Evaluating query {index}/{total}: {query}'
LOG_WROTE_RESULTS = 'Wrote results to {summary}, {csv} and {html}'
LOG_THRESHOLDS_PASSED = 'All thresholds passed'
LOG_THRESHOLD_FAILED = 'Threshold failed: {name} = {value:.4f} < {threshold:.4f}'

# Errors (raised at the orchestrator boundary).
ERROR_RETRIEVAL_REQUEST_FAILED = 'Retrieval request failed for query "{query}": {error}'
ERROR_BE_REQUEST_FAILED = 'BE search request failed for responseId="{response_id}" situationId="{situation_id}": {error}'
ERROR_BE_UNSUCCESSFUL_RESPONSE = 'BE search returned success=false (responseId="{response_id}", situationId="{situation_id}"): {message}'
