import os
from pathlib import Path

from dotenv import load_dotenv

RETRIEVAL_SERVICE_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(RETRIEVAL_SERVICE_ROOT / '.env')

# Server
SERVER_HOST = os.getenv('RETRIEVAL_SERVER_HOST', '0.0.0.0')
SERVER_PORT = int(os.getenv('RETRIEVAL_SERVER_PORT', '8200'))

# Elasticsearch connection (same env names as the rest of the repo)
ELASTIC_URL = os.getenv('ELASTIC_URL', 'https://srm-staging-elasticsearch.whiletrue.industries')
ELASTIC_USERNAME = os.getenv('ELASTIC_USERNAME', 'elastic')
ELASTIC_PASSWORD = os.getenv('ELASTIC_PASS', '')

# Indexes
SERVICES_INDEX_NAME = os.getenv('SERVICES_INDEX_NAME', 'srm_services')
SERVICE_ID_FIELD_NAME = os.getenv('SERVICE_ID_FIELD_NAME', 'id')
RETRIEVAL_EMBEDDINGS_INDEX_NAME = os.getenv('RETRIEVAL_EMBEDDINGS_INDEX_NAME', 'srm__services_retrieval_embeddings')

# Logging (retrieval logs roll into a weekly index: {RETRIEVAL_LOGS_INDEX_NAME}_{week}_{year})
RETRIEVAL_LOGS_INDEX_NAME = os.getenv('RETRIEVAL_LOGS_INDEX_NAME', 'srm__retrieval_logs')
LOG_LEVEL = os.getenv('RETRIEVAL_LOG_LEVEL', 'INFO')

# Embedding (relative paths resolve against the service root, absolute paths are kept as-is)
EMBEDDING_MODEL_PATH = str(RETRIEVAL_SERVICE_ROOT / os.getenv('EMBEDDING_MODEL_PATH', 'artifacts/retrieval-model'))
# E5-style text prefixes - set both to empty strings for models that do not use them
EMBEDDING_PASSAGE_PREFIX = os.getenv('EMBEDDING_PASSAGE_PREFIX', 'passage: ')
EMBEDDING_QUERY_PREFIX = os.getenv('EMBEDDING_QUERY_PREFIX', 'query: ')

# srm_services source field keys read while rendering service text (some contain
# spaces/parentheses). The Hebrew situation names live across a few fields that
# are populated inconsistently, so they are unioned and deduped at render time.
SERVICE_NAME_FIELD = os.getenv('SERVICE_NAME_FIELD', 'name')
SERVICE_DESCRIPTION_FIELD = os.getenv('SERVICE_DESCRIPTION_FIELD', 'description')
SERVICE_DETAILS_FIELD = os.getenv('SERVICE_DETAILS_FIELD', 'details')
SERVICE_SITUATION_HEBREW_FIELDS = ['x_manual_sit_hebrew', 'x_sit_hebrew', 'x_final_situation_tag_hebrew']
SERVICE_ORGANIZATION_NAMES_FIELD = 'name (from organizations)'
SERVICE_ORGANIZATION_KIND_FIELD = 'kind (from organizations)'
SERVICE_PHONE_NUMBERS_FIELD = os.getenv('SERVICE_PHONE_NUMBERS_FIELD', 'phone_numbers')
SERVICE_EMAIL_FIELD = os.getenv('SERVICE_EMAIL_FIELD', 'email_address')
SERVICE_PAYMENT_REQUIRED_FIELD = os.getenv('SERVICE_PAYMENT_REQUIRED_FIELD', 'payment_required')
SERVICE_PAYMENT_DETAILS_FIELD = os.getenv('SERVICE_PAYMENT_DETAILS_FIELD', 'payment_details')

# Reindex scan/embed batching.
SERVICE_SCAN_BATCH_SIZE = int(os.getenv('SERVICE_SCAN_BATCH_SIZE', '500'))
SERVICE_SCAN_SCROLL_KEEP_ALIVE = os.getenv('SERVICE_SCAN_SCROLL_KEEP_ALIVE', '30m')
# How many services are rendered, embedded (in one model call), and bulk-indexed per reindex batch.
SERVICE_EMBED_BATCH_SIZE = int(os.getenv('SERVICE_EMBED_BATCH_SIZE', '64'))

# Retrieval
KNN_NUM_CANDIDATES = int(os.getenv('KNN_NUM_CANDIDATES', '100'))
# How many candidates each retriever (kNN, BM25) returns into the reciprocal rank fusion.
CANDIDATE_POOL_SIZE = int(os.getenv('CANDIDATE_POOL_SIZE', '50'))
# The rank constant in the reciprocal rank fusion score 1 / (rank_constant + rank).
RRF_RANK_CONSTANT = int(os.getenv('RRF_RANK_CONSTANT', '60'))
# Minimum fused RRF score a service must reach to be returned. RRF scores are
# rank-based (~0.01-0.03), not cosine similarity, so tune this empirically.
MIN_FUSED_SCORE = float(os.getenv('MIN_FUSED_SCORE', '0.0'))

# Mock FE
MOCK_FE_ROUTE_PATH = '/'
MOCK_FE_INDEX_PATH = str(RETRIEVAL_SERVICE_ROOT / 'mock_fe' / 'index.html')

# Route paths
HEALTH_ROUTE_PATH = '/health'
UPDATE_SERVICE_ROUTE_PATH = '/api/services/update'
REINDEX_SERVICES_ROUTE_PATH = '/api/services/reindex'
RETRIEVE_ROUTE_PATH = '/api/retrieve'
