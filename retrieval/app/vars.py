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
# Branch-level cards index (published by the ETL) used to enrich retrieved services
# with their organizations and branches, mirroring the be search hierarchy.
CARDS_INDEX_NAME = os.getenv('CARDS_INDEX_NAME', 'srm__cards')

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
# How many processed services between reindex progress events streamed back to the caller.
REINDEX_PROGRESS_INTERVAL = int(os.getenv('REINDEX_PROGRESS_INTERVAL', '100'))

# Retrieval
KNN_NUM_CANDIDATES = int(os.getenv('KNN_NUM_CANDIDATES', '100'))
# How many candidates each retriever (kNN, BM25) returns into the reciprocal rank fusion.
CANDIDATE_POOL_SIZE = int(os.getenv('CANDIDATE_POOL_SIZE', '50'))
# The rank constant in the reciprocal rank fusion score 1 / (rank_constant + rank).
RRF_RANK_CONSTANT = int(os.getenv('RRF_RANK_CONSTANT', '60'))
# Per-retriever weights multiplied into each reciprocal rank contribution before
# fusion. Raise SEMANTIC_WEIGHT to favor kNN (meaning), LEXICAL_WEIGHT to favor BM25
# (exact terms). Only the ratio matters; 1.0/1.0 reproduces plain equal-weight RRF.
SEMANTIC_WEIGHT = float(os.getenv('SEMANTIC_WEIGHT', '1.0'))
LEXICAL_WEIGHT = float(os.getenv('LEXICAL_WEIGHT', '1.0'))
# Minimum fused RRF score a service must reach to be returned. The fused score is a pure
# function of ranks, so this behaves as a fixed top-N cut, NOT as a relevance cut - the
# Nth-best fused score is near-identical for every query. Use the semantic floors below
# for a cut whose length actually varies with the query.
MIN_FUSED_SCORE = float(os.getenv('MIN_FUSED_SCORE', '0.0'))

# Score truncation. Every cutoff is independent and off at its default, so these values
# reproduce "return the whole fused pool". See the README for how to tune them.
# The semantic floors are in COSINE units: Elasticsearch scores a cosine dense_vector as
# (1 + cosine) / 2, and that +0.5 offset would squeeze every useful ratio into [0.95, 1.0].
# Tied to 'similarity': 'cosine' in ensure_retrieval_index_exists - changing it breaks these.
COSINE_SCORE_OFFSET = 0.5
COSINE_SCORE_SCALE = 0.5
MINIMUM_COSINE_SIMILARITY = -1.0
# Absolute cosine floor, off at the cosine minimum. The only cutoff that can return nothing.
MIN_SEMANTIC_SCORE = float(os.getenv('MIN_SEMANTIC_SCORE', str(MINIMUM_COSINE_SIMILARITY)))
# Relative cosine floor: keep documents within this fraction of the pool's best cosine.
# 0.0 disables it. The cutoff that adapts per query.
SEMANTIC_SCORE_RATIO = float(os.getenv('SEMANTIC_SCORE_RATIO', '0.0'))
# BM25-only documents carry no cosine. False imputes the kNN list minimum (a document absent
# from a kNN list of size N provably scores at or below its Nth-best cosine). True exempts
# them, pinning the result length to CANDIDATE_POOL_SIZE - escape hatch, not a default.
KEEP_LEXICAL_ONLY_DOCUMENTS = os.getenv('KEEP_LEXICAL_ONLY_DOCUMENTS', 'false').lower() == 'true'
# Hard cap; 0 disables it. Caps documents, not services - the cards join and the
# service_name collapse shrink the list further, so services is always <= this.
MAX_RETURNED_SERVICES = int(os.getenv('MAX_RETURNED_SERVICES', '0'))
# Keys each retriever's raw score is attached under once fusion has overwritten 'score'.
SEMANTIC_SCORE_KEY = 'semantic_score'
LEXICAL_SCORE_KEY = 'lexical_score'

# Service hierarchy assembly (cards -> service/organization/branch, mirrors the be search route).
# Cards are collapsed by service_id; each service's cards (branches) come back as inner hits.
CARDS_COLLAPSE_FIELD = 'service_id'
CARDS_INNER_HITS_NAME = 'branch_hits'
CARDS_INNER_HITS_SIZE = int(os.getenv('CARDS_INNER_HITS_SIZE', '1000'))
# Card _source fields the hierarchy mapper reads (service, organization and branch levels).
CARDS_SOURCE_FIELDS = [
    'service_id', 'service_name', 'service_description', 'service_boost', 'score',
    'service_phone_numbers', 'organization_id', 'organization_name', 'organization_kind',
    'organization_phone_numbers', 'card_id', 'branch_name', 'branch_address', 'address_parts',
    'branch_operating_unit', 'national_service', 'branch_location_accurate', 'branch_geometry',
    'responses', 'situations',
]

# Mock FE
MOCK_FE_ROUTE_PATH = '/'
MOCK_FE_INDEX_PATH = str(RETRIEVAL_SERVICE_ROOT / 'mock_fe' / 'index.html')

# Route paths
HEALTH_ROUTE_PATH = '/health'
UPDATE_SERVICE_ROUTE_PATH = '/api/services/update'
REINDEX_SERVICES_ROUTE_PATH = '/api/services/reindex'
RETRIEVE_ROUTE_PATH = '/api/retrieve'
