# SPEC — Embedding V4: pluggable embedder (local ↔ Gemini)

Plan for replacing the embedder in `retrieval/` with a **selectable** one, keeping the V3 embedded
text byte-identical. Written against `retrieval/` on branch `fix-embedding-text-and-reindex`
(last commit touching it: `0664a22 V3 of embedding`).

**How to read this document**

- **§0–§2** — what V4 is, the current state it starts from, the target architecture. Read once.
- **§3–§9** — the execution plan as `Mission → Task → Step`. This is the part to review.
- **§10** — reference appendix: Gemini API facts, dimensions, cost, rate limits.
- **§11–§12** — risks and the convention checklist.
- **§13–§14** — open questions, and the execution log. **§14 is the current state; read it first.**

> ## STATUS — 2026-07-30
>
> **Missions 1–6 complete, Task 6.3 included. `gemini` wins the A↔B on every metric cell. Mission 7
> (rollout) not started.** **No code or documentation work that this spec mandates is outstanding.**
>
> | | |
> | --- | --- |
> | Provider seam, Gemini provider, config, mismatch guard (M1–M4) | ✅ implemented and validated live |
> | V4 index (M5) | ✅ **9,871 docs, 3072 dims**, `_meta`-stamped — full reindex done |
> | A↔B evaluation (M6) | ✅ **`overall_score` 0.3157 → 0.3694 (+17.0%)** with cuts; **0.3206 → 0.3853 (+20.2%)** without. **35/35 per-k cells improve, none regress.** §14.4 |
> | Record the outcome (Task 6.3) | ✅ **done** — new `## The model axis` section at `retrieval/README.md:132-206`, immediately after the V3 text-axis paragraph at `:130`, so both axes are legible side by side |
> | Cluster egress (Task 3.2 Step 5) | ✅ **verified open from inside the retrieval pod** — TLS validates and Google's frontend answers `403 PERMISSION_DENIED` to an unauthenticated call; no NetworkPolicy in `default`. **Network reachability only** — it says nothing about the API key. §14.2 |
> | Rollout (M7) | ❌ not started; `values.yaml:326` still defaults to `local` + the V3 index, which §9 mandates *even after V4 wins* |
>
> **Three things stand between the measurement and rollout, and none of them is code.** §13 Q3 — whether a
> per-query Google dependency in `/api/retrieve` with no degraded path is acceptable — is now the **only open
> decision**. `GEMINI_EMBEDDER_API_KEY` has **never been added to the cluster secret** (Task 3.2 Step 3);
> egress being open proves the network works and proves nothing about the key. And the M7 env flip is, by §9,
> a deliberate separate commit. **Everything is uncommitted**; the tree is being split into a V4-embedder
> commit and an evaluation commit, with an unrelated `service_hierarchy` change left out of both. Details in §14.3.

---

## 0. What V4 is

**V4 changes exactly one variable: the function that turns `embedded_text` into a vector.**

| | V3 (today) | V4 (this spec) |
| --- | --- | --- |
| `embedded_text` content | Hebrew template in `app/strings.py` | **identical, unchanged** |
| Embedder | local `multilingual-e5-large` (baked into the image) | **choice** of local *or* Gemini, by env var |
| Vector dimensions | 1024 | 1024 (local) / 3072 (Gemini, configurable) |
| Query/passage asymmetry | `"query: "` / `"passage: "` string prefixes | prefixes (local) / `task_type` (Gemini) |
| Embeddings index | `srm__services_retrieval_embeddings_v3_enriched` | one index **per embedder** |

Two hard requirements from the brief, restated as design constraints:

1. **R1 — The embedder is a runtime choice.** `EMBEDDING_PROVIDER=local|gemini` selects it. No code
   change, no rebuild, no branch. Instant rollback is `EMBEDDING_PROVIDER=local` + the V3 index name.
2. **R2 — Shared code stays shared; only the call into the model is split.** Text rendering, batching
   policy, skip rules, index creation, bulk storage, tracing and the score cut are **provider-blind**.
   The *only* provider-specific code is "hand these strings to this model and get vectors back",
   under `providers/local/` and `providers/gemini/`.

**Why this is worth doing.** The V3 measurement (`retrieval/README.md`) showed the 0.325 plateau was
broken embedded text, not the bi-encoder — fixing the text gave +11.4%. That closed the *text* axis
and re-opened the *model* axis, which has never been tested. `multilingual-e5-large` is a 2023
1024-dim model that **truncates every input at 512 tokens** (`sentence_bert_config.json`);
`gemini-embedding-001` takes 2048 tokens and is a materially stronger multilingual model. With the
text frozen, the eval delta between the two arms is attributable to the model alone.

**Non-goals.** No reranker. No LLM answer generation. No change to `SERVICE_EMBEDDING_TEXT_TEMPLATE`,
to the union-of-columns field reading, or to the retrieval funnel. Any of those would destroy the
single-variable comparison and belong in a separate arm.

---

## 1. The state V4 starts from

### 1.1 The whole embedder surface is 4 call sites

`retrieval/app/services/text_embedding/embedding_model.py` is 24 lines and exports 4 symbols. Every
consumer:

| Consumer | Imports | Used for |
| --- | --- | --- |
| [embed_service.py:8](retrieval/app/services/service_indexing/embed_service.py:8) | `embed_passage_text` | single-service embed (`/api/services/update`) |
| [embed_service_batch.py:5](retrieval/app/services/service_indexing/embed_service_batch.py:5) | `embed_passages_batch` | reindex batch of `SERVICE_EMBED_BATCH_SIZE` (64) |
| [retrieve_documents_with_trace.py:13](retrieval/app/services/retrieval/retrieve_documents_with_trace.py:13) | `embed_query_text` | query side of `/api/retrieve` |
| [warm_models.py:1](retrieval/app/services/startup/warm_models.py:1) | `get_embedding_model` | startup warm-up before `/health` answers |

That is the entire seam. **Nothing else in the service knows what an embedder is** — which is why R2
is cheap: the split goes behind these four names and no caller changes shape.

### 1.2 Facts that constrain the design

- **Dimensions are already dynamic.** `embed_service.py:30` and `embed_service_batch.py:25` call
  `ensure_retrieval_index_exists(len(embedding))`. Nothing hardcodes 1024. A 3072-dim provider works
  with zero changes here.
- **…but index creation is create-only.** [ensure_retrieval_index_exists.py:36](retrieval/app/services/elasticsearch/ensure_retrieval_index_exists.py:36)
  returns early if the index exists. Pointing a 3072-dim provider at the existing 1024-dim V3 index
  does **not** recreate it — it fails later, per-batch, inside `bulk()` with an ES mapping error.
  This is the #1 foot-gun of the whole change and Mission 4 exists for it.
- **Query/passage prefixes are applied in shared code today.** `embedding_model.py:14,18,23` prepend
  `EMBEDDING_PASSAGE_PREFIX` / `EMBEDDING_QUERY_PREFIX`. These are E5-specific and **must move into
  the local provider**; Gemini expresses the same asymmetry through `task_type` and must never see
  the literal string `"passage: "`.
- **Local truncates at 512 tokens.** `artifacts/retrieval-model/sentence_bert_config.json`:
  `max_seq_length: 512`, `hidden_size: 1024`, `XLMRobertaModel` — i.e. multilingual-e5-large. Long
  `embedded_text` is silently cut today.
- **The corpus is small.** 9,871 of 11,748 services are embedded (`REQUIRE_CARD_FOR_EMBEDDING=true`,
  see README). One full reindex is ~9,871 embed calls' worth of text — see §10.4 for what that costs.
- **Reindex is a serial generator.** [reindex_all_services.py:24](retrieval/app/services/service_indexing/reindex_all_services.py:24)
  loops batches of 64 one at a time; the SSE route is fragile (drive it in-process for full runs).
  A network-bound provider does not change that shape — see Task 5.2 before adding concurrency.
- **`retrieval/` is the one module that uses `vars.py` + `strings.py`.** Every new constant goes
  there, none inline. `vars.py` stays a single file even past 100 lines.

---

## 2. Target architecture

### 2.1 The seam: an `EmbeddingProvider` record of two functions

```python
class EmbeddingProvider(NamedTuple):
    name: str
    embed_documents: Callable[[list[str]], list[list[float]]]
    embed_query: Callable[[str], list[float]]
```

Shared code depends on this record and nothing else. Each provider module builds one. `lru_cache`
on the resolver keeps the local model (and the Gemini client) a process singleton, exactly as
`get_embedding_model()` does today.

Deliberately **not** in the record:

- *dimensions* — probed once at startup with a one-token embed call (§2.3), so the record stays
  declaration-free and the probe doubles as an API-key/model-present health check.
- *batch size* — the caller keeps passing `SERVICE_EMBED_BATCH_SIZE` (64) batches; each provider
  re-chunks internally to its own transport limit. Transport constraints belong to the transport.
- *a `warm()` hook* — the dimension probe already forces the model load / client construction.

### 2.2 File layout

```
retrieval/app/services/text_embedding/
├── embedding_provider_schema.py            NEW   the EmbeddingProvider NamedTuple
├── resolve_embedding_provider.py           NEW   name -> builder registry, @lru_cache
├── embed_text.py                           NEW   the 3 public functions (replaces embedding_model.py)
├── probe_embedding_dimensions.py           NEW   one probe embed -> int
├── normalize_embedding_vector.py           NEW   unit-norm helper (shared)
├── embedding_model.py                      DELETE
└── providers/
    ├── __init__.py                         NEW   (empty, like every other package here)
    ├── local/
    │   ├── __init__.py                     NEW   (empty)
    │   ├── build_local_embedding_provider.py   NEW  owns the E5 prefixes
    │   └── load_local_embedding_model.py       NEW  the old get_embedding_model body
    └── gemini/
        ├── __init__.py                     NEW   (empty)
        ├── build_gemini_embedding_provider.py  NEW  owns the task types
        ├── get_gemini_client.py                NEW  @lru_cache client, API-key check
        ├── embed_gemini_texts.py               NEW  chunk -> call -> flatten
        └── call_gemini_embed_content.py        NEW  one request + retry/backoff
```

Plus, outside `text_embedding/`:

```
retrieval/app/services/elasticsearch/
├── ensure_retrieval_index_exists.py        EDIT  write provider/model/dims into mappings `_meta`
└── assert_index_matches_provider.py        NEW   fail fast on dims or provider mismatch
retrieval/app/services/startup/warm_models.py   EDIT  provider-blind warm + the guard
```

Every file stays well under 100 lines and every function under 30. No classes (the `NamedTuple`
is a record, not behavior).

### 2.3 Runtime flow, both arms

```
                     ┌─────────────────── SHARED (provider-blind) ───────────────────┐
srm_services doc ──> build_service_texts ──> embedded_text ──> embed_passages_batch ─┼─┐
                     (strings.py templates)  (V3, FROZEN)      (embed_text.py)        │ │
                                                                                      │ │
query string     ──> embed_query_text ────────────────────────────────────────────────┼─┤
                                                                                      │ │
                     ┌────────────────────────────────────────────────────────────────┘ │
                     │        resolve_embedding_provider()  <-- EMBEDDING_PROVIDER       │
                     ├───────────────────────────┬───────────────────────────────────────┘
                     ▼                           ▼
        providers/local/               providers/gemini/
        prefix "passage: "/"query: "   task_type RETRIEVAL_DOCUMENT / RETRIEVAL_QUERY
        HuggingFaceEmbeddings          client.models.embed_content(...)
        1024 dims, 512-token cap       3072 dims (configurable), 2048-token cap
                     │                           │
                     └────────────┬──────────────┘
                                  ▼
                     ┌─────────── SHARED ───────────┐
                     │ ensure_retrieval_index_exists │  dims + `_meta{provider, model}`
                     │ bulk_store_service_embeddings │
                     │ knn / bm25 / RRF / score cut  │  all untouched
                     └───────────────────────────────┘
```

**The invariant that makes this safe:** the vectors in an index and the query vectors searching it
must come from the same provider *and* the same model *and* the same dimensionality. Cross-arm kNN
does not error — it returns confident nonsense. Mission 4 turns that silent failure into a startup
crash by stamping the provider into the index `_meta` and checking it at warm-up.

> **Correction (2026-07-30) — it is the *dimensions* check that catches cross-arm boots, not the `_meta`
> provider stamp.** This paragraph, and §6 below, read as though the provider stamp is the front-line
> defence. It is not. In the shipped `assert_index_matches_provider.py` the dimensions comparison runs
> **before** the provider comparison (`:76` vs `:81`), and because the two shipping arms differ in width —
> local 1024, gemini 3072 — the dimensions check **always fires first**. The provider branch is
> **unreachable in practice for today's providers**; exercising it at all required forcing a
> width/provider combination that cannot occur (§14.2). The boot is refused either way, which is the
> property that matters, but the stamp's real role is a **backstop for a future same-width provider
> swap**, not the primary check.

---

## 3. Mission 1 — Extract the provider seam (local only, zero behavior change)

**Goal:** the code is provider-pluggable, still runs the local model, and produces **bit-identical
vectors** to V3. No Gemini yet. This mission must be verifiable as a no-op.

### Task 1.1 — Declare the record and the registry

**Step 1.** `text_embedding/embedding_provider_schema.py` — the `EmbeddingProvider` NamedTuple from
§2.1. Nothing else in the file.

**Step 2.** `vars.py` — add the provider block. Literals are allowed only here:

```python
# Embedding provider selection. 'local' runs the bundled sentence-transformers model;
# 'gemini' calls the Google Gemini embeddings API. The vectors of the two are NOT
# interchangeable - each provider needs its own RETRIEVAL_EMBEDDINGS_INDEX_NAME.
EMBEDDING_PROVIDER_LOCAL = 'local'
EMBEDDING_PROVIDER_GEMINI = 'gemini'
EMBEDDING_PROVIDER = os.getenv('EMBEDDING_PROVIDER', EMBEDDING_PROVIDER_LOCAL).strip().lower()
```

Keep `EMBEDDING_MODEL_PATH`, `EMBEDDING_PASSAGE_PREFIX`, `EMBEDDING_QUERY_PREFIX` where they are, and
extend their comment to say **local-provider only** — Gemini ignores them.

**Step 3.** `strings.py` — add the error text and the probe text:

```python
ERROR_UNKNOWN_EMBEDDING_PROVIDER = (
    "Unknown EMBEDDING_PROVIDER '{provider}'. Supported providers: {supported}"
)
# Shortest possible Hebrew input; embedded once at startup to learn the vector width
# and to fail fast on a missing local model or a bad Gemini API key.
EMBEDDING_DIMENSION_PROBE_TEXT = 'בדיקה'
```

**Step 4.** `text_embedding/resolve_embedding_provider.py`:

```python
@lru_cache(maxsize=1)
def resolve_embedding_provider() -> EmbeddingProvider:
    builders = {
        EMBEDDING_PROVIDER_LOCAL: build_local_embedding_provider,
        EMBEDDING_PROVIDER_GEMINI: build_gemini_embedding_provider,
    }
    builder = builders.get(EMBEDDING_PROVIDER)
    if builder is None:
        raise ValueError(ERROR_UNKNOWN_EMBEDDING_PROVIDER.format(
            provider=EMBEDDING_PROVIDER, supported=', '.join(builders)))
    return builder()
```

The `builders` dict is the *only* place both providers are named together. Adding a third provider
later is one dict entry plus one folder.

> **Note on imports.** Both builders are imported at module top (house rule: all imports at the top),
> so `providers/gemini/` is imported even when `EMBEDDING_PROVIDER=local`. Keep the `google.genai`
> import inside `get_gemini_client.py` and make `build_gemini_embedding_provider` import only the
> functions — no module-level client construction, no module-level API-key check. Then a local-only
> deployment imports the SDK and does nothing with it. `google-genai` is a small pure-Python package,
> so this costs milliseconds; if you ever build a slim gemini-free image, that is the one place that
> would need a guard.

### Task 1.2 — Move the local model behind the provider

**Step 1.** `providers/local/load_local_embedding_model.py` — the body of today's
`get_embedding_model`, unchanged, `@lru_cache(maxsize=1)` intact:

```python
@lru_cache(maxsize=1)
def load_local_embedding_model() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_PATH)
```

**Step 2.** `providers/local/build_local_embedding_provider.py` — this file, and only this file, owns
the E5 prefixes:

```python
def embed_local_documents(texts: list[str]) -> list[list[float]]:
    return load_local_embedding_model().embed_documents(
        [EMBEDDING_PASSAGE_PREFIX + text for text in texts])


def embed_local_query(text: str) -> list[float]:
    return load_local_embedding_model().embed_query(EMBEDDING_QUERY_PREFIX + text)


def build_local_embedding_provider() -> EmbeddingProvider:
    return EmbeddingProvider(
        name=EMBEDDING_PROVIDER_LOCAL,
        embed_documents=embed_local_documents,
        embed_query=embed_local_query,
    )
```

⚠️ **Preserve the `embed_documents` vs `embed_query` split exactly as V3 has it.** V3's
`embed_passage_text` (single service, `/api/services/update`) calls `embed_query` on the
`"passage: "`-prefixed text, while `embed_passages_batch` calls `embed_documents`. For
sentence-transformers these are the same math, so collapsing single-text passage embedding onto
`embed_documents([text])[0]` is safe **and** removes a real inconsistency. Do it — but verify with
Step 1.3.2 that the vector is unchanged, and do not do it as an unverified drive-by.

### Task 1.3 — Rewrite the shared entry points

**Step 1.** `text_embedding/embed_text.py` — the three public functions, now prefix-free:

```python
def embed_passage_text(text: str) -> list[float]:
    return resolve_embedding_provider().embed_documents([text])[0]


def embed_passages_batch(texts: list[str]) -> list[list[float]]:
    return resolve_embedding_provider().embed_documents(texts)


def embed_query_text(text: str) -> list[float]:
    return resolve_embedding_provider().embed_query(text)
```

**Step 2.** `text_embedding/probe_embedding_dimensions.py`:

```python
def probe_embedding_dimensions(provider: EmbeddingProvider) -> int:
    return len(provider.embed_query(EMBEDDING_DIMENSION_PROBE_TEXT))
```

**Step 3.** `text_embedding/normalize_embedding_vector.py` — shared, used by the Gemini provider in
Mission 2 (see §10.3 for why it is needed there and harmless here):

```python
def normalize_embedding_vector(vector: list[float]) -> list[float]:
    magnitude = sqrt(sum(value * value for value in vector))
    if magnitude == 0.0:
        return vector
    return [value / magnitude for value in vector]
```

**Step 4.** Update the 4 call sites from §1.1 to import from `embed_text` instead of
`embedding_model`. `warm_models.py` becomes provider-blind:

```python
def warm_models() -> None:
    provider = resolve_embedding_provider()
    assert_index_matches_provider(provider.name, probe_embedding_dimensions(provider))
```

(`assert_index_matches_provider` lands in Mission 4; until then, warm is
`probe_embedding_dimensions(resolve_embedding_provider())` and discards the result.)

**Step 5.** Delete `text_embedding/embedding_model.py`. Grep for `embedding_model` and
`get_embedding_model` across `retrieval/` — there must be **zero** hits outside the deleted file.

### Task 1.4 — Prove Mission 1 is a no-op

**Step 1.** Boot the service with no `.env` change. `/health` answers; the startup log is unchanged.

**Step 2.** Vector-identity check, on a real service, against the live V3 index:

```bash
PYTHONUTF8=1 venv/Scripts/python -c "from app.services.elasticsearch.fetch_service_by_id import fetch_service_by_id; from app.services.service_indexing.build_service_texts import build_service_texts; from app.services.text_embedding.embed_text import embed_passage_text; from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client; from app.vars import RETRIEVAL_EMBEDDINGS_INDEX_NAME as I; sid='<known-service-id>'; t,_=build_service_texts(fetch_service_by_id(sid)); new=embed_passage_text(t); old=get_elasticsearch_client().get(index=I, id=sid)['_source']['embedding']; print(len(new), len(old), max(abs(a-b) for a,b in zip(new,old)))"
```

**Pass = `1024 1024` and a max absolute difference `< 1e-6`.** A larger delta means the prefix move
or the `embed_documents`/`embed_query` collapse changed the math — fix before Mission 2.

**Step 3.** `POST /api/retrieve` with a golden-set query; the returned `services` and their
`semantic_score`s match a pre-refactor run of the same query. Keep both JSON responses; diff them.

---

## 4. Mission 2 — The Gemini provider

**Goal:** `EMBEDDING_PROVIDER=gemini` produces 3072-dim vectors for passages and queries, with the
right task types, retries, and internal chunking. Nothing outside `providers/gemini/` changes.

### Task 2.1 — Dependency and configuration

**Step 1.** `requirements.txt` — add under a new section, keeping the existing lockstep comment
untouched:

```
# Gemini embeddings provider (only used when EMBEDDING_PROVIDER=gemini).
# Independent of the HF stack above - do NOT let installing it move
# transformers/tokenizers/sentence-transformers.
google-genai==<pin>
```

Resolve `<pin>` at implementation time: install into the existing venv, then
`venv/Scripts/pip show google-genai` for the version and `pip check` to confirm the HF stack and
`fastapi`/`pydantic` were not disturbed. Record the pin in the same commit.

> **Correction (2026-07-29) — the key's env var is `GEMINI_EMBEDDER_API_KEY`, not `GEMINI_API_KEY`.**
> This document originally said `GEMINI_API_KEY` throughout. The name actually set in `retrieval/.env`
> and implemented in `vars.py` is **`GEMINI_EMBEDDER_API_KEY`**, and every occurrence below (§4, §5, §9,
> §10.6, §11, §13) has been corrected to it. The Python constant in `vars.py` carries the same name. The
> one exception is the `strings.py` constant **`ERROR_MISSING_GEMINI_API_KEY`**, which keeps its original
> identifier — only the message text it holds was updated to name the new var.

**Step 2.** `vars.py` — the Gemini block:

```python
# Gemini embeddings (EMBEDDING_PROVIDER=gemini). The key is a secret and has no default.
GEMINI_EMBEDDER_API_KEY = os.getenv('GEMINI_EMBEDDER_API_KEY', '')
GEMINI_EMBEDDING_MODEL = os.getenv('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001')
# Native width is 3072. The model is Matryoshka-trained, so 1536 / 768 are valid truncations
# that trade a little quality for index size - but any change here is a NEW index, not a
# re-tune of an existing one. Truncated outputs are not unit-norm and are re-normalized.
GEMINI_EMBEDDING_DIMENSIONS = int(os.getenv('GEMINI_EMBEDDING_DIMENSIONS', '3072'))
# Gemini's asymmetric-retrieval task types; the E5 text prefixes are NOT used with Gemini.
GEMINI_DOCUMENT_TASK_TYPE = 'RETRIEVAL_DOCUMENT'
GEMINI_QUERY_TASK_TYPE = 'RETRIEVAL_QUERY'
# Texts per API request. SERVICE_EMBED_BATCH_SIZE (64) is the reindex batch; the provider
# re-chunks it to this, so the two knobs are independent.
GEMINI_EMBED_REQUEST_BATCH_SIZE = int(os.getenv('GEMINI_EMBED_REQUEST_BATCH_SIZE', '32'))
# Retry policy for 429/5xx. Exponential: base * 2**(attempt - 1) seconds.
GEMINI_EMBED_MAX_ATTEMPTS = int(os.getenv('GEMINI_EMBED_MAX_ATTEMPTS', '5'))
GEMINI_EMBED_RETRY_BASE_SECONDS = float(os.getenv('GEMINI_EMBED_RETRY_BASE_SECONDS', '2.0'))
```

**Step 3.** `strings.py`:

```python
ERROR_MISSING_GEMINI_API_KEY = 'EMBEDDING_PROVIDER is gemini but GEMINI_EMBEDDER_API_KEY is not set'
ERROR_GEMINI_EMBED_FAILED = 'Gemini embedding request failed after {attempts} attempts: {error}'
GEMINI_EMBED_RETRY_MESSAGE = 'Gemini embed attempt {attempt}/{attempts} failed ({error}); retrying in {delay}s'
```

**Step 4.** `.env.example` — mirror every new var with its comment. `GEMINI_EMBEDDER_API_KEY=` stays empty.

### Task 2.2 — The client

`providers/gemini/get_gemini_client.py`:

```python
@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
    if not GEMINI_EMBEDDER_API_KEY:
        raise ValueError(ERROR_MISSING_GEMINI_API_KEY)
    return genai.Client(api_key=GEMINI_EMBEDDER_API_KEY)
```

The key check lives **here**, not at import time — so a `local` deployment with no key never trips
it, and a `gemini` deployment with no key fails at warm-up with a readable message (§3, warm probe).

### Task 2.3 — One request, with retries

`providers/gemini/call_gemini_embed_content.py` — the only file that touches the SDK's request shape:

```python
def build_embed_config(task_type: str) -> types.EmbedContentConfig:
    return types.EmbedContentConfig(
        task_type=task_type,
        output_dimensionality=GEMINI_EMBEDDING_DIMENSIONS,
    )


def request_gemini_embeddings(texts: list[str], task_type: str) -> list[list[float]]:
    response = get_gemini_client().models.embed_content(
        model=GEMINI_EMBEDDING_MODEL,
        contents=texts,
        config=build_embed_config(task_type),
    )
    return [normalize_embedding_vector(embedding.values) for embedding in response.embeddings]


def call_gemini_embed_content(texts: list[str], task_type: str) -> list[list[float]]:
    for attempt in range(1, GEMINI_EMBED_MAX_ATTEMPTS + 1):
        try:
            return request_gemini_embeddings(texts, task_type)
        except Exception as error:            # noqa: BLE001 - retry boundary, see below
            if attempt == GEMINI_EMBED_MAX_ATTEMPTS:
                raise RuntimeError(ERROR_GEMINI_EMBED_FAILED.format(
                    attempts=attempt, error=error)) from error
            delay = GEMINI_EMBED_RETRY_BASE_SECONDS * 2 ** (attempt - 1)
            get_terminal_logger().warning(GEMINI_EMBED_RETRY_MESSAGE.format(
                attempt=attempt, attempts=GEMINI_EMBED_MAX_ATTEMPTS, error=error, delay=delay))
            sleep(delay)
```

Three notes:

- **This is the one sanctioned `try/except` in the embedding path.** The house rule bans `try/catch`
  in low-level functions; a retry boundary around a network call is the documented exception, and it
  is confined to this single function. Everything below and above it lets errors propagate.
- **Retry on everything, don't classify.** Narrowing to `genai.errors.ClientError` status codes means
  tracking the SDK's exception taxonomy across versions. Retrying 5× with backoff on any exception is
  correct for a bad key too — it just fails 30 seconds later with the same readable message. If you
  want the fast path, add an explicit "do not retry on 400/401/403" check, not a broad rewrite.
- **`response.embeddings` order matches `contents` order.** The provider relies on this to zip
  vectors back to services. Assert it once in Task 2.5 rather than trusting it forever.

### Task 2.4 — Chunk, call, flatten

`providers/gemini/embed_gemini_texts.py`:

```python
def embed_gemini_texts(texts: list[str], task_type: str) -> list[list[float]]:
    chunks = chunk_iterable(texts, GEMINI_EMBED_REQUEST_BATCH_SIZE)
    return [vector for chunk in chunks for vector in call_gemini_embed_content(chunk, task_type)]
```

Reuse the existing `chunk_iterable` from `app/services/service_indexing/chunk_iterable.py` — it is
already generic. *Optional cleanup:* move it to `app/services/iteration/chunk_iterable.py` and update
its one other importer (`reindex_all_services.py`), so a generic helper does not live under a domain
folder. Skip if you would rather not touch Mission 5's file.

`providers/gemini/build_gemini_embedding_provider.py` — owns the task types, mirroring how the local
builder owns the prefixes:

```python
def embed_gemini_documents(texts: list[str]) -> list[list[float]]:
    return embed_gemini_texts(texts, GEMINI_DOCUMENT_TASK_TYPE)


def embed_gemini_query(text: str) -> list[float]:
    return embed_gemini_texts([text], GEMINI_QUERY_TASK_TYPE)[0]


def build_gemini_embedding_provider() -> EmbeddingProvider:
    return EmbeddingProvider(
        name=EMBEDDING_PROVIDER_GEMINI,
        embed_documents=embed_gemini_documents,
        embed_query=embed_gemini_query,
    )
```

### Task 2.5 — Verify the provider in isolation, before any indexing

Set `EMBEDDING_PROVIDER=gemini` and `GEMINI_EMBEDDER_API_KEY=...` in `retrieval/.env`. Do **not** touch
`RETRIEVAL_EMBEDDINGS_INDEX_NAME` yet.

**Step 1 — width and norm.**

```bash
PYTHONUTF8=1 venv/Scripts/python -c "from app.services.text_embedding.embed_text import embed_query_text; v=embed_query_text('סיוע משפטי לניצולי שואה'); print(len(v), sum(x*x for x in v)**0.5)"
```

Pass = `3072` and a norm of `1.0` (±1e-6).

**Step 2 — batch order.** Embed `['אלף', 'בית', 'גימל']` via `embed_passages_batch`, then embed each
one alone. Each batched vector must match its solo vector (max abs diff `< 1e-4`; the API is not
guaranteed bit-reproducible, so this is a *correspondence* check, not an identity check). **If the
pairing is off, `embed_service_batch` would attach every vector to the wrong service** — a failure
that produces a working-looking index full of scrambled embeddings. This step is not optional.

**Step 3 — asymmetry is live.** For a golden-set query and its known-relevant service's
`embedded_text`, compute cosine with the correct task types, then again with both sides as
`RETRIEVAL_DOCUMENT`. If the two vectors are **identical**, `task_type` is not reaching the API —
check the config object, not the prompt. That check is still valid.

> **Correction (2026-07-29) — the acceptance criterion was wrong.** This step used to say "the
> correct-task-type cosine should be the higher of the two." It is not, and it should not be expected to
> be: **absolute cosines are not comparable across task-type combinations**, because a same-task-type
> pair sits in a shared subspace and gets a uniformly inflated baseline. Measured on a real
> query/service pair: `QUERY↔DOCUMENT` = **0.7153**, `DOCUMENT↔DOCUMENT` = **0.8087**. Read naively,
> the old criterion fails on a correctly-configured client.
>
> **The right test is the discrimination margin**, since that — not the absolute value — is what kNN
> ranking depends on. Embed one *relevant* and one *irrelevant* service against the same query and
> compare `(relevant − irrelevant)` cosine under each configuration. Measured: correct pairing
> **+0.0979** vs same-task-type **+0.0647** — the correct pairing gives a **51% larger** margin.
> **Pass = the correct pairing's margin is the larger one.**

**Step 4 — Hebrew round trip.** Confirm the request body carries the Hebrew intact (`PYTHONUTF8=1`
is mandatory for any piped Python here — mojibake shows up as a plausible-but-wrong vector, not an
error).

**Step 5 — token headroom.** Measure the length distribution of `embedded_text` over a few hundred
services and record p50/p95/max. Two thresholds matter: **512 tokens** (where the local model
truncates today) and **2048 tokens** (Gemini's limit). If any service exceeds 2048 tokens, decide the
policy now — §10.2 — rather than discovering it as a mid-reindex failure.

---

## 5. Mission 3 — Configuration, secrets, deployment

### Task 3.1 — Local `.env`

Two switchable blocks, documented as a pair. Switching the provider **without** switching the index
name is the mistake this comment exists to prevent:

```bash
# --- Arm: local (V3) ---
EMBEDDING_PROVIDER=local
RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v3_enriched

# --- Arm: gemini (V4) ---
# EMBEDDING_PROVIDER=gemini
# GEMINI_EMBEDDER_API_KEY=
# RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v4_gemini
```

### Task 3.2 — Kubernetes

**Step 1.** `Infra/secrets.template.yaml` — under `secrets:`, a new section:

```yaml
  # --- Retrieval embeddings (only needed when EMBEDDING_PROVIDER=gemini) ---
  GEMINI_EMBEDDER_API_KEY: ""
```

**Step 2.** `Infra/values.yaml`, `retrieval.env` — add `EMBEDDING_PROVIDER: "local"` next to
`EMBEDDING_MODEL_PATH`, and extend the existing `RETRIEVAL_EMBEDDINGS_INDEX_NAME` comment (values.yaml
line ~305) to say the index must be bumped **whenever the provider changes**, for exactly the reason
it already gives for text changes: `/api/services/update` writes one service at a time and would mix
1024-dim and 3072-dim documents in one index.

**Step 3.** Wire `GEMINI_EMBEDDER_API_KEY` into the retrieval deployment from the existing secret, following
whatever pattern `ELASTIC_PASS` already uses in `Infra/templates/` — do not introduce a second
mechanism, and never put the key in `values.yaml`.

**Step 4.** Keep **one image** with the local model still baked in. That is what makes R1's rollback
an env-var flip rather than a redeploy. Do not add a slim gemini-only image in this spec; note it as
a follow-up once the arm is chosen (it would drop torch + the 2.2 GB model and let
`retrieval.resources` fall well below the current 3–6 GiB).

**Step 5.** If the cluster egress is restricted, allow `generativelanguage.googleapis.com:443` from
the retrieval pod. Verify before the first cluster-side reindex — a blocked egress surfaces as 5
retries then a failed batch.

### Task 3.3 — Documentation

`retrieval/README.md` — a new **Embedding providers** section directly after **Embedded text**:
the two providers, their dims/token caps/asymmetry mechanism, the "one index per provider" rule, the
env block for each arm, and the rollback procedure. Update the Setup section: the local model is
required for `local` and irrelevant for `gemini`. `copy_retrieval_indices.sh`'s default
`EMBEDDINGS_INDEX` already reads from the env; note in the README that it must be set per arm.

---

## 6. Mission 4 — Make a provider/index mismatch impossible

This mission is why V4 does not corrupt an index. Do not defer it.

### Task 4.1 — Stamp the provider into the index

`ensure_retrieval_index_exists.py` — add `_meta` to the mappings:

```python
def build_retrieval_index_mappings(embedding_dimensions: int) -> dict:
    return {
        '_meta': {
            'embedding_provider': EMBEDDING_PROVIDER,
            'embedding_model': resolve_embedding_model_identifier(),
            'embedding_dimensions': embedding_dimensions,
        },
        'properties': { ... unchanged ... },
    }
```

`resolve_embedding_model_identifier()` returns `EMBEDDING_MODEL_PATH` for local and
`GEMINI_EMBEDDING_MODEL` for gemini — one small function, next to the registry in
`resolve_embedding_provider.py`, keyed off the same var. The `_meta` key names go in `vars.py`.

No signature change, so `embed_service.py` and `embed_service_batch.py` are untouched.

### Task 4.2 — Check it at startup

`elasticsearch/assert_index_matches_provider.py`:

```python
def assert_index_matches_provider(provider_name: str, embedding_dimensions: int) -> None:
    client = get_elasticsearch_client()
    if not client.indices.exists(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME):
        return                                    # fresh arm; created on first embed
    mappings = client.indices.get_mapping(index=RETRIEVAL_EMBEDDINGS_INDEX_NAME)
    ...  # compare stored dims and provider against the arguments; raise on mismatch
```

Rules:

- Index absent → return. A fresh arm legitimately starts empty.
- Stored `dims` on the `embedding` field ≠ probed dimensions → **raise** `ERROR_INDEX_DIMENSIONS_MISMATCH`.
- `_meta.embedding_provider` present and ≠ `provider_name` → **raise** `ERROR_INDEX_PROVIDER_MISMATCH`.
- `_meta` **absent** → log a warning and continue. The existing V3 index predates `_meta`; the dims
  check still catches the dangerous case, and refusing to boot against V3 would break rollback.

Call it from `warm_models` (Task 1.3, Step 4). The service then refuses to start when the index and
the provider disagree, instead of serving nonsense or failing per-batch inside `bulk()`.

**Verify:** point `EMBEDDING_PROVIDER=gemini` at the V3 index and boot. Expect a startup crash naming
both dimensions. Then point it at the V4 name and boot clean.

> **Correction (2026-07-30) — the rule order above is the *listed* order, not the *effective* one.** The
> four rules read as peers; they are not. The shipped check order in
> `retrieval/app/services/elasticsearch/assert_index_matches_provider.py` is `indices.exists` (`:72`) →
> **dimensions** (`:76`) → `_meta` read (`:77`) → `_meta`-absent warn-and-return (`:78-80`) → **provider**
> (`:81`). So the dimensions rule pre-empts the provider rule for every provider pair that differs in
> width, which is both of today's arms. The realistic misconfiguration — `local` at its true 1024 width
> pointed at the V4 index — raises `ERROR_INDEX_DIMENSIONS_MISMATCH` ("stores 3072 … produces 1024"), never
> `ERROR_INDEX_PROVIDER_MISMATCH`. Getting the provider branch to execute required forcing
> `probed_dimensions=3072` alongside `provider_name='local'`; it then raised correctly, naming stored
> `'gemini'` against active `'local'` (§14.2). **Do not read the provider stamp as the guard that saves the
> index** — the dimension guard does that today. The stamp earns its keep only when a future provider
> produces the same width as an existing index. The index-absent rule was also confirmed: it returns
> cleanly and does **not** auto-create the index.

---

## 7. Mission 5 — Build the V4 index

### Task 5.1 — Dry run

`EMBEDDING_PROVIDER=gemini`, `RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v4_gemini`,
then reindex with `limit: 50`. Check:

- the index was created with `dims: 3072`, `similarity: cosine`, and the `_meta` block;
- 50 documents present, each with a 3072-float `embedding`;
- **`embedded_text` matches the V3 index's `embedded_text` for the same `service_id`, exactly.** This
  is the frozen-text guarantee from §0. Compare hashes over the overlap:

```bash
PYTHONUTF8=1 venv/Scripts/python compare_arm_texts.py
```

where `compare_arm_texts.py` (a throwaway script, not a committed file) is:

```python
from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client

V3_INDEX = 'srm__services_retrieval_embeddings_v3_enriched'
V4_INDEX = 'srm__services_retrieval_embeddings_v4_gemini'

client = get_elasticsearch_client()
hits = client.search(index=V4_INDEX, size=50, source=['embedded_text'])['hits']['hits']
mismatched = []
for hit in hits:
    v3_document = client.get(index=V3_INDEX, id=hit['_id'], ignore=[404])
    if not v3_document.get('found'):
        continue                      # not in the V3 arm; nothing to compare
    if v3_document['_source']['embedded_text'] != hit['_source']['embedded_text']:
        mismatched.append(hit['_id'])
print('compared:', len(hits), 'mismatched:', len(mismatched), mismatched[:5])
```

**Any mismatch means the arms are not comparable** — stop and find what changed the rendering.

### Task 5.2 — Full reindex

Drive the generator **in-process**, not through the SSE endpoint (the SSE reindex dies on any
client/server hiccup — see the reindex-is-connection-driven note; a full run is long enough that this
matters). Iterate `reindex_all_services()` from a script and print its progress events.

Expected throughput is the open question. Local runs ~1.2–1.4 services/s (CPU-bound). Gemini is
network-bound: 9,871 services ÷ 32 texts per request ≈ **309 requests**, so wall-clock is
`309 × per-request latency` plus retries. Measure the `limit: 50` run first and extrapolate.

**Do not add concurrency preemptively.** Only if the serial run is unacceptably slow, add a bounded
concurrency var and parallelize at the *request* level inside `embed_gemini_texts` — never at the
batch level, which would break the vector↔service pairing that Task 2.5 Step 2 protects. Note that
`REQUIRE_CARD_FOR_EMBEDDING` snapshots the card set at start, and `resume: true` skips services
already in the index, so an interrupted run is resumable either way.

### Task 5.3 — Post-index sanity

- Document count matches the local arm's count for the same selection rules (~9,871).
- `POST /api/retrieve` on 3–5 golden-set queries returns sane Hebrew services, and the reported
  `cosine_score`s are in a plausible range.
- **Record the cosine distribution.** `retrieval/README.md`'s score-cut tuning table (best/10th/50th
  cosine) is measured on multilingual-e5-large, whose range is *very* compressed. Gemini's range will
  differ, so **every truncation threshold in `.env` is invalid for the V4 arm until re-measured**. Run
  the same measurement and add a V4 column to that table. Until then keep all cutoffs at their
  off-defaults so the arm comparison is not confounded by a stale threshold.

---

## 8. Mission 6 — Evaluate the two arms

The `evaluation/` service talks to retrieval over HTTP only (`RETRIEVAL_BASE_URL`,
`evaluation/clients/retrieval_client.py`), so **no evaluation code changes**. An arm is a retrieval
`.env` + a restart.

### Task 6.1 — Run both arms

Identical retrieval config except provider and index name; same golden set; same
`CANDIDATE_POOL_SIZE`, weights, and cutoffs.

| Arm | `EMBEDDING_PROVIDER` | Index | Results dir |
| --- | --- | --- | --- |
| A (incumbent) | `local` | `..._v3_enriched` | `evaluation/results-arm3-v3-local/` |
| B (V4) | `gemini` | `..._v4_gemini` | `evaluation/results-arm4-v4-gemini/` |

Restart retrieval between arms — `resolve_embedding_provider` is `lru_cache`d for the process
lifetime, so an in-place `.env` edit does nothing until restart. That is deliberate (no per-request
provider switching), but it is easy to forget: **confirm the arm from `/health` or the startup log
before trusting a result**. If you cannot tell the arms apart from a log line, add the provider name
to the startup message — a one-line change worth making.

### Task 6.2 — Read the result honestly

- The headline is `overall_score`, but check all 35 metric cells: the V3 text change moved *every*
  cell, which is what made it trustworthy. A mixed result (recall up, precision down) means a
  threshold-tuning job on the V4 arm (Task 5.3), not a verdict on the model.
- **Ground truth is the incumbent site's own output**, so absolute numbers understate quality. Use
  the A↔B delta, never arm B's absolute value.
- Reference points from V3: incumbent text `0.2990` → org-name union `0.3166` → full V3 `0.3331`.
  A model change should be judged against that `0.3331`.

### Task 6.3 — Decide

Write the outcome into `retrieval/README.md` next to the V3 measurement — same format, so the two
axes (text, model) are legible side by side. Include the cost line from §10.4 next to the score
delta: a small gain that adds a per-query API dependency is a different decision from a large one.

---

## 9. Mission 7 — Rollout and rollback

- **Default `EMBEDDING_PROVIDER=local` in `Infra/values.yaml`** even after V4 wins. Flip it in a
  deliberate commit alongside the index name — never as a side effect of another change.
- **Rollback = two env vars** (`EMBEDDING_PROVIDER=local`, V3 index name) and a pod restart. Keep the
  V3 index until the V4 arm has run in production for a full week. There is no delete endpoint;
  dropping an index is a manual, deliberate act.
- **Availability changes shape.** Under `gemini`, `/api/retrieve` gains a per-query external network
  dependency: an outage means no semantic retrieval (BM25 still answers, but `embed_query_text` raises
  before the hybrid search runs, so the request 500s). Decide explicitly whether that is acceptable, or
  whether a later mission adds a lexical-only degraded path. **This spec does not add one** — flagging
  it rather than silently widening scope.
- **The API key is a new secret in the request path.** It is never logged; `call_gemini_embed_content`
  logs only the exception text on retry. Confirm the SDK's error strings do not echo the key before
  shipping the retry logger.

---

## 10. Reference appendix

### 10.1 The two providers side by side

| | local (V3) | gemini (V4) |
| --- | --- | --- |
| Model | `multilingual-e5-large` (`artifacts/retrieval-model`) | `gemini-embedding-001` |
| Native dims | 1024 | 3072 (MRL-truncatable to 1536 / 768) |
| Input cap | **512 tokens**, silently truncated | 2048 tokens |
| Asymmetry | `"query: "` / `"passage: "` prefixes | `task_type=RETRIEVAL_QUERY` / `RETRIEVAL_DOCUMENT` |
| Unit-norm output | yes | yes at 3072; **no** when truncated — re-normalize |
| Cost | CPU + ~3 GiB RAM in-pod | per input token, network round trip |
| Failure mode | pod OOM / slow CPU | 429, 5xx, egress block, bad key |
| Batch limit | memory only | per-request content and token limits (§10.5) |

Verify the model id, dimension options, token cap and task-type names against Google's current
embeddings docs at implementation time — the SDK surface and the model list both move.

### 10.2 The 512 → 2048 token jump

This is a real, un-asked-for behavior change riding along with the provider swap, and it must be
named: the local arm has been embedding a **truncated** `embedded_text` for every long service, while
Gemini will see (up to) 4× more of it. If arm B wins, part of the win may be "more text got embedded"
rather than "better model." Task 2.5 Step 5 measures the affected fraction, which is what makes the
result interpretable.

> **Measured (2026-07-29) — the confound is quantified and small.** Task 2.5 Step 5 was run over the
> **full** live V3 corpus (9,871 documents), not a sample. `embedded_text` is p50 **432** characters,
> p95 **596**, p99 **753**, max **4,906**; in E5 tokens, p50 **137**, p95 **190**, max **1,739**.
>
> **27 of 9,871 services (0.27%)** exceed the local model's 512-token cap and are being silently
> truncated today. **Zero** exceed Gemini's 2,048-token cap. So the headroom change can affect at most
> a quarter of a percent of the corpus, the "let the API truncate" policy below never fires, and a
> gemini-arm win cannot be attributed to "more text got embedded". **Caveat:** the token counts use the
> **E5 tokenizer as a proxy**, not Gemini's — the 2,048 headroom is large enough relative to the
> observed max (1,739) that tokenizer differences do not change the conclusion, but they are not
> zero either.

Policy for services whose `embedded_text` exceeds 2048 tokens: **let the API truncate**, matching
today's local behavior, and record how many services are affected. Do not add a code-level truncator
or summarizer — if long services turn out to be a real problem, that is a *text* change (a V5 arm on
`SERVICE_EMBEDDING_TEXT_TEMPLATE`), and mixing it into V4 destroys the single-variable comparison.

### 10.3 Dimensions and normalization

Keep `GEMINI_EMBEDDING_DIMENSIONS=3072` for the first arm: it is the model's native, normalized
output, so it is the cleanest measurement. Index cost is trivial at this corpus size —
`9,871 × 3072 × 4 bytes ≈ 121 MB` of raw vectors, well inside the pod's 3–6 GiB.

Reach for 1536 only if ES heap becomes a problem, and treat it as a **third arm with its own index**,
not a tweak. Two notes if you do: Google documents truncated outputs as *not* unit-normalized, which
is why `normalize_embedding_vector` is applied unconditionally in `request_gemini_embeddings`; and ES
`similarity: cosine` normalizes internally anyway, so normalization does not change kNN ranking — it
keeps the `cosine_score` math in `attach_cosine_scores` honest and leaves `dot_product` available as
a future option. ES 8.x caps indexed `dense_vector` at 4096 dims, so 3072 is fine.

### 10.4 Cost

One-time full reindex: `9,871 services × (tokens per embedded_text) × (price per input token)`.

> **Measured (2026-07-29).** A 400-document sample gives a mean of **134.2 tokens per service**
> (E5 tokenizer), so a full reindex is **≈ 1.33M input tokens** for 9,871 services. That is the number
> to multiply by the live price. **Verify the current per-input-token price on Google's pricing page
> before committing** — deliberately no dollar figure is recorded here, in this document or anywhere in
> the repo, because it moves.

Steady state is two much smaller streams: one embed per `/api/services/update` (ETL-driven), and one
short embed per `/api/retrieve` query. Queries are tiny; the reindex dominates. If cost ever does
matter, Gemini's asynchronous batch embedding path is discounted relative to the synchronous one and
suits a full reindex well — a follow-up lever, deliberately out of scope here.

### 10.5 Rate limits and retries

Per-minute request and token quotas depend on the tier the key sits in, and the free tier is far
tighter than paid. Read the live quota page for the actual numbers — the retry policy is designed so
they are not load-bearing: 5 attempts with 2s/4s/8s/16s backoff absorbs ordinary 429s, and a serial
reindex at ~309 requests keeps the request rate low by construction. If the run trips sustained 429s,
raise `GEMINI_EMBED_RETRY_BASE_SECONDS` before touching concurrency.

### 10.6 Vertex AI instead of an API key

`google-genai` also speaks to Vertex AI (`GOOGLE_GENAI_USE_VERTEXAI=true` + project/location, service
account credentials instead of an API key). The ETL already carries a GCP service account
(`ETL_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`), so if the org prefers no long-lived API keys, this is the
path — same SDK, same call, different client construction. It is **one extra branch in
`get_gemini_client.py`** and nothing else, but it is out of scope for V4: pick it up only if the API
key is rejected on policy grounds.

---

## 11. Risks

| # | Risk | Consequence | Mitigation |
| --- | --- | --- | --- |
| 1 | Gemini vectors written into the V3 index | Silent mixed-dimension index, or per-batch `bulk()` mapping errors | Mission 4: `_meta` stamp + startup assert. Index name paired with provider in every config block. |
| 2 | Query embedded by one provider, index built by the other | kNN returns confident nonsense — **no error anywhere** | Mission 4 assert; arm confirmed from the startup log (Task 6.1) |
| 3 | Batch response order not preserved | Every vector attached to the wrong service; index looks healthy | Task 2.5 Step 2; no batch-level concurrency (Task 5.2) |
| 4 | V3 truncation vs V4 headroom confounds the result | "Better model" conclusion that is really "more text" | **Measured and closed (2026-07-29): 0.27% (27 of 9,871) exceed 512 tokens, zero exceed 2,048** — the confound is bounded at a quarter of a percent of the corpus. E5 tokenizer used as a proxy for Gemini's. §10.2 |
| 5 | Stale score-cut thresholds carried into arm B | Arm B looks worse for threshold reasons, not model reasons | Task 5.3: cutoffs stay off until the V4 cosine range is measured |
| 6 | `google-genai` install moves the HF stack | Reindex breaks with the tokenizer `TextEncodeInput` error the requirements comment warns about | **Measured and closed (2026-07-30): `google-genai==2.14.0` pinned in its own `requirements.txt` block and the HF stack did not move** — `transformers 5.14.0`, `tokenizers 0.22.2`, `sentence-transformers 5.6.0`, `numpy 2.5.1`. `python -m pip check` → *No broken requirements found.* §14.2 |
| 7 | Retrieval gains a per-query external dependency | Gemini outage 500s `/api/retrieve` | **Named and still open (§13 Q3).** §9 requires the availability trade to be decided explicitly; this spec deliberately does not decide it and adds no degraded path. §14.3 |
| 8 | API key leaked into logs or the image | Credential exposure | **Audited and closed (2026-07-30): the key cannot reach a log line.** In the installed SDK it travels as a header only (`google/genai/_api_client.py:798`); grepping `google/genai/*.py` for `?key=`, `&key=`, `params['key']` returns **zero** hits, so the URL-key path does not exist in 2.14.0. `errors.py` builds messages from response data only (`:66`) and contains **zero** references to `headers`; a sentinel fake key was absent from `str()` and `repr()` through both a 401 JSON error and a 503 HTML error. `call_gemini_embed_content.py:41-45` formats only `{error}`. Secret placement clean — §14.2 |
| 9 | Cluster egress blocked to `generativelanguage.googleapis.com` | Every batch fails after 5 retries | **Probed and closed (2026-07-30): egress is open from inside the retrieval pod.** DNS resolves, TCP connects, TLS **validates** (TLSv1.3, issuer CN `WR2`), and Google's frontend answers `403 PERMISSION_DENIED` to an unauthenticated call — a 403 proves the request reached Google. No proxy env vars; **no NetworkPolicy in the `default` namespace**. Reproduced independently. **Network only — not the key.** §14.2 |
| 10 | Text drifts between arms | The comparison measures nothing | Task 5.1 hash check over the overlapping `service_id`s |

---

## 12. Convention checklist

Check before each commit:

- [ ] Every new file has exactly one purpose; none exceeds 100 lines.
- [ ] Every function is an arrow-equivalent pure function under 30 lines; no classes (the
      `NamedTuple` is a record).
- [ ] No `try/except` anywhere in the embedding path **except** `call_gemini_embed_content`, which is
      the documented network-retry boundary.
- [ ] No hardcoded strings outside `vars.py` / `strings.py` — including task types, model ids, `_meta`
      key names, the probe text, and every error message.
- [ ] All imports at the top of the file. No `require`-style lazy imports.
- [ ] `vars.py` stays a single file.
- [ ] Names are long and informative (`build_gemini_embedding_provider`, not `mk_gemini`).
- [ ] `.env.example`, `Infra/values.yaml`, `Infra/secrets.template.yaml` and `retrieval/README.md`
      updated in the **same commit** as the vars they document.
- [ ] `PYTHONUTF8=1` on every piped Python invocation that touches Hebrew.
- [ ] `RETRIEVAL_EMBEDDINGS_INDEX_NAME` changed in the same commit as anything that changes what a
      vector means — provider, model, or dimensions.

---

## 13. Open questions for the owner

1. **API key or Vertex AI service account?** (§10.6.) Default assumption in this spec: API key.
2. **`GEMINI_EMBEDDING_DIMENSIONS` — 3072 or 1536 for the first arm?** This spec assumes 3072 for a
   clean measurement; 1536 halves index size at some quality cost.
3. **Is a per-query dependency on Google acceptable for `/api/retrieve`** in production, or is a
   lexical-only degraded path required before rollout? (§9.) This spec adds no degraded path.
4. **Which golden set / retrieval config is frozen for the A↔B run?** Both arms must use the same
   values, whichever they are.

   > **Correction (2026-07-29).** This question originally claimed `retrieval/.env` carries
   > `CANDIDATE_POOL_SIZE=500` and `LEXICAL_WEIGHT=0.2`. That is stale. The live values are
   > **`CANDIDATE_POOL_SIZE=50`** and **`LEXICAL_WEIGHT=0`** (`MIN_SEMANTIC_SCORE=0.3` and
   > `MAX_RETURNED_SERVICES=400` have also drifted off their documented defaults — see
   > `docs/evaluation-relevance-judging-spec.md` §14.4.1 for the full on-disk diff).
   >
   > `LEXICAL_WEIGHT=0` matters for this spec specifically: it makes the current arm **kNN-only**. BM25
   > still runs and still reports a `lexical_score`, but it contributes nothing to the fused ranking — so
   > the A↔B comparison is a **purer test of the embedder** than the spec assumed. Whatever the frozen
   > config ends up being, freeze it *before* the arm-A baseline run, not between arms.

---

## 14. Execution log

### 14.1 What shipped (updated 2026-07-30, branch `fix-embedding-text-and-reindex`, **still uncommitted**)

**Missions 1–6 are complete, Task 6.3 included. Only Mission 7 (rollout) remains, and it is gated on a
decision (§13 Q3) and a cluster secret, not on code.**

> **This section was stale as written on 2026-07-29.** It claimed M5 and M6 were "not started". Both were
> subsequently executed: the V4 index exists with all 9,871 documents, and both arms have been evaluated.
> The A↔B result is §14.4. **`gemini` wins every metric cell in both configurations.**

> **Correction (2026-07-30) — Task 6.3 is done; this table called it "the one open code/doc task".** The
> outcome is now written into `retrieval/README.md` and the row below has been flipped. With that, **every
> code and documentation item in Missions 1–6 is discharged**; what is left in §14.3 is a product decision,
> a manual secret, a deliberate env flip, and a commit split.

| Mission | Result |
| --- | --- |
| M1 — provider seam | Complete. `embedding_model.py` deleted; `embedding_provider_schema.py`, `resolve_embedding_provider.py`, `embed_text.py`, `probe_embedding_dimensions.py`, `normalize_embedding_vector.py` and `providers/local/` created. All four call sites from §1.1 re-pointed at `embed_text`. Verified as a no-op against the live V3 index. |
| M2 — Gemini provider | Complete. `providers/gemini/` (4 files) created; `google-genai` pinned at **2.14.0** in `requirements.txt`. Verified live against the real API (§14.2). |
| M3 — config, secrets, deployment | Complete. `.env.example` arm blocks, `Infra/secrets.template.yaml`, `Infra/values.yaml`, `retrieval/README.md`'s new "Embedding providers" section, and the corrections in this document. |
| M4 — mismatch guard | Complete. `_meta` stamp in `ensure_retrieval_index_exists.py`; new `elasticsearch/assert_index_matches_provider.py` called from `warm_models`. |
| M5 — build the V4 index | **Complete.** `srm__services_retrieval_embeddings_v4_gemini` exists and is fully populated: **9,871 documents**, `dims: 3072`, `similarity: cosine`, `int8_hnsw`, `_meta` = `{embedding_provider: gemini, embedding_model: gemini-embedding-001, embedding_dimensions: 3072}`. Document count matches the local arm's 9,871 **exactly**, so the selection rules produced the same corpus. Store size 607.5 MB vs V3's 209.2 MB. Task 5.3's cosine re-measurement is done and written up at length in `retrieval/README.md` (§14.4.2). |
| M6 — evaluate the two arms | **Complete.** Four result directories (`results-arm3-v3-local{,-nocut}`, `results-arm4-v4-gemini{,-nocut}`). **Gemini wins all 35 per-k cells, all 3 set metrics and every count-parity statistic, in both the cut and no-cut configurations.** Numbers in §14.4. |
| M7 — rollout and rollback | **Not started**, and correctly so: `Infra/values.yaml:326` still ships `EMBEDDING_PROVIDER: "local"` with `RETRIEVAL_EMBEDDINGS_INDEX_NAME` on the V3 index, which §9 mandates as the default *even after V4 wins*. Flipping it is a deliberate separate commit. |
| **Task 6.3 — record the outcome** | **Complete.** A new `## The model axis` section at `retrieval/README.md:132-206` sits immediately after the V3 text-axis paragraph at `README.md:130`, so the *text* axis (`0.2990 → 0.3166 → 0.3331`) and the *model* axis are legible side by side as Task 6.3 requires. It carries both pairs as tables, names **Pair 2 as the single-variable verdict** with the non-overlapping-cosine-band reason (§14.4.1), all five of Task 6.2's honesty checks, and the §10.4 cost line (**≈1.33M input tokens**, deliberately no dollar figure) beside the score delta. It closes with a `### The V4 adoption decision is open` subsection at `README.md:196-206`. A two-line cross-reference was added at `README.md:226-227` under `### The swap is close to single-variable`. |

**Deviations from the §2.2 file tree**, both to hold a convention limit rather than to add scope:

- `resolve_embedding_model_identifier()` lives in its own file (`text_embedding/resolve_embedding_model_identifier.py`) rather than inside `resolve_embedding_provider.py` as Task 4.1 suggested — `ensure_retrieval_index_exists` imports it, and putting it next to the registry would have made the ES module import the provider builders.
- Task 2.4's *optional* move of `chunk_iterable` to `app/services/iteration/` was **skipped**; it stays at `app/services/service_indexing/chunk_iterable.py` with both importers unchanged.

### 14.2 Live checks that passed

Run against the real Gemini API and the live 9,871-document V3 index, not mocks:

- **M1 vector identity.** Task 1.4 Step 2 on a real service: `1024 1024` with a max absolute difference below the `1e-6` threshold, so moving the E5 prefixes into the local provider and collapsing single-passage embedding onto `embed_documents([text])[0]` changed no math.
- **Gemini width and norm** (Task 2.5 Step 1): exactly **3072** floats at an L2 norm of **1.0**.
- **Gemini batch order** (Task 2.5 Step 2): batched vectors are **bit-identical** to the same texts embedded solo, with order preserved — stronger than the `< 1e-4` correspondence the step asked for. This is what `embed_service_batch`'s positional zip depends on.
- **`task_type` reaches the API** (Task 2.5 Step 3, under its corrected criterion): the correct `QUERY↔DOCUMENT` pairing gives a discrimination margin of **+0.0979** against same-task-type's **+0.0647** — 51% larger. Absolute cosines were 0.7153 and 0.8087 respectively, which is why the original criterion had to be replaced.
- **Hebrew round trip** (Task 2.5 Step 4): intact, with `PYTHONUTF8=1`.
- **Token headroom** (Task 2.5 Step 5), over the full corpus rather than a few hundred services: p50 **137** tokens / p95 **190** / max **1,739**; **27 of 9,871 (0.27%)** over 512, **zero** over 2,048. Characters: p50 **432** / p95 **596** / p99 **753** / max **4,906**. Full-reindex input cost **≈1.33M tokens** (mean 134.2 tokens/service on a 400-document sample).
- **M4 guard** (Task 4.2 Verify): `EMBEDDING_PROVIDER=gemini` aimed at the 1024-dim V3 index refuses to boot, naming both widths; the `_meta`-absent path warns and continues, which is what keeps rollback to the V3 index working.

Added 2026-07-30:

- **The `_meta.embedding_provider` branch fires — but is unreachable in practice.** The check order in
  `assert_index_matches_provider.py` is `indices.exists` (`:72`) → **dimensions** (`:76`) → `_meta` read
  (`:77`) → `_meta`-absent warn-and-return (`:78-80`) → **provider** (`:81`). Since local is 1024 and gemini
  is 3072, the dimensions check **always fires first** for today's providers. Reaching the provider branch at
  all required forcing `probed_dimensions=3072` with `provider_name='local'` against the V4 index; it then
  raised `ValueError` carrying `ERROR_INDEX_PROVIDER_MISMATCH`, naming stored `'gemini'` against active
  `'local'`. The **realistic** misconfiguration — `local` at its true 1024 width against the V4 index — is
  caught by the dimensions guard instead (`ERROR_INDEX_DIMENSIONS_MISMATCH`, "stores 3072 … produces 1024").
  Boot is refused either way. The absent-index rule also returns cleanly **without** auto-creating the index.
  This is a correction to how §2.3 and §6 frame the mission, not just a log entry — see the dated
  blockquotes there. **The provider stamp is a backstop for a future same-width provider swap, not the
  primary guard.**
- **Cluster egress to `generativelanguage.googleapis.com:443` is open** (Task 3.2 Step 5). Probed from
  **inside** the retrieval pod — `kolsherut-retrieval-85c66ddff8-285rt`, container `kolsherut-retrieval`,
  namespace `default`, context `Kolsherut-Stage-Cluster` — unauthenticated, with no API key involved. DNS
  resolves to **8 A records plus 8 AAAA records** in Google's ranges; TCP connects to `172.217.119.4:443`;
  the TLS handshake completes and **validates** (TLSv1.3, `TLS_AES_256_GCM_SHA384`, issuer CN `WR2`, Google
  Trust Services' public intermediate). Because Python's `create_default_context()` enforces hostname
  checking, a completed handshake is itself proof there is **no intercepting proxy**. Google's frontend then
  answers **HTTP 403 `PERMISSION_DENIED`** — *"Method doesn't allow unregistered callers"* — with
  `Server: scaffolding on HTTPServer2`. **A 403 here is the success signal:** it proves the request reached
  Google. No proxy environment variables in the pod, and **no NetworkPolicy exists in the `default`
  namespace** (the only one cluster-wide is `kube-system/konnectivity-agent`), so nothing at that layer
  restricts egress. A reduced probe was re-run independently and reproduced `DNS 172.217.113.4` and
  `STATUS 403 reached-google`.
  > **Scope caveat, and it matters.** This verifies **network reachability only**. It says nothing about
  > whether the pod has a valid `GEMINI_EMBEDDER_API_KEY` mounted, or whether that key is authorised for
  > `gemini-embedding-001`. An authenticated failure looks different from this unauthenticated 403. If a
  > cluster-side reindex ever fails, **the key and its model permissions are the next thing to check, not
  > egress.**
- **Dependency isolation holds** (Risk 6, Task 2.1 Step 1). `google-genai==2.14.0` is pinned in its own
  `requirements.txt` block and the HF stack did **not** move: `transformers 5.14.0`, `tokenizers 0.22.2`,
  `sentence-transformers 5.6.0`, `numpy 2.5.1`. `python -m pip check` → **No broken requirements found.**
  Risk 6 is closed by measurement rather than by policy.
- **The API key cannot leak** (§9's open question, Risk 8). Evidence is from the *installed* SDK, not general
  reasoning. The key travels as a **header only** — `google/genai/_api_client.py:798`,
  `headers['x-goog-api-key'] = self.api_key`; grepping `google/genai/*.py` for `?key=`, `&key=` and
  `params['key']` returns **zero hits**, so the URL-key path does not exist in 2.14.0. Exception strings are
  built from response data only (`errors.py:66`, `f'{self.code} {self.status}. {self.details}'`, where
  `details` is the response JSON), and `errors.py` contains **zero** references to `headers`. Confirmed
  empirically with a sentinel fake key through both a **401 JSON** error and a **503 HTML** error: the
  sentinel is absent from `str()` and `repr()` in both. `call_gemini_embed_content.py:41-45` formats only
  `{error}`. The SDK's internal debug logging writes response bodies to a separate logger and the service
  default level is INFO. Secret placement is clean: `GEMINI_EMBEDDER_API_KEY` is an empty-valued entry in
  `Infra/secrets.template.yaml:47`, appears in `Infra/values.yaml` **only inside comments** (`:299`, `:325`),
  reaches the pod via `Infra/templates/retrieval-deployment.yaml:77-78` `envFrom.secretRef` (**no template
  change was needed**), is absent from `retrieval/Dockerfile`, and `.env` is excluded by both
  `.gitignore:123` and `retrieval/.dockerignore:11`.
- **§12's checklist was audited, and one violation was found and fixed.** **8 of 10 boxes pass** as written:
  single-purpose files and the ≤100-line limit (largest new file **46 lines**), functions ≤30 lines with
  exactly one class (the `EmbeddingProvider` NamedTuple), exactly one `try/except`
  (`call_gemini_embed_content.py:37`), all imports at top, `vars.py` a single **186-line** file, informative
  names, `PYTHONUTF8=1` discipline, and `RETRIEVAL_EMBEDDINGS_INDEX_NAME` correctly unchanged. All **seven**
  new env vars appear in all three required places (`vars.py` with a default, `.env.example`,
  `retrieval/README.md`); `GEMINI_DOCUMENT_TASK_TYPE` / `GEMINI_QUERY_TASK_TYPE` are correctly plain
  constants rather than `os.getenv` reads — they are protocol values, not configuration.
  **The failure, now fixed:** `ensure_retrieval_index_exists.py` **wrote** three index-mapping key names as
  bare literals (`'properties'`, `'embedding'`, `'dims'`) while `assert_index_matches_provider.py:25-27`
  **read** those same keys through `INDEX_MAPPINGS_PROPERTIES_KEY` / `EMBEDDING_VECTOR_FIELD_NAME` /
  `DENSE_VECTOR_DIMENSIONS_KEY` (`vars.py:68,73,74`). Beyond the style rule this was a **silent-failure
  hazard**: change any of those constants and `read_stored_embedding_dimensions` returns `None`,
  `assert_stored_dimensions_match` early-returns at `:36`, and **Mission 4's dimension guard stops firing
  with no error at all** — which, per the correction above, is the guard that actually protects the index.
  The writer now uses the same three constants; the produced mappings dict is semantically identical and
  `m[properties][embedding][dims] == 3072` was verified.
- **The single-service API change is a true no-op** (a re-confirmation worth recording). The single-service
  path silently changed API in M1: V3's `embed_passage_text` called
  `HuggingFaceEmbeddings.embed_query(prefix + text)`, V4 routes to `embed_documents([prefix + text])[0]`.
  Verified in the installed `langchain_huggingface`: `embed_query` uses `query_encode_kwargs` only when
  non-empty and otherwise falls through to `encode_kwargs`; since the model is constructed with
  `model_name=` alone (`load_local_embedding_model.py:10`), both dicts are `{}` and the two calls reach the
  same `self._embed(texts, self.encode_kwargs)`. **Identical vectors** — which is why no index bump was
  required for the local arm.

### 14.3 What is explicitly NOT done

Rewritten again 2026-07-30, second pass.

> **Correction (2026-07-30).** The previous version of this list named four things that are **now done** and
> have been removed from it: **Task 6.3** (the outcome is written into `retrieval/README.md:132-206`),
> **cluster egress verification** — which this list called "the gating unknown for Mission 7" and which is
> now **verified open from inside the pod** (§14.2) — the **provider-mismatch branch** of the M4 guard, which
> this list called "half-exercised" and which has now been forced to fire, and the **key-leak audit** §9
> asked for. The list before that had already shed the V4 index, the reindex, the A↔B evaluation and the
> score-cut re-measurement. **No code or documentation work that this spec mandates is outstanding.** What
> remains:

- **§13 Q3 is the sole remaining decision blocker, and it is deliberately open.** Whether a per-query Google
  dependency in `/api/retrieve` with **no degraded path** is acceptable in production. A Gemini outage 500s
  the endpoint, because `embed_query_text` raises before the hybrid search runs — BM25 would still answer,
  but it never gets the chance. **This spec adds no degraded path** (§9), and no decision is recorded here.
  This is now the **only decision standing between the measurement and rollout**.
- **`GEMINI_EMBEDDER_API_KEY` has never been added to the cluster secret** (Task 3.2 Step 3 remains
  unverified). The key is live in `retrieval/.env` on a developer machine. **Egress being open proves the
  network works and proves nothing about the key** — see §14.2's scope caveat. Adding a live secret to the
  cluster is a deliberate manual act for the owner, not something to automate into this run. Confirm the key
  is not about to be committed.
- **Mission 7 has not run, and that remains correct.** `Infra/values.yaml:326` still ships
  `EMBEDDING_PROVIDER: "local"` with `:318` on the V3 index, which §9 mandates as the shipping default
  *even after V4 wins*. So this is "not started", not "blocked" — but it does mean **nothing about V4 is
  live in the cluster.**
- **Recommended before Mission 7, beyond what this spec mandates: put the five non-secret Gemini knobs into
  `Infra/values.yaml`.** `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS`,
  `GEMINI_EMBED_REQUEST_BATCH_SIZE`, `GEMINI_EMBED_MAX_ATTEMPTS` and `GEMINI_EMBED_RETRY_BASE_SECONDS` are
  absent from it. **This is not a spec violation** — Task 3.2 Step 2 asks only for `EMBEDDING_PROVIDER` plus
  the extended index-name comment, and both are present; there is precedent for omission
  (`REQUIRE_CARD_FOR_EMBEDDING` is also absent). But it means a cluster flip to the gemini arm leaves the
  3072-dim width and the whole retry ladder **invisible in deployed config**, tunable only by editing code.
  Flagged as a recommendation, explicitly not as a debt this spec incurred.
- **The working tree carries an unrelated `service_hierarchy` score-passthrough change** —
  `retrieval/app/schemas/service_hierarchy_schemas.py`,
  `services/service_hierarchy/order_services_by_ranking.py`, `assemble_services_from_documents.py` and
  `attach_document_scores_to_service.py` — belonging to **neither this spec nor the evaluation spec**. It
  must stay out of both commits. Recorded here so it is not lost.
- **The commit split is the last step of this run, and is the plan of record rather than landed history.**
  Everything is still uncommitted on `fix-embedding-text-and-reindex`. The tree is being split into **two
  commits** — one for the V4 embedder (`retrieval/` minus `service_hierarchy`, `Infra/`, and this spec
  document) and one for the evaluation work (`evaluation/`, `docs/evaluation-relevance-judging-spec.md`) —
  with the `service_hierarchy` change **left uncommitted for a third, separate change**. A single commit
  would mix two specs' worth of work plus a third unrelated one.

### 14.4 The A↔B result (Mission 6, measured 2026-07-29/30)

**Verdict: the gemini arm wins, decisively and without a mixed cell.** Same golden set, same 59 evaluated
queries, same `avg_ground_truth_size` (19.949) on every arm — so the arms differ only in the embedder, as
§0 required.

Two pairs were run, because the score cut is arm-specific (§14.4.2) and a single pair would have confounded
the model change with a threshold carried across arms.

#### Pair 1 — matched cuts (`MIN_SEMANTIC_SCORE=0.3`, `MAX_RETURNED_SERVICES=400`)

| Metric | `local` (V3) | `gemini` (V4) | Δ | Δ% |
| --- | ---: | ---: | ---: | ---: |
| **`overall_score`** | **0.3157** | **0.3694** | **+0.0537** | **+17.0%** |
| `precision_at_returned` | 0.1957 | 0.2397 | +0.0440 | +22.5% |
| `recall_at_returned` | 0.3266 | 0.4285 | +0.1019 | +31.2% |
| `f1_at_returned` | 0.1745 | 0.2184 | +0.0439 | +25.2% |
| `avg_returned_count` | 21.95 | 21.62 | −0.33 | — |

#### Pair 2 — all cuts off (the clean comparison)

| Metric | `local` (V3) | `gemini` (V4) | Δ | Δ% |
| --- | ---: | ---: | ---: | ---: |
| **`overall_score`** | **0.3206** | **0.3853** | **+0.0647** | **+20.2%** |
| `precision_at_returned` | 0.1327 | 0.1498 | +0.0171 | +12.9% |
| `recall_at_returned` | 0.4427 | 0.4957 | +0.0530 | +12.0% |
| `f1_at_returned` | 0.1529 | 0.1656 | +0.0127 | +8.3% |
| `avg_returned_count` | 50.30 | 48.79 | −1.51 | — |

#### Why this passes Task 6.2's honesty test

- **All 35 per-k metric cells improve. Zero regress, zero tie.** This is the same signature that made the
  V3 text change trustworthy (§8, Task 6.2) — a model that only moved the headline would be a
  threshold artifact.
- **Every count-parity statistic also moves toward the golden set**, which the naive "higher is better"
  reading inverts, so state it explicitly: `median_returned_count` 22 → 20 against a ground-truth median of
  8, `ratio_of_median_counts` 2.556 → 2.333 (toward 1.0), `median_absolute_count_error` 16 → 14,
  `geometric_mean_count_ratio` 2.116 → 1.992 (toward 1.0), `mean_count_parity` 0.3781 → 0.3839.
- **The gain is not bought with a shorter list.** `avg_returned_count` is essentially identical within each
  pair (21.95 vs 21.62; 50.30 vs 48.79), so precision did not rise by returning less.
- **The delta clears the measured noise floor by 4–5×.** `retrieval/README.md` records `overall_score` on
  the local arm varying **0.3206–0.3324 across three runs** (≈0.012) — HNSW near-tie resolution at
  `CANDIDATE_POOL_SIZE=50`, the same non-reproducibility the evaluation spec measured independently
  (`docs/evaluation-relevance-judging-spec.md` §14.4.3). Both deltas (+0.054, +0.065) are far outside it;
  the README's own "deltas below ~0.012 are noise" caveat does not touch this result.
- **The truncation confound is bounded at 0.27%** (§10.2, measured), so this cannot be read as "more text
  got embedded". With `LEXICAL_WEIGHT=0` the arm is kNN-only (§13 Q4), which makes it a *purer* test of the
  embedder than the spec originally assumed.

#### 14.4.1 Read Pair 2, not Pair 1, as the model verdict

Pair 1 applies `MIN_SEMANTIC_SCORE=0.3` to both arms, and that threshold was measured on the **local** arm.
`retrieval/README.md` establishes the two arms' cosine bands **do not overlap** — Gemini's widest
best-cosine over 25 queries (0.8228) sits below the local model's tightest (0.8271) — so a shared absolute
cosine floor is not "a bit off" on the other arm, it is measuring a distribution that does not exist there.
Pair 1 is therefore reported for completeness, not as the clean measurement. **Pair 2 (all cuts off) is the
single-variable comparison**, and it favours gemini by more, not less — which is why the verdict is not
sensitive to this choice.

#### 14.4.2 Task 5.3 is complete and is written up in the README

The cosine re-measurement §7 demanded is done and is the most substantial new section in
`retrieval/README.md` (the "Tuning the score cut" material). Its operative findings:

- Gemini's cosine spread is **~1.6× wider**, pushing the whole usable `SEMANTIC_SCORE_RATIO` band down.
- **`MIN_SEMANTIC_SCORE=0.3` does not transfer.** The V4 equivalent of the local cut is ≈**0.955–0.96**;
  carried over unchanged it keeps ~4 of 21 documents on V4 where it kept 21 on V3.
- A cut that looks mild on V3 would return **nothing at all** for two thirds of the golden set on V4. The
  observed V4 floor is 0.632 — set below it, or leave the cut off.

So Risk 5 in §11 ("stale score-cut thresholds carried into arm B") **did materialise**, in Pair 1
specifically, and is the reason Pair 2 exists. It is now closed by measurement rather than by policy.

#### 14.4.3 The decision (Task 6.3)

The measurement supports adopting `gemini`. Not yet actioned. Two things were owed before it could be;
**one is discharged and one is not**:

1. ~~**Write §14.4 into `retrieval/README.md`**~~ — **discharged 2026-07-30.** The `## The model axis`
   section at `retrieval/README.md:132-206` sits directly after the V3 text-axis paragraph at `:130` and
   carries both pairs, Pair 2 as the single-variable verdict, Task 6.2's five honesty checks, and the §10.4
   cost line (**≈1.33M input tokens** per full reindex, no dollar figure) beside the score delta — exactly
   what Task 6.3 asked for. Its closing `### The V4 adoption decision is open` subsection
   (`README.md:196-206`) is where item 2 below is surfaced to a README reader.
2. **Decide the availability question (§13 Q3) explicitly. Still open — and now the only thing open.** A
   +17–20% relative gain is a strong result, but adopting it puts a per-query Google dependency in
   `/api/retrieve` with **no degraded path** — a Gemini outage 500s the endpoint. That is a product decision,
   not a metric one, and §9 deliberately leaves it open. Note that the egress probe (§14.2) does **not**
   touch this question: knowing the pod *can* reach Google says nothing about what happens when Google is
   down.

Re-measuring the V4 arm's own optimal score cut (using §14.4.2's 0.955–0.96 band) is likely worth more than
the remaining headroom in the model axis, and is the natural next arm.
