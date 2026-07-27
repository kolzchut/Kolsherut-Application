# Kolsherut Retrieval Service

A FastAPI microservice that embeds and searches the **service** documents in the Kolsherut Elasticsearch (`srm_services`). It is a pure hybrid retriever: it returns the matching services and their scores. There is **no reranker and no LLM answer generation**.

## Flow

1. **Embed** — `POST /api/services/update` receives a `serviceId`, fetches the service from `srm_services`, builds Hebrew text from the configured fields, embeds it with the local retrieval model, and stores it in a dedicated embeddings index (`srm__services_retrieval_embeddings`).
2. **Reindex** — `POST /api/services/reindex` scans all of `srm_services`, embeds each service, and bulk-inserts into the embeddings index.
3. **Retrieve** — `POST /api/retrieve` embeds the query, runs the hybrid search, logs the request, and returns the matching services.

Retrieval is a hybrid funnel: two retrievers (semantic kNN + lexical BM25) each return `CANDIDATE_POOL_SIZE` candidates, reciprocal rank fusion merges them into a single fused score, each document keeps its raw `semantic_score` / `lexical_score` alongside that fused score, and a **score cut** decides what is actually returned.

The score cut applies four independent rules in order — the fused floor (`MIN_FUSED_SCORE`), the absolute cosine floor (`MIN_SEMANTIC_SCORE`), the relative cosine floor (`SEMANTIC_SCORE_RATIO`), then the hard cap (`MAX_RETURNED_SERVICES`). **Every one is disabled by default**, so out of the box the whole fused pool is returned and `CANDIDATE_POOL_SIZE` is what bounds the result count.

Only the cosine floors produce a length that varies per query. The fused RRF score is `Σ weight / (RRF_RANK_CONSTANT + rank)` — a pure function of ranks — so the Nth-best fused score is near-identical for every query and thresholding it is a fixed top-N cut in disguise. The cosine is absolute and comparable across queries, which is what makes an adaptive cut possible.

### Tuning the score cut

The embedding model (multilingual-e5-large) has a **very compressed** cosine range, so the floors
have to be set against measured values, not intuition. Over 20 golden-set queries at
`CANDIDATE_POOL_SIZE=500`:

| cosine at rank | min | median | max |
| --- | --- | --- | --- |
| 1 (best) | 0.8324 | 0.8668 | 0.8933 |
| 10 | 0.8276 | 0.8473 | 0.8730 |
| 50 | 0.8064 | 0.8367 | 0.8665 |
| deepest | 0.7862 | 0.8072 | 0.8579 |

Two consequences:

- **The ratio floor is the usable knob, and only above ~0.97.** The spread from best to 50th is a
  median of just 0.026 (as low as 0.004 on the tightest query), so `SEMANTIC_SCORE_RATIO=0.92` keeps
  the entire pool. At `0.98` the kept count is genuinely query-dependent — measured per-query values
  ranged from 2 to "everything", median ≈ 17 documents.
- **`MIN_SEMANTIC_SCORE` is a nonsense-filter, not a length control.** The best cosine itself varies
  0.832–0.893 across queries, so any absolute floor inside that band empties some queries and barely
  touches others. Set it below the observed floor (~0.78) if you want it at all.
- Because one query can stay tight all the way down, **always pair the ratio with
  `MAX_RETURNED_SERVICES`.**

Measured end-to-end on the 65-query golden set (`SEMANTIC_SCORE_RATIO=0.98`, `MAX_RETURNED_SERVICES=100`):

| | cutoffs off | ratio 0.98 + cap 100 |
| --- | --- | --- |
| median services returned | 282 | **7** (ground truth median: 8) |
| geometric-mean count ratio | 25.8× | **0.91×** |
| mean count parity | 0.082 | **0.466** |
| Precision@returned | 0.057 | **0.267** |
| Recall@returned | 0.698 | 0.221 |
| F1@returned | 0.075 | **0.165** |

Count parity is essentially solved; the cost is recall. Tune with the evaluation harness's
`f1_at_returned` and `mean_count_parity` — every fixed-k metric is monotonically non-increasing under
truncation and will always prefer no cut at all.

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
| POST   | `/api/retrieve`         | `{ "query": "..." }`              | Hybrid retrieval + request logging. Returns `{documents, services, log_id, log_index}`. Each document carries `score` (fused), plus `semantic_score` and `lexical_score` — `null` when that retriever did not surface it. |

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
| `CANDIDATE_POOL_SIZE` | `50` | How deep each retriever (kNN + BM25) looks before fusion — a recall ceiling. With every score cutoff off it is also the de-facto result cap; once a cutoff is on, it should sit well above any plausible answer size so the score, not the pool, decides the length. |
| `RRF_RANK_CONSTANT` | `60` | Rank constant `k` in the fusion score `1 / (k + rank)`; higher flattens rank gaps so fusion rewards cross-retriever agreement. |
| `MIN_FUSED_SCORE` | `0.0` | Minimum fused RRF score a service must reach. The fused score is a pure function of ranks, so the Nth-best value is near-identical for every query — this is a **fixed top-N cut, not a relevance cut**. Use the semantic floors below for a length that varies with the query. |
| `MIN_SEMANTIC_SCORE` | `-1.0` | Absolute floor on the kNN **cosine** (not the Elasticsearch score). `-1.0` is the cosine minimum, so the default cuts nothing. The only cutoff that can return an empty result — a ratio floor always keeps at least the top document. |
| `SEMANTIC_SCORE_RATIO` | `0.0` | Relative cosine floor: keep documents within this fraction of the best cosine in the pool; `0.0` disables it. This is the cutoff that adapts per query. **Useful band is ~0.975–0.99** — see "Tuning the score cut" below; anything at or under 0.96 keeps essentially the whole pool. |
| `KEEP_LEXICAL_ONLY_DOCUMENTS` | `false` | How to treat documents BM25 surfaced but kNN did not, which carry no cosine. `false` imputes the kNN list minimum (a document absent from a kNN list of size N provably scores at or below the Nth-best cosine). `true` exempts them from both floors — BM25 returns `CANDIDATE_POOL_SIZE` hits for any non-empty query, so this pins the result length to the pool size and destroys count adaptivity. Escape hatch, not a default. |
| `MAX_RETURNED_SERVICES` | `0` | Hard cap on the returned list; `0` is uncapped. Counts **documents**, not services — the cards join drops card-less services and the `service_name` collapse dedupes, so `services` is always shorter. |
