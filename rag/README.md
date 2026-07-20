# Kolsherut RAG Service

A basic FastAPI microservice hosting a RAG pipeline over the card documents in the Kolsherut Elasticsearch (`srm__cards`).

## Flow

1. **Embed** — `POST /api/cards/update` receives a `cardId`, fetches the card from `srm__cards`, builds text from the configured fields, embeds it with the local retrieval model, and stores it in a dedicated embeddings index (`srm__cards_rag_embeddings`).
2. **Retrieve** — `POST /api/retrieve` embeds a query and runs a kNN search over the embeddings index (testing route).
3. **Ask** — `POST /api/ask` runs the full pipeline: retrieval + LangChain LLM answer based on the retrieved context and the chat history.

Retrieval is a hybrid funnel: two bi-encoder retrievers (semantic kNN + lexical BM25) each return `CANDIDATE_POOL_SIZE` candidates, reciprocal rank fusion merges them, the top `RERANK_POOL_SIZE` are rescored by a cross-encoder reranker, and the top `RETRIEVAL_TOP_K` are handed to the LLM.

## Setup

1. Place the sentence-transformers retrieval model in `artifacts/retrieval-model` and the cross-encoder reranker model in `artifacts/reranker-model`.
2. Copy `.env.example` to `.env` and fill in `ELASTIC_PASS`, `OPENAI_API_KEY`, and `LLM_BASE_URL` (the OpenAI-compatible endpoint serving the Gemini model).
3. Install and run:

```bash
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8200
```

The server boots without the retrieval model present — the model loads lazily on the first embed/retrieve request.

## Routes

| Method | Path                | Body                                                | Description                        |
| ------ | ------------------- | --------------------------------------------------- | ---------------------------------- |
| GET    | `/health`           | -                                                   | Health check                       |
| POST   | `/api/cards/update` | `{ "cardId": "..." }`                               | Embed a single card into the RAG index |
| POST   | `/api/cards/reindex`| `{ "limit": 50 }` (optional)                        | Scan all card ids from `srm__cards`, embed each, and insert into the RAG index. Omit `limit` for the full index. Returns `{total, embedded, skipped_no_text, not_found}`. |
| POST   | `/api/retrieve`     | `{ "query": "...", "top_k": 5 }`                    | Retrieval only (for testing)       |
| POST   | `/api/ask`          | `{ "prompt": "...", "history": [{role, content}] }` | Full RAG pipeline                  |

Interactive docs: `http://localhost:8200/docs`.

## Configuration

All configuration lives in `app/vars.py` (overridable via `.env` — copy `.env.example`) and all text in `app/strings.py`. Card text itself is built from **templates + macros** in `strings.py`, not from a field list: `CARD_FIELD_MACROS` maps each card field to a token (e.g. `service_name` → `%%SERVICE_NAME%%`); `CARD_EMBEDDING_TEXT_TEMPLATE` and `CARD_CONTEXT_TEXT_TEMPLATE` are prose containing those tokens. `app/services/embedding_document/render_card_text.py` substitutes each macro with the formatted field value and normalizes whitespace/punctuation. Two distinct outputs are stored per card: a lean **`embedded_text`** (vectorized for retrieval) and a richer **`context_text`** (fed to the LLM — includes phones, payment, URLs, address).

### Environment variables

**Server**

| Variable | Default | Description |
| --- | --- | --- |
| `RAG_SERVER_HOST` | `0.0.0.0` | Host interface the FastAPI/uvicorn server binds to. |
| `RAG_SERVER_PORT` | `8200` | Port the server listens on. |

**Elasticsearch**

| Variable | Default | Description |
| --- | --- | --- |
| `ELASTIC_URL` | staging URL | Base URL of the Elasticsearch cluster (shared with the rest of the repo). |
| `ELASTIC_USERNAME` | `elastic` | Elasticsearch basic-auth username. |
| `ELASTIC_PASS` | *(empty)* | Elasticsearch password. **Required** — set in `.env`. |

**Indexes**

| Variable | Default | Description |
| --- | --- | --- |
| `CARDS_INDEX_NAME` | `srm__cards` | Source index of card documents, owned by the ETL. This service only reads it — never modifies it. |
| `CARD_ID_FIELD_NAME` | `card_id` | Field holding the card id inside a `srm__cards` document. |
| `RAG_EMBEDDINGS_INDEX_NAME` | `srm__cards_rag_embeddings` | Dedicated embeddings index owned by this service; created automatically on first embed. |

**Logging**

| Variable | Default | Description |
| --- | --- | --- |
| `RAG_LOGS_INDEX_NAME` | `srm__rag_ask_logs` | Base name for ask logs; each entry rolls into a weekly index `{name}_{week}_{year}`. |
| `RAG_LOG_LEVEL` | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`, …). |

**Embedding**

| Variable | Default | Description |
| --- | --- | --- |
| `EMBEDDING_MODEL_PATH` | `artifacts/retrieval-model` | Path to the sentence-transformers retrieval (bi-encoder) model. Relative paths resolve against the service root; absolute paths are used as-is. |
| `EMBEDDING_PASSAGE_PREFIX` | `"passage: "` | E5-style prefix prepended to card text at embed time. Set empty for models that don't use prefixes. |
| `EMBEDDING_QUERY_PREFIX` | `"query: "` | E5-style prefix prepended to query text at embed time. Set empty for models that don't use prefixes. |
| `CARD_NESTED_ITEM_NAME_FIELD` | `name` | Sub-field read for the display name of nested `situations`/`responses` items. |
| `CARD_NESTED_ITEM_SYNONYMS_FIELD` | `synonyms` | Sub-field read for synonyms of nested `situations`/`responses` items. |
| `CARD_NESTED_ITEM_TITLE_FIELD` | `title` | Sub-field read for the title of nested URL objects. |
| `CARD_NESTED_ITEM_HREF_FIELD` | `href` | Sub-field read for the link of nested URL objects. |
| `CARD_SCAN_BATCH_SIZE` | `500` | Cards fetched per scroll page when scanning `srm__cards` during a reindex. |
| `CARD_SCAN_SCROLL_KEEP_ALIVE` | `30m` | How long Elasticsearch keeps the reindex scroll context alive between pages. |
| `CARD_EMBED_BATCH_SIZE` | `64` | Cards rendered, embedded (in one model call), and bulk-indexed per reindex batch. |

**Retrieval**

| Variable | Default | Description |
| --- | --- | --- |
| `RETRIEVAL_TOP_K` | `5` | Final number of reranked documents passed to the LLM (and returned by `/api/retrieve`). |
| `KNN_NUM_CANDIDATES` | `100` | HNSW candidate queue size per shard for the kNN search — an approximation-accuracy vs. speed knob, not a full-DB scan. |
| `CANDIDATE_POOL_SIZE` | `50` | Candidates each retriever (kNN + BM25) returns into reciprocal rank fusion. Must be ≥ `RERANK_POOL_SIZE`. |
| `RRF_RANK_CONSTANT` | `60` | Rank constant `k` in the fusion score `1 / (k + rank)`; higher flattens rank gaps so fusion rewards cross-retriever agreement. |

**LLM**

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | *(empty)* | API key for the OpenAI-compatible endpoint serving the Gemini model. **Required** — set in `.env`. |
| `LLM_MODEL_NAME` | `gemini-3.1-flash-lite` | Chat model name requested from the endpoint. |
| `LLM_BASE_URL` | *(empty)* | OpenAI-compatible base URL serving the model. **Required** — set in `.env`. |
| `LLM_MAX_TOKENS` | `1024` | Max tokens generated in the LLM answer. |

**Reranker**

| Variable | Default | Description |
| --- | --- | --- |
| `RERANKER_MODEL_PATH` | `artifacts/reranker-model` | Path to the cross-encoder reranker model. Relative paths resolve against the service root; absolute paths are used as-is. |
| `RERANK_POOL_SIZE` | `20` | Top fused docs the cross-encoder rescores. Main latency knob (~1.4s at 10, ~2.4s at 20 on CPU). |
| `RERANKER_MAX_LENGTH` | `8192` | Max tokens per `(query, document)` pair fed to the cross-encoder. Set to `bge-reranker-v2-m3`'s full context, so pairs are never truncated. |
