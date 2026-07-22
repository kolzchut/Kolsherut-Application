# Kolsherut Retrieval Service

A FastAPI microservice that embeds and searches the **service** documents in the Kolsherut Elasticsearch (`srm_services`). It is a pure hybrid retriever: it returns the matching services and their scores. There is **no reranker and no LLM answer generation**.

## Flow

1. **Embed** — `POST /api/services/update` receives a `serviceId`, fetches the service from `srm_services`, builds Hebrew text from the configured fields, embeds it with the local retrieval model, and stores it in a dedicated embeddings index (`srm__services_retrieval_embeddings`).
2. **Reindex** — `POST /api/services/reindex` scans all of `srm_services`, embeds each service, and bulk-inserts into the embeddings index.
3. **Retrieve** — `POST /api/retrieve` embeds the query, runs the hybrid search, logs the request, and returns the matching services.

Retrieval is a hybrid funnel: two bi-encoder retrievers (semantic kNN + lexical BM25) each return `CANDIDATE_POOL_SIZE` candidates, reciprocal rank fusion merges them into a single fused score, and every service whose fused score reaches `MIN_FUSED_SCORE` is returned (no fixed top-k cap).

## Embedded text

The vectorized (and BM25-matched) text is **Hebrew only** — every English machine ID is omitted. It is built from `srm_services` fields in this order: `name`, `description`, `details` (when present), the deduped Hebrew situation names (union of `x_manual_sit_hebrew` / `x_sit_hebrew` / `x_final_situation_tag_hebrew`), and the deduped Hebrew organization names (`name (from organizations)`). Contact/payment/provider-kind fields are kept out of the vector and rendered into a separate `context_text` returned for display.

## Setup

1. Place the sentence-transformers retrieval model in `artifacts/retrieval-model`.
2. Copy `.env.example` to `.env` and fill in `ELASTIC_PASS` (and `ELASTIC_URL` if not local).
3. Install and run:

```bash
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8200
```

The server boots without the retrieval model present — the model loads lazily on startup (`warm_models`) and on the first request.

## Routes

| Method | Path                    | Body                              | Description                        |
| ------ | ----------------------- | --------------------------------- | ---------------------------------- |
| GET    | `/health`               | -                                 | Health check                       |
| POST   | `/api/services/update`  | `{ "serviceId": "..." }`          | Embed a single service into the retrieval index |
| POST   | `/api/services/reindex` | `{ "limit": 50, "resume": true }` (both optional) | Scan all of `srm_services`, embed each, insert into the retrieval index. Omit `limit` for the full index. `resume: true` skips services already present in the embeddings index (continue an interrupted run). Streams Server-Sent Events (`text/event-stream`): a `progress` event every 100 processed services and a final `done` event, each `{event, total, embedded, skipped_no_text, not_found}`. |
| POST   | `/api/retrieve`         | `{ "query": "..." }`              | Hybrid retrieval + request logging. Returns `{documents, log_id, log_index}`. |

Interactive docs: `http://localhost:8200/docs`.

## Configuration

All configuration lives in `app/vars.py` (overridable via `.env` — copy `.env.example`) and all text in `app/strings.py`. Service text is built from **templates + a field map** in `strings.py`: `SERVICE_FIELD_MACROS` maps each (possibly derived) field to a token (e.g. `name` → `%%NAME%%`); `SERVICE_EMBEDDING_TEXT_TEMPLATE` and `SERVICE_DISPLAY_TEXT_TEMPLATE` are Hebrew prose containing those tokens. `app/services/service_text_rendering/` builds the field values (unioning/deduping the Hebrew name fields) and substitutes each macro. Two outputs are stored per service: the vectorized **`embedded_text`** and a richer **`context_text`** returned for display.

### Environment variables

**Server**

| Variable | Default | Description |
| --- | --- | --- |
| `RETRIEVAL_SERVER_HOST` | `0.0.0.0` | Host interface the FastAPI/uvicorn server binds to. |
| `RETRIEVAL_SERVER_PORT` | `8200` | Port the server listens on. |

**Elasticsearch**

| Variable | Default | Description |
| --- | --- | --- |
| `ELASTIC_URL` | staging URL | Base URL of the Elasticsearch cluster (shared with the rest of the repo). |
| `ELASTIC_USERNAME` | `elastic` | Elasticsearch basic-auth username. |
| `ELASTIC_PASS` | *(empty)* | Elasticsearch password. **Required** — set in `.env`. |

**Indexes**

| Variable | Default | Description |
| --- | --- | --- |
| `SERVICES_INDEX_NAME` | `srm_services` | Source index of service documents, owned by the ETL. This service only reads it — never modifies it. |
| `SERVICE_ID_FIELD_NAME` | `id` | Field holding the service id inside a `srm_services` document. |
| `RETRIEVAL_EMBEDDINGS_INDEX_NAME` | `srm__services_retrieval_embeddings` | Dedicated embeddings index owned by this service; created automatically on first embed. |

**Logging**

| Variable | Default | Description |
| --- | --- | --- |
| `RETRIEVAL_LOGS_INDEX_NAME` | `srm__retrieval_logs` | Base name for retrieval logs; each entry rolls into a weekly index `{name}_{week}_{year}`. |
| `RETRIEVAL_LOG_LEVEL` | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`, …). |

**Embedding**

| Variable | Default | Description |
| --- | --- | --- |
| `EMBEDDING_MODEL_PATH` | `artifacts/retrieval-model` | Path to the sentence-transformers retrieval (bi-encoder) model. Relative paths resolve against the service root; absolute paths are used as-is. |
| `EMBEDDING_PASSAGE_PREFIX` | `"passage: "` | E5-style prefix prepended to service text at embed time. Set empty for models that don't use prefixes. |
| `EMBEDDING_QUERY_PREFIX` | `"query: "` | E5-style prefix prepended to query text at embed time. Set empty for models that don't use prefixes. |
| `SERVICE_SCAN_BATCH_SIZE` | `500` | Services fetched per scroll page when scanning `srm_services` during a reindex. |
| `SERVICE_SCAN_SCROLL_KEEP_ALIVE` | `30m` | How long Elasticsearch keeps the reindex scroll context alive between pages. |
| `SERVICE_EMBED_BATCH_SIZE` | `64` | Services rendered, embedded (in one model call), and bulk-indexed per reindex batch. |

**Retrieval**

| Variable | Default | Description |
| --- | --- | --- |
| `KNN_NUM_CANDIDATES` | `100` | HNSW candidate queue size per shard for the kNN search — an approximation-accuracy vs. speed knob, not a full-DB scan. |
| `CANDIDATE_POOL_SIZE` | `50` | Candidates each retriever (kNN + BM25) returns into reciprocal rank fusion; also the natural upper bound on results. |
| `RRF_RANK_CONSTANT` | `60` | Rank constant `k` in the fusion score `1 / (k + rank)`; higher flattens rank gaps so fusion rewards cross-retriever agreement. |
| `MIN_FUSED_SCORE` | `0.0` | Minimum fused RRF score a service must reach to be returned. RRF scores are rank-based (~0.01–0.03), not cosine similarity — tune empirically. |
