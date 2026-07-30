# Kolsherut Retrieval Service

A FastAPI microservice that embeds and searches the **service** documents in the Kolsherut Elasticsearch (`srm_services`). It is a pure hybrid retriever: it returns the matching services and their scores. There is **no reranker and no LLM answer generation**.

## Flow

1. **Embed** — `POST /api/services/update` receives a `serviceId`, fetches the service from `srm_services`, builds Hebrew text from the configured fields, embeds it with the configured embedding provider (see "Embedding providers"), and stores it in a dedicated embeddings index (`srm__services_retrieval_embeddings`).
2. **Reindex** — `POST /api/services/reindex` scans all of `srm_services`, embeds each service, and bulk-inserts into the embeddings index.
3. **Retrieve** — `POST /api/retrieve` embeds the query, runs the hybrid search, logs the request, and returns the matching services.

Retrieval is a hybrid funnel: two retrievers (semantic kNN + lexical BM25) each return `CANDIDATE_POOL_SIZE` candidates, reciprocal rank fusion merges them into a single fused score, each document keeps its raw `semantic_score` / `lexical_score` alongside that fused score, and a **score cut** decides what is actually returned.

The score cut applies four independent rules in order — the fused floor (`MIN_FUSED_SCORE`), the absolute cosine floor (`MIN_SEMANTIC_SCORE`), the relative cosine floor (`SEMANTIC_SCORE_RATIO`), then the hard cap (`MAX_RETURNED_SERVICES`). **Every one is disabled by default**, so out of the box the whole fused pool is returned and `CANDIDATE_POOL_SIZE` is what bounds the result count.

Only the cosine floors produce a length that varies per query. The fused RRF score is `Σ weight / (RRF_RANK_CONSTANT + rank)` — a pure function of ranks — so the Nth-best fused score is near-identical for every query and thresholding it is a fixed top-N cut in disguise. The cosine is absolute and comparable across queries, which is what makes an adaptive cut possible.

### Tuning the score cut

Cosine floors are absolute numbers compared against a model's output, so **they are a property of the
embedding arm, not of the service**. Both arms have a compressed range, but they are compressed around
different centres and by different amounts, and the two bands do not overlap: the widest best-cosine
Gemini produced over 25 queries (0.8228) is still below the *tightest* one the local model produced
(0.8271). Any threshold carried from one arm to the other is therefore not "a bit off" — it is
measuring a distribution that does not exist there.

Measured like-for-like: the **same first 25 queries** of `evaluation/data/Raw-Golden-Set.csv`, kNN at
**depth 100**, Elasticsearch `_score` converted back to cosine with `COSINE_SCORE_OFFSET` /
`COSINE_SCORE_SCALE` (`recover_cosine_similarity`, i.e. `2·score − 1`).

| cosine at rank | `local` (V3) min | median | max | `gemini` (V4) min | median | max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (best) | 0.8271 | 0.8651 | 0.8932 | 0.6969 | 0.7709 | 0.8228 |
| 10 | 0.8160 | 0.8542 | 0.8849 | 0.6623 | 0.7435 | 0.7957 |
| 50 | 0.8028 | 0.8414 | 0.8828 | 0.6427 | 0.7135 | 0.7920 |
| deepest (100) | 0.7959 | 0.8347 | 0.8813 | 0.6319 | 0.7014 | 0.7898 |

Absolute cosines are the less interesting half. What decides whether a ratio floor is usable at all is
the **spread** from the best document down the list, because `SEMANTIC_SCORE_RATIO` cuts on
`cosine / best_cosine`:

| best → rank 50 | `local` (V3) min | median | max | `gemini` (V4) min | median | max |
| --- | --- | --- | --- | --- | --- | --- |
| spread (best − rank 50) | 0.0050 | 0.0241 | 0.0520 | 0.0082 | 0.0390 | 0.0901 |
| ratio (rank 50 ÷ best) | 0.9418 | 0.9719 | 0.9944 | 0.8874 | 0.9471 | 0.9898 |
| ratio (rank 100 ÷ best) | 0.9177 | 0.9640 | 0.9926 | 0.8657 | 0.9352 | 0.9869 |

**Gemini's spread is roughly 1.6× wider**, which pushes the entire usable ratio band down by about
0.02–0.03. Replaying each ratio value against the 25 measured cosine lists, as documents kept out of
100:

| `SEMANTIC_SCORE_RATIO` | `local` kept (median) | keeps all 100 | `gemini` kept (median) | keeps all 100 |
| --- | --- | --- | --- | --- |
| 0.92 | 100 | 24/25 | 100 | 16/25 |
| 0.95 | 100 | 21/25 | 35 | 5/25 |
| 0.96 | 100 | 16/25 | 19 | 3/25 |
| 0.97 | 60 | 10/25 | 9 | 3/25 |
| 0.975 | 34 | 7/25 | 8 | 2/25 |
| 0.98 | 21 | 5/25 | 4 | 2/25 |
| 0.99 | 5 | 2/25 | 2 | 0/25 |

**Every cutoff value in this section's e5 guidance, and any cutoff currently sitting in a `.env`, is
`local`-arm-specific and does not transfer to the `gemini` arm.** Concretely:

- **`SEMANTIC_SCORE_RATIO=0.98`** — the value the end-to-end table below was tuned at — keeps a median
  of 21 documents on V3 but only **4** on V4. The V4 equivalent of that cut is roughly **0.955–0.96**;
  the usable band is about **0.95–0.97**, and even `0.90` already bites there (tightest query: 22 of
  100 kept) where on V3 it keeps everything.
- **`MIN_SEMANTIC_SCORE`** is still a nonsense-filter rather than a length control, but its safe value
  moves further than the ratio does. The e5 suggestion of ~0.78 sits *above* the best cosine of **17 of
  the 25** V4 queries, so on the `gemini` arm it would return **nothing at all** for two thirds of the
  golden set. The V4 observed floor is 0.632; set it below that, or leave it off.
- Because one query can stay tight all the way down on either arm, **always pair the ratio with
  `MAX_RETURNED_SERVICES`.**

`MIN_FUSED_SCORE` deserves its own warning, because at `LEXICAL_WEIGHT=0` it stops being a score
threshold at all. A BM25-only document's sole fused contribution is `LEXICAL_WEIGHT / (k + rank)`, so
at weight 0 it fuses to **exactly `0.0`** — measured on one query: 31 of 81 fused documents at
`0.0`, every one of them with a `null` `semantic_score`. Any positive `MIN_FUSED_SCORE` therefore
deletes the whole BM25-only block as a structural rule, not a relevance one. `0.01` also truncates the
kNN side, since `1 / (60 + rank) ≥ 0.01` only holds to rank 40: the same query went **81 → 40**
documents, dropping all 31 zero-score documents *and* kNN ranks 41–50. That, not `MIN_SEMANTIC_SCORE`,
is what shrinks the returned count on a `LEXICAL_WEIGHT=0` configuration — attributing the drop to a
cosine floor will send you tuning the wrong knob.

**Measurement caveat when comparing arms at this resolution.** With `LEXICAL_WEIGHT=0` and the cutoffs
off, that large block of documents tied at `0.0` has no defined relative order, and kNN itself is
approximate (HNSW), so two identical requests can return slightly different sets. Measured: one
query's returned count varied **64 / 66 / 65** across three identical calls, and full-harness
`overall_score` on the local arm varied **0.3206–0.3324** across three runs; re-running this 25-query
Gemini measurement end to end reproduced every rank-1/10/50 statistic exactly, but 4 of the 25 cosine
lists differed below rank 37 (largest cosine delta 0.002). Differences smaller than roughly one point
of `overall_score` are noise, not signal — repeat the run before believing them.

The original e5 measurement, kept for the record. It was taken **separately** — 20 queries at
`CANDIDATE_POOL_SIZE=500`, not the 25-query depth-100 run above — so read it against that table's
`local` column for trend, not cell by cell:

| cosine at rank | min | median | max |
| --- | --- | --- | --- |
| 1 (best) | 0.8324 | 0.8668 | 0.8933 |
| 10 | 0.8276 | 0.8473 | 0.8730 |
| 50 | 0.8064 | 0.8367 | 0.8665 |
| deepest | 0.7862 | 0.8072 | 0.8579 |

Measured end-to-end on the 65-query golden set, **`local` arm** (`SEMANTIC_SCORE_RATIO=0.98`, `MAX_RETURNED_SERVICES=100`):

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

The vectorized (and BM25-matched) text is **Hebrew only** — every English machine ID is omitted. It is built from `srm_services` fields in this order: `name`, `description`, `details` (when present, with HTML markup stripped), the deduped Hebrew response categories (`x_resp_hebrew`), the deduped Hebrew situation names (union of `x_manual_sit_hebrew` / `x_sit_hebrew` / `x_final_situation_tag_hebrew`), and the deduped Hebrew organization names (union of `x_branch_org_name` / `organization_name` / `name (from organizations)`). Contact/payment/provider-kind fields are kept out of the vector and rendered into a separate `context_text` returned for display.

Every one of those groups **must** be read as a union of candidate columns, never as a single column: `srm_services` populates the variants disjointly, so reading only the legacy `name (from organizations)` lookup put the organization clause on just **194 of 11,748** services instead of 11,638. The same split applies to the provider kind (`organization kind (from branches)` covers 11,271 docs, `kind (from organizations)` only 194).

`details` carries raw HTML on 939 services (`<br/>`, `<li>`, `<p>`, entities). `strip_html_markup` turns it into prose at the source-field level, before template rendering, so the tag→space substitution collapses cleanly through the whitespace normalizer. Tags were measured to appear **only** in `details`; entities also appear in `description` on one service and are deliberately left alone there.

Services with no branch card are excluded from the index (`REQUIRE_CARD_FOR_EMBEDDING`, default on), using the exact set of `service_id`s present in `srm__cards` — 9,871 of 11,748. `order_services_by_ranking` discards any retrieved service with no card, so those 1,877 documents could only ever consume candidate-pool slots. The `srm_services.Cards` field is **not** used for this: it disagrees with the cards index on 16 services.

Measured effect of the above on the 65-query golden set (identical retrieval config, ~48-50 services returned per query): the incumbent text scores `overall_score` **0.2990**, the organization-name union alone **0.3166**, and the full set of changes **0.3331** — a 11.4% relative gain, with every one of the 35 metric cells improving and none regressing.

## The model axis

The section above moves one axis — *which text* gets embedded — with the model held fixed. This section
moves the other: the same `embedded_text` handed to a different embedder. Same golden set, same **59
evaluated queries**, same `avg_ground_truth_size` (**19.949**) on every arm, so the arms differ only in the
provider. Two pairs were run rather than one, because a score cut is a property of the arm ("Tuning the
score cut" above) and a single pair would have confounded the model change with a threshold carried across
arms.

Pair 1 — matched cuts (`MIN_SEMANTIC_SCORE=0.3`, `MAX_RETURNED_SERVICES=400`):

| Metric | `local` (V3) | `gemini` (V4) | Δ | Δ% |
| --- | ---: | ---: | ---: | ---: |
| **`overall_score`** | **0.3157** | **0.3694** | **+0.0537** | **+17.0%** |
| `precision_at_returned` | 0.1957 | 0.2397 | +0.0440 | +22.5% |
| `recall_at_returned` | 0.3266 | 0.4285 | +0.1019 | +31.2% |
| `f1_at_returned` | 0.1745 | 0.2184 | +0.0439 | +25.2% |
| `avg_returned_count` | 21.95 | 21.62 | −0.33 | — |

Pair 2 — all cuts off:

| Metric | `local` (V3) | `gemini` (V4) | Δ | Δ% |
| --- | ---: | ---: | ---: | ---: |
| **`overall_score`** | **0.3206** | **0.3853** | **+0.0647** | **+20.2%** |
| `precision_at_returned` | 0.1327 | 0.1498 | +0.0171 | +12.9% |
| `recall_at_returned` | 0.4427 | 0.4957 | +0.0530 | +12.0% |
| `f1_at_returned` | 0.1529 | 0.1656 | +0.0127 | +8.3% |
| `avg_returned_count` | 50.30 | 48.79 | −1.51 | — |

**Pair 2 is the single-variable comparison and the one to read as the model verdict.** Pair 1's
`MIN_SEMANTIC_SCORE=0.3` was measured on the `local` arm, and the two arms' cosine bands do not overlap —
Gemini's widest best-cosine over 25 queries (0.8228) sits below the local model's tightest (0.8271) — so a
shared absolute cosine floor is not "a bit off" on the V4 arm, it measures a distribution that does not
exist there. Pair 1 is reported for completeness. The verdict is not sensitive to which pair is read,
because Pair 2 favours `gemini` by *more*, not less.

The honesty checks applied to the text delta above hold on this axis too:

- **All 35 per-k metric cells improve — zero regress, zero tie.** The same signature that made the text
  change trustworthy, rather than a headline that moved on its own.
- **Every count-parity statistic also moves toward the golden set**, which the naive "higher is better"
  reading inverts, so it is worth stating in the direction that matters: `median_returned_count` 22 → 20
  against a ground-truth median of 8, `ratio_of_median_counts` 2.556 → 2.333 (toward 1.0),
  `median_absolute_count_error` 16 → 14, `geometric_mean_count_ratio` 2.116 → 1.992 (toward 1.0),
  `mean_count_parity` 0.3781 → 0.3839.
- **The gain is not bought with a shorter list.** `avg_returned_count` is essentially identical inside each
  pair (21.95 vs 21.62; 50.30 vs 48.79), so precision did not rise by returning less.
- **Both deltas clear the measured noise floor by 4–5×.** The measurement caveat above records
  `overall_score` on the local arm varying 0.3206–0.3324 across three runs (≈0.012); +0.0537 and +0.0647 sit
  well outside that, so the "differences smaller than roughly one point of `overall_score` are noise"
  warning does not reach this result.
- **Neither is it "more text got embedded".** The 512 → 2048 token jump rides along with the provider, but
  the truncation confound is bounded at **0.27%** of the corpus (see "The swap is close to
  single-variable"). And at `LEXICAL_WEIGHT=0` the fused ranking is kNN-only, so this is a purer test of the
  embedder than a hybrid arm would have been.

The price belongs next to the delta, because a gain of this size that adds a per-query API dependency is a
different decision from a marginal one. A full reindex on the `gemini` arm is **≈1.33M input tokens** (9,871
services at a measured mean of 134.2 tokens each, from a 400-document sample), to be multiplied by
`gemini-embedding-001`'s current input-token price; steady state is two much smaller streams, one embed per
`/api/services/update` and one short embed per query. No dollar figure appears anywhere in this repo on
purpose, because the price moves. Same measurement as under "The swap is close to single-variable" below,
repeated here so the score and its price are read together.

### The V4 adoption decision is open

The measurement supports adopting `gemini`. What blocks the rollout is not a metric: adoption puts a
**per-query Google dependency in `/api/retrieve` with no degraded path** — `embed_query_text` raises before
the hybrid search runs, so a Gemini outage 500s the endpoint even though BM25 is still healthy. Whether that
availability trade is acceptable is a product decision rather than a retrieval one, and it is deliberately
still open.

Until it is closed, `Infra/values.yaml` continues to ship `EMBEDDING_PROVIDER: "local"` against the V3
index, and that remains the mandated cluster default *even now that the V4 arm has won the measurement*.
Flipping it is a separate, deliberate commit — not a side effect of recording this result.

## Embedding providers

Which model turns `embedded_text` into a vector is a **runtime** choice, not a build-time one: `EMBEDDING_PROVIDER` selects it, no rebuild and no branch. Everything else — text rendering, batching, skip rules, index creation, bulk storage, kNN/BM25/RRF and the score cut — is provider-blind; the only provider-specific code is "hand these strings to this model and get vectors back", under `app/services/text_embedding/providers/`.

| | `local` (V3) | `gemini` (V4) |
| --- | --- | --- |
| Model | `multilingual-e5-large` (`artifacts/retrieval-model`) | `gemini-embedding-001` |
| Dimensions | 1024 | 3072 (Matryoshka-truncatable to 1536 / 768 — each a **new index**, not a re-tune) |
| Input cap | **512 tokens**, silently truncated | **2048 tokens** |
| Query/passage asymmetry | `"query: "` / `"passage: "` text prefixes | `task_type=RETRIEVAL_QUERY` / `RETRIEVAL_DOCUMENT` |
| Unit-norm output | yes | yes at 3072; **no** when MRL-truncated, so vectors are re-normalized unconditionally |
| Cost | CPU + ~3 GiB RAM in-pod | per input token, plus a network round trip on every query |
| Failure mode | slow CPU, pod OOM | 429, 5xx, blocked egress, bad key |

The E5 prefixes live inside the local provider and the task types inside the Gemini provider, so neither leaks into shared code — Gemini never sees the literal string `"passage: "`.

### The swap is close to single-variable

The outcome of the swap is measured in "The model axis" above — `gemini` wins on both pairs, with the
adoption decision still open. What follows is why that comparison can be read as a model result at all.

The 512 → 2048 token jump rides along with the provider change, so a win in the `gemini` arm could in principle be "more text got embedded" rather than "better model". Measured over the full live V3 corpus (9,871 documents), it can't be much of either: `embedded_text` runs **p50 432 characters, p95 596, p99 753, max 4,906**, which the E5 tokenizer turns into **p50 137 tokens, p95 190, max 1,739**. Only **27 of 9,871 services (0.27%)** cross the local model's 512-token cap and are being silently truncated today, and **zero** cross Gemini's 2,048. The truncation confound is therefore quantified and small — it can touch at most a quarter of a percent of the corpus. (Token counts use the E5 tokenizer as a proxy; Gemini's own tokenizer will differ slightly, but not by the 4× that would matter.)

Verified against the live API: `gemini-embedding-001` returns exactly **3072** floats at an L2 norm of **1.0**, and a batched call's vectors are **bit-identical** to the same texts embedded one at a time, with order preserved. That ordering guarantee is load-bearing — `embed_service_batch` zips vectors back to services positionally, and a silent reorder would produce a healthy-looking index full of scrambled embeddings.

Task types are live and they matter, but **their absolute cosines are not comparable across configurations**: same-task-type pairs share a subspace and get a uniformly inflated baseline, so `DOCUMENT↔DOCUMENT` measured **0.8087** against the correct `QUERY↔DOCUMENT` pairing's **0.7153** on the same pair. What kNN ranking actually depends on is the *discrimination margin* (relevant − irrelevant cosine), and there the correct pairing wins: **+0.0979 vs +0.0647**, a 51% larger margin.

A full reindex is **~1.33M input tokens** (9,871 services at a measured mean of 134 tokens each, from a 400-document sample). Multiply that by `gemini-embedding-001`'s current input-token price from Google's own pricing page — no dollar figure is quoted here on purpose, because it moves. Steady state is two much smaller streams: one embed per `/api/services/update` and one short embed per query.

### One index per provider

The vectors in an index and the query vectors searching it must come from the same provider, the same model **and** the same dimensionality. Cross-arm kNN does not error — it returns confident nonsense — and since `/api/services/update` writes one service at a time, a provider flip that forgets the index name mixes 1024-dim and 3072-dim documents into a single index rather than failing. `ensure_retrieval_index_exists` is create-only, so it will not rebuild the mapping for you.

Two mechanisms close that gap. On creation, the index mappings get a `_meta` stamp of `embedding_provider` / `embedding_model` / `embedding_dimensions`; at startup `assert_index_matches_provider` reads it back from `warm_models` — before `/health` answers, so the pod never becomes ready in a mismatched state:

- index **absent** → boot. A fresh arm legitimately starts empty; the index is created on the first embed.
- stored `embedding.dims` ≠ probed dimensions → **crash**, naming both widths.
- `_meta.embedding_provider` present and ≠ the live provider → **crash**.
- `_meta` **absent** → **warn and continue**. The existing V3 index predates the stamp, and refusing to boot against it would break rollback — so this hole is deliberate. It is also narrow: the dims check still catches the dangerous case (a 3072-dim provider aimed at the 1024-dim V3 index), and the only thing it lets through is a same-width provider swap, which does not exist today.

The probed dimensions come from a single one-token embed at startup, which is why the guard doubles as a health check: it fails fast on missing local model files and on a missing Gemini key.

### Switching arms, and rolling back

`.env` carries both arms as one paired block (see `.env.example`). Uncomment one, comment out the other, restart — **two lines**:

```bash
# Arm: local (V3)
EMBEDDING_PROVIDER=local
RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v3_enriched

# Arm: gemini (V4)
EMBEDDING_PROVIDER=gemini
RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v4_gemini
```

The `gemini` arm additionally needs `GEMINI_EMBEDDER_API_KEY` in `.env`. In the cluster it is a secret: add it to `secrets:` in `secrets-<env>.yaml` (see `Infra/secrets.template.yaml`) and it reaches the pod automatically — `Infra/templates/retrieval-deployment.yaml` mounts the whole shared secret via `envFrom.secretRef`, the same way `ELASTIC_PASS` arrives. It must **never** appear in `Infra/values.yaml`.

**The restart is mandatory, not hygiene.** `resolve_embedding_provider` is `lru_cache`d for the process lifetime, so editing `.env` under a running service changes nothing — deliberately, since there is no per-request provider switching. Confirm the live arm from the startup log before trusting any measurement.

**Rollback is two env vars and a pod restart**: `EMBEDDING_PROVIDER=local` plus the V3 index name. That is the entire procedure, and it is why the local model stays baked into the single image even when the `gemini` arm is live — a slim Gemini-only image would drop torch and the 2.2 GB model, but it would also turn rollback from an env flip into a redeploy. Keep the V3 index until the V4 arm has run for a full week; there is no delete endpoint, so dropping an index is a deliberate manual act.

Two known trade-offs of the `gemini` arm, both accepted rather than fixed:

- **An invalid key costs ~30 s before it says so.** An *empty* key fails immediately with `ERROR_MISSING_GEMINI_API_KEY`, but a present-but-rejected one walks the full retry ladder (5 attempts, 2/4/8/16 s backoff) before the startup probe's embed raises — `call_gemini_embed_content` retries on any exception rather than tracking the SDK's exception taxonomy across versions. A "do not retry on 400/401/403" fast path would cut that to one attempt and is deliberately not implemented.
- **`/api/retrieve` gains a per-query external dependency.** During a Gemini outage `embed_query_text` raises before the hybrid search runs, so the request 500s; BM25 is still healthy but there is no lexical-only degraded path.

The score-cut thresholds are **per-arm**, and "Tuning the score cut" above now carries both distributions measured on the same 25 queries. The short version: the two arms' cosine bands do not overlap, Gemini's best-to-50th spread is ~1.6× wider, and a threshold carried across arms silently confounds the comparison — `SEMANTIC_SCORE_RATIO=0.98` cuts to a median of 21 documents on `local` and 4 on `gemini`, while `MIN_SEMANTIC_SCORE=0.78` empties 17 of 25 queries on `gemini` outright. Re-derive every cutoff from that section's V4 column, or keep them off.

## Setup

1. Place the sentence-transformers retrieval model in `artifacts/retrieval-model`. **Required for the `local` arm and irrelevant for `gemini`**, which never loads it — see "Embedding providers".
2. Copy `.env.example` to `.env` and fill in `ELASTIC_PASS` (and `ELASTIC_URL` if not local). Pick an arm in the paired `EMBEDDING_PROVIDER` / `RETRIEVAL_EMBEDDINGS_INDEX_NAME` block; for `gemini` also fill in `GEMINI_EMBEDDER_API_KEY`.
3. Install and run:

```bash
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8200
```

`warm_models` runs before `/health` answers and embeds one probe token to learn the vector width, so under the `local` arm the model files must actually be present — a missing model fails startup rather than deferring to the first request. Under `gemini` the same probe is what validates the API key.

When copying indices between clusters, `copy_retrieval_indices.sh` reads the embeddings index from `RETRIEVAL_EMBEDDINGS_INDEX_NAME` and falls back to the V3 local-arm name. **Set it per arm** (`RETRIEVAL_EMBEDDINGS_INDEX_NAME=... ./copy_retrieval_indices.sh`), or the script quietly copies the other arm's index.

## Routes

| Method | Path                    | Body                              | Description                        |
| ------ | ----------------------- | --------------------------------- | ---------------------------------- |
| GET    | `/health`               | -                                 | Health check                       |
| POST   | `/api/services/update`  | `{ "serviceId": "..." }`          | Embed a single service into the retrieval index |
| POST   | `/api/services/reindex` | `{ "limit": 50, "resume": true }` (both optional) | Scan all of `srm_services`, embed each, insert into the retrieval index. Omit `limit` for the full index. `resume: true` skips services already present in the embeddings index (continue an interrupted run). Streams Server-Sent Events (`text/event-stream`): a `progress` event every 100 processed services and a final `done` event, each `{event, total, embedded, skipped_no_text, not_found}`. |
| POST   | `/api/retrieve`         | `{ "query": "..." }`              | Hybrid retrieval + request logging. Returns `{documents, services, log_id, log_index}`. Each document carries `score` (fused), plus `semantic_score` and `lexical_score` — `null` when that retriever did not surface it. It also carries the two semantic-floor inputs in cosine units: `cosine_score` (what `MIN_SEMANTIC_SCORE` cuts on) and `cosine_score_ratio` (its fraction of the pool's best cosine, what `SEMANTIC_SCORE_RATIO` cuts on), both `null` for a document with no cosine of its own. |

Interactive docs: `http://localhost:8200/docs`.

## Configuration

All configuration lives in `app/vars.py` (overridable via `.env` — copy `.env.example`) and all text in `app/strings.py`. Service text is built from **templates + a field map** in `strings.py`: `SERVICE_FIELD_MACROS` maps each (possibly derived) field to a token (e.g. `name` → `%%NAME%%`); `SERVICE_EMBEDDING_TEXT_TEMPLATE` and `SERVICE_DISPLAY_TEXT_TEMPLATE` are Hebrew prose containing those tokens. `app/services/service_text_rendering/` builds the field values (`collect_union_of_list_fields` unions and dedupes each group of candidate source columns) and substitutes each macro. Two outputs are stored per service: the vectorized **`embedded_text`** and a richer **`context_text`** returned for display.

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
| `RETRIEVAL_EMBEDDINGS_INDEX_NAME` | `srm__services_retrieval_embeddings` | Dedicated embeddings index owned by this service; created automatically on first embed. **Paired with `EMBEDDING_PROVIDER`** — one index per provider, always changed together. The deployed local arm uses `srm__services_retrieval_embeddings_v3_enriched`. |
| `CARDS_INDEX_NAME` | `srm__cards` | Branch-level cards index published by the ETL, read-only: it supplies the service/organization/branch hierarchy and the card set that `REQUIRE_CARD_FOR_EMBEDDING` filters on. |

**Logging**

| Variable | Default | Description |
| --- | --- | --- |
| `RETRIEVAL_LOGS_INDEX_NAME` | `srm__retrieval_logs` | Base name for retrieval logs; each entry rolls into a weekly index `{name}_{week}_{year}`. |
| `RETRIEVAL_LOG_LEVEL` | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`, …). |

**Embedding — provider selection**

| Variable | Default | Description |
| --- | --- | --- |
| `EMBEDDING_PROVIDER` | `local` | Which embedder produces the vectors: `local` (bundled sentence-transformers model, 1024 dims) or `gemini` (Google embeddings API, 3072 dims). Resolved once per process, so a change needs a restart. **Always changed together with `RETRIEVAL_EMBEDDINGS_INDEX_NAME`** — see "Embedding providers". |

**Embedding — local provider** (ignored when `EMBEDDING_PROVIDER=gemini`)

| Variable | Default | Description |
| --- | --- | --- |
| `EMBEDDING_MODEL_PATH` | `artifacts/retrieval-model` | Path to the sentence-transformers retrieval (bi-encoder) model. Relative paths resolve against the service root; absolute paths are used as-is. |
| `EMBEDDING_PASSAGE_PREFIX` | `"passage: "` | E5-style prefix prepended to service text at embed time. Set empty for models that don't use prefixes. |
| `EMBEDDING_QUERY_PREFIX` | `"query: "` | E5-style prefix prepended to query text at embed time. Set empty for models that don't use prefixes. |

**Embedding — Gemini provider** (ignored when `EMBEDDING_PROVIDER=local`)

| Variable | Default | Description |
| --- | --- | --- |
| `GEMINI_EMBEDDER_API_KEY` | *(empty)* | Google API key for the embeddings endpoint. **Required for the `gemini` arm** and has no default; an empty value fails at startup with a readable message, so a `local` deployment never needs it. A secret — from `.env` locally, from the shared Kubernetes secret in the cluster. |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Model id passed to `embed_content`. |
| `GEMINI_EMBEDDING_DIMENSIONS` | `3072` | Requested output width. 3072 is native and unit-norm; the model is Matryoshka-trained, so 1536 / 768 are valid truncations that trade a little quality for index size. Any change here is a **new index**, not a re-tune of an existing one. |
| `GEMINI_EMBED_REQUEST_BATCH_SIZE` | `32` | Texts per API request. Independent of `SERVICE_EMBED_BATCH_SIZE` (the reindex batch), which the provider re-chunks to this. |
| `GEMINI_EMBED_MAX_ATTEMPTS` | `5` | Attempts per request before giving up. Retries on any exception, not a classified subset. |
| `GEMINI_EMBED_RETRY_BASE_SECONDS` | `2.0` | Backoff base: `base × 2^(attempt−1)` seconds, i.e. 2/4/8/16 s at the default. Raise this first if a reindex trips sustained 429s — before reaching for concurrency. |

**Reindex scan and batching**

| Variable | Default | Description |
| --- | --- | --- |
| `SERVICE_SCAN_BATCH_SIZE` | `500` | Services fetched per scroll page when scanning `srm_services` during a reindex. |
| `SERVICE_SCAN_SCROLL_KEEP_ALIVE` | `30m` | How long Elasticsearch keeps the reindex scroll context alive between pages. |
| `SERVICE_EMBED_BATCH_SIZE` | `64` | Services rendered, embedded (in one provider call), and bulk-indexed per reindex batch. |
| `REINDEX_PROGRESS_INTERVAL` | `100` | Processed services between the `progress` events streamed back to the reindex caller. |
| `REQUIRE_CARD_FOR_EMBEDDING` | `true` | Skip services with no branch card — 9,871 of 11,748 qualify. The card set is snapshotted at reindex start, so a service that gains its first card later stays unembedded until the next reindex. |
| `CARDS_SERVICE_ID_PAGE_SIZE` | `2000` | Composite-aggregation page size when paging distinct `service_id`s out of the cards index to build that snapshot. |

**Service source fields** — which `srm_services` column each rendered field reads. Only the single-column fields are overridable; the unioned groups (situations, organization names, response categories, organization kind) are lists in `app/vars.py`, since a union is not expressible as one env value.

| Variable | Default | Description |
| --- | --- | --- |
| `SERVICE_NAME_FIELD` | `name` | Service name — first clause of both the embedded and the display text. |
| `SERVICE_DESCRIPTION_FIELD` | `description` | Service description. |
| `SERVICE_DETAILS_FIELD` | `details` | Long details; HTML markup is stripped at the source-field level before rendering. |
| `SERVICE_PHONE_NUMBERS_FIELD` | `phone_numbers` | Display text only — kept out of the vector. |
| `SERVICE_EMAIL_FIELD` | `email_address` | Display text only. |
| `SERVICE_PAYMENT_REQUIRED_FIELD` | `payment_required` | Display text only. |
| `SERVICE_PAYMENT_DETAILS_FIELD` | `payment_details` | Display text only. |

**Retrieval**

| Variable | Default | Description |
| --- | --- | --- |
| `KNN_NUM_CANDIDATES` | `100` | HNSW candidate queue size per shard for the kNN search — an approximation-accuracy vs. speed knob, not a full-DB scan. |
| `CANDIDATE_POOL_SIZE` | `50` | How deep each retriever (kNN + BM25) looks before fusion — a recall ceiling. With every score cutoff off it is also the de-facto result cap; once a cutoff is on, it should sit well above any plausible answer size so the score, not the pool, decides the length. |
| `RRF_RANK_CONSTANT` | `60` | Rank constant `k` in the fusion score `1 / (k + rank)`; higher flattens rank gaps so fusion rewards cross-retriever agreement. |
| `SEMANTIC_WEIGHT` | `1.0` | Weight multiplied into each kNN reciprocal-rank contribution before fusion. Only the ratio to `LEXICAL_WEIGHT` matters; `1.0`/`1.0` is plain equal-weight RRF. |
| `LEXICAL_WEIGHT` | `1.0` | Same for BM25. `0` makes the fused ranking **kNN-only** — BM25 still runs and still reports a `lexical_score`, it just contributes nothing to fusion. |
| `MIN_FUSED_SCORE` | `0.0` | Minimum fused RRF score a service must reach. The fused score is a pure function of ranks, so the Nth-best value is near-identical for every query — this is a **fixed top-N cut, not a relevance cut**. At `LEXICAL_WEIGHT=0` it is not even that: BM25-only documents fuse to exactly `0.0`, so any positive value deletes the whole BM25-only block and additionally truncates the kNN list at `rank = 1/value − RRF_RANK_CONSTANT`. See "Tuning the score cut". Use the semantic floors below for a length that varies with the query. |
| `MIN_SEMANTIC_SCORE` | `-1.0` | Absolute floor on the kNN **cosine** (not the Elasticsearch score). `-1.0` is the cosine minimum, so the default cuts nothing. The only cutoff that can return an empty result — a ratio floor always keeps at least the top document. |
| `SEMANTIC_SCORE_RATIO` | `0.0` | Relative cosine floor: keep documents within this fraction of the best cosine in the pool; `0.0` disables it. This is the cutoff that adapts per query, and its useful band is **arm-specific** — on the `local` arm ~0.975–0.99, with anything at or under 0.96 keeping essentially the whole pool, while the `gemini` arm's wider spread moves the band down by ~0.02–0.03. Both distributions are measured in "Tuning the score cut" below; take the value from the column matching your `EMBEDDING_PROVIDER`. |
| `KEEP_LEXICAL_ONLY_DOCUMENTS` | `false` | How to treat documents BM25 surfaced but kNN did not, which carry no cosine. `false` imputes the kNN list minimum (a document absent from a kNN list of size N provably scores at or below the Nth-best cosine). `true` exempts them from both floors — BM25 returns `CANDIDATE_POOL_SIZE` hits for any non-empty query, so this pins the result length to the pool size and destroys count adaptivity. Escape hatch, not a default. |
| `MAX_RETURNED_SERVICES` | `0` | Hard cap on the returned list; `0` is uncapped. Counts **documents**, not services — the cards join drops card-less services and the `service_name` collapse dedupes, so `services` is always shorter. |

**Service hierarchy assembly**

| Variable | Default | Description |
| --- | --- | --- |
| `CARDS_INNER_HITS_SIZE` | `1000` | Max branches (inner hits) returned per service when collapsing the cards index by `service_id`. |
