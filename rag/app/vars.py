import os
from pathlib import Path

from dotenv import load_dotenv

RAG_SERVICE_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(RAG_SERVICE_ROOT / '.env')

# Server
SERVER_HOST = os.getenv('RAG_SERVER_HOST', '0.0.0.0')
SERVER_PORT = int(os.getenv('RAG_SERVER_PORT', '8200'))

# Elasticsearch connection (same env names as the rest of the repo)
ELASTIC_URL = os.getenv('ELASTIC_URL', 'https://srm-staging-elasticsearch.whiletrue.industries')
ELASTIC_USERNAME = os.getenv('ELASTIC_USERNAME', 'elastic')
ELASTIC_PASSWORD = os.getenv('ELASTIC_PASS', '')

# Indexes
CARDS_INDEX_NAME = os.getenv('CARDS_INDEX_NAME', 'srm__cards')
CARD_ID_FIELD_NAME = os.getenv('CARD_ID_FIELD_NAME', 'card_id')
RAG_EMBEDDINGS_INDEX_NAME = os.getenv('RAG_EMBEDDINGS_INDEX_NAME', 'srm__cards_rag_embeddings')

# Logging (ask logs roll into a weekly index: {RAG_LOGS_INDEX_NAME}_{week}_{year})
RAG_LOGS_INDEX_NAME = os.getenv('RAG_LOGS_INDEX_NAME', 'srm__rag_ask_logs')
LOG_LEVEL = os.getenv('RAG_LOG_LEVEL', 'INFO')

# Embedding (relative paths resolve against the rag service root, absolute paths are kept as-is)
EMBEDDING_MODEL_PATH = str(RAG_SERVICE_ROOT / os.getenv('EMBEDDING_MODEL_PATH', 'artifacts/retrieval-model'))
# E5-style text prefixes - set both to empty strings for models that do not use them
EMBEDDING_PASSAGE_PREFIX = os.getenv('EMBEDDING_PASSAGE_PREFIX', 'passage: ')
EMBEDDING_QUERY_PREFIX = os.getenv('EMBEDDING_QUERY_PREFIX', 'query: ')
CARD_NESTED_ITEM_NAME_FIELD = os.getenv('CARD_NESTED_ITEM_NAME_FIELD', 'name')
CARD_NESTED_ITEM_SYNONYMS_FIELD = os.getenv('CARD_NESTED_ITEM_SYNONYMS_FIELD', 'synonyms')
CARD_NESTED_ITEM_TITLE_FIELD = os.getenv('CARD_NESTED_ITEM_TITLE_FIELD', 'title')
CARD_NESTED_ITEM_HREF_FIELD = os.getenv('CARD_NESTED_ITEM_HREF_FIELD', 'href')
CARD_SCAN_BATCH_SIZE = int(os.getenv('CARD_SCAN_BATCH_SIZE', '500'))
CARD_SCAN_SCROLL_KEEP_ALIVE = os.getenv('CARD_SCAN_SCROLL_KEEP_ALIVE', '30m')
# How many cards are rendered, embedded (in one model call), and bulk-indexed per reindex batch.
CARD_EMBED_BATCH_SIZE = int(os.getenv('CARD_EMBED_BATCH_SIZE', '64'))

# Retrieval
RETRIEVAL_TOP_K = int(os.getenv('RETRIEVAL_TOP_K', '5'))
KNN_NUM_CANDIDATES = int(os.getenv('KNN_NUM_CANDIDATES', '100'))
# How many candidates each retriever (kNN, BM25) returns into the reciprocal rank fusion.
CANDIDATE_POOL_SIZE = int(os.getenv('CANDIDATE_POOL_SIZE', '50'))
# The rank constant in the reciprocal rank fusion score 1 / (rank_constant + rank).
RRF_RANK_CONSTANT = int(os.getenv('RRF_RANK_CONSTANT', '60'))

# LLM (OpenAI-format key against an OpenAI-compatible endpoint serving the Gemini model)
LLM_MODEL_NAME = os.getenv('LLM_MODEL_NAME', 'gemini-3.1-flash-lite')
LLM_BASE_URL = os.getenv('LLM_BASE_URL', '')
LLM_MAX_TOKENS = int(os.getenv('LLM_MAX_TOKENS', '1024'))

# Reranker (cross-encoder that rescores the fused candidate pool)
RERANKER_MODEL_PATH = str(RAG_SERVICE_ROOT / os.getenv('RERANKER_MODEL_PATH', 'artifacts/reranker-model'))
# How many top fused docs the cross-encoder rescores (latency knob: ~1.4s at 10, ~2.4s at 20 on CPU).
RERANK_POOL_SIZE = int(os.getenv('RERANK_POOL_SIZE', '20'))
# Max token length per (query, document) pair fed to the cross-encoder.
# Set to bge-reranker-v2-m3's full context so pairs are never truncated.
RERANKER_MAX_LENGTH = int(os.getenv('RERANKER_MAX_LENGTH', '8192'))

# Mock FE
MOCK_FE_ROUTE_PATH = '/'
MOCK_FE_INDEX_PATH = str(RAG_SERVICE_ROOT / 'mock_fe' / 'index.html')

# Route paths
HEALTH_ROUTE_PATH = '/health'
UPDATE_CARD_ROUTE_PATH = '/api/cards/update'
REINDEX_CARDS_ROUTE_PATH = '/api/cards/reindex'
RETRIEVAL_ROUTE_PATH = '/api/retrieve'
ASK_ROUTE_PATH = '/api/ask'
RATING_ROUTE_PATH = '/api/ask/rate'

# Chat history roles
HISTORY_ROLE_USER = 'user'
HISTORY_ROLE_ASSISTANT = 'assistant'
