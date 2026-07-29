# SPEC — Relevance Judging for the Retrieval Evaluation

Plan for the 7 missions on the `evaluation/` microservice. Written against the state of
`evaluation/` on branch `fix-embedding-text-and-reindex` (last commit touching it: `6aaf267 Eval enhancement`).

**How to read this document**

- **§0–§2** — why the work exists, what already exists, target architecture. Read once.
- **§3–§10** — the execution plan as `Mission → Phase → Task → Step`. This is the part to review.
- **§11** — reference appendix: the design reasoning behind the steps (prompt, cache, cost, tuning).
- **§12–§13** — risks and the convention checklist.

---

## 0. Why this work exists

The evaluation today scores retrieval against **what the incumbent staging site renders** for each
golden-set URL. That is a *proxy* for relevance, not relevance itself. The last full run says:

| Signal | Value | Reading |
| --- | --- | --- |
| `recall_at_returned` | **0.698** | We surface ~70% of the services the site shows, somewhere in our list. |
| `precision_at_returned` | **0.057** | 94% of what we return is not on the site. |
| `median_returned_count` / `median_ground_truth_count` | **282 / 8** | We return ~35× more than the site. |
| `mean_count_parity` | **0.082** | Almost no count parity. |
| Total `unexpected_retrieved` rows | **16,953** | Across 63 scored queries. |
| Total `missed_ground_truth` rows | **576** | |

Precision of 0.057 is either **a real ranking failure** or **an artifact of a ground truth that is
narrower than actual relevance**. The current pipeline cannot tell those apart. Missions 4–6 exist to
answer exactly that question: put an LLM judge on both sides of the diff, then audit the judge against
a human.

**This is the load-bearing risk of the whole plan.** If the judge says most of our 16,953 "false
positives" are genuinely relevant, then `precision_at_returned` is measuring the golden set, not the
retriever, and the priorities from mission 7 should change accordingly.

### 0.1 The retrieval configuration these numbers came from

`retrieval/.env` currently sets **`CANDIDATE_POOL_SIZE=500`** — 10× the documented default of 50 — and
**`LEXICAL_WEIGHT=0.2`**. Every truncation cutoff is unset, so all defaults apply and nothing is cut
(`MIN_SEMANTIC_SCORE=-1.0`, `SEMANTIC_SCORE_RATIO=0.0`, `MAX_RETURNED_SERVICES=0`,
`KEEP_LEXICAL_ONLY_DOCUMENTS=false`).

That pool size is the direct cause of the 282-services median and therefore of the 16,953-row judging
job: kNN returns 500 and BM25 returns 500, the union feeds fusion, and the name collapse lands at ~282.

**Do not change `retrieval/.env` before Phase 7.1.** See §11.4 for why the ordering matters.

### 0.2 The scores are currently thrown away

The final table must carry every score the retriever produced next to each relevance verdict — the same
values the mock FE renders as badges. **Today the evaluation discards all of them.**

`clients/retrieval_client.py:19-21` reads `services[].service_name` and nothing else. Verified shape of
`POST /api/retrieve`:

| Field | Where | Badge | Meaning |
| --- | --- | --- | --- |
| `score` | `documents[]` | `score 0.0164` | Fused RRF score — `1/(k+rank)` summed with per-retriever weights |
| `lexical_score` | `documents[]` | `bm25 5.168` | Raw BM25 score. `null` when BM25 never surfaced it |
| `semantic_score` | `documents[]` | — | Raw Elasticsearch cosine score, i.e. `(1 + cosine) / 2` |
| `cosine_score` | `documents[]` | `cosine 0.8508` | Recovered cosine — what `MIN_SEMANTIC_SCORE` cuts on |
| `cosine_score_ratio` | `documents[]` | `ratio 1.000` | Fraction of the pool's best cosine — what `SEMANTIC_SCORE_RATIO` cuts on |
| `service_id` | `documents[]` | `guidestar:a0y…` | |

**`services[]` carries no scores at all.** `Service` in `retrieval/app/schemas/service_hierarchy_schemas.py:36-45`
declares no score fields, so the `score` and `service_boost` keys that `create_service_from_card` sets
are silently dropped at serialization. Note also that those keys were the card's static boost, never the
retrieval score — so there is nothing here to reuse.

**Why the join is not trivial.** The evaluation matches by service *name*, and names are collapsed:

- `assemble_services_from_documents` derives `ranked_service_ids` from `documents[]`, preserving fused
  rank order.
- `order_services_by_ranking` walks those ids in order and keeps the **first** occurrence of each
  `service_name` — so the surviving service earned its rank from a specific document.
- But `build_service_hierarchy` iterates `card_hits` in **Elasticsearch return order**, so
  `services[i].id` is the service_id of the first *card hit* for that name — **not necessarily the
  best-ranked document's**.

So joining `services[i].id` back to `documents[]` attaches the wrong document's scores whenever a
service name spans several service_ids, which is exactly the case the name collapse exists for. The fix
must happen where both facts are known at once: `order_services_by_ranking`. Phase 2.1 does that.

**One side has no scores by construction.** `missed_ground_truth` services were never retrieved, so they
have no cosine, no BM25, no fused score. Those columns are legitimately empty there — see §11.9 for what
that means and an optional way to fill them.

---

## 1. Mission-by-mission status

Original mission text kept verbatim for traceability.

| # | Mission | Status | Plan |
| --- | --- | --- | --- |
| 1 | להוסיף Recall ALL | ✅ **Done** | §4 — verify only |
| 2 | להוסיף קובץ json שמראה פר שאילתה איזה שירותים אנחנו שלפנו שלא קיימים ב goldenset | 🟡 **Data done, file missing** | §5 |
| 3 | להוסיף קובץ json שמראה פר שאילתה איזה שירותים קיימים ב goldenset שלא שלפנו בכלל | 🟡 **Data done, file missing** | §6 |
| 4 | לשלוח גם את סעיף 2 וגם את סעיף 3 ל LLM חכם ולבקש פר שירות אם הוא רלוונטי לשאילתה ולהוציא כטבלה (csv) | ❌ **New** | §7 |
| 5 | להחזיק סטטיסטיקה של איזה אחוז מהדברים שלא שלפנו באמת לא רלוונטים, ואיזה אחוז מהדברים ששלפנו והמקור לא כן רלוונטים | ❌ **New** | §8 |
| 6 | לעבור ידנית על הטבלה מ 5 ולראות באיזה אחוז מהמקרים הוא נתן הערכה נכונה, והוספת סכימה באיזה אחוז המעריך האנושי מסכים עם ה LLM | ❌ **New** | §9 |
| 7 | לשבת עם אלי, ועם התעדוף שעשינו להבין מה תקין ומה לא | ❌ **New (process)** | §10 |

### 1.1 What is already built

The service is in good shape and already follows the coding conventions (one purpose per file, files
under 100 lines, pure functions, all text in `strings.py`, all config in `vars.py` / `scraper_vars.py`).

- **Pipeline**: `run_evaluation.py` → `load_dataset` → `load_ground_truth` (scrape + cache) →
  `evaluate_dataset` → `aggregate_metrics` → `compute_overall_score` → `write_results` → threshold gate.
- **Metrics**: 7 metrics × 5 cutoffs (`k ∈ {3,5,10,25,50}`), plus set-level metrics over the full
  returned list, plus count-parity statistics.
- **Both diffs already exist** as first-class fields on `QueryEvaluation` (`schemas.py:35-36`), already
  serialized into `summary.json` (`report/serialize_summary.py:16-17`) and flattened into
  `results/service_diff.csv`.
- **Outputs**: `summary.json`, `per_query.csv`, `service_diff.csv`, `report.html` (236-line
  self-contained dashboard).

---

## 2. Target architecture

New files, all following the existing conventions (≤100 lines/file, ≤30 lines/function, pure
functions, `try/except` only at the orchestrator, no hardcoded text).

```
retrieval/                          MODIFIED  M2 Phase 2.1 — additive only
├─ app/schemas/service_hierarchy_schemas.py   EXTEND  5 optional score fields on Service
└─ app/services/service_hierarchy/
   ├─ order_services_by_ranking.py           EXTEND  attach the winning document's scores
   └─ assemble_services_from_documents.py    EXTEND  pass documents through

evaluation/
├─ relevance_vars.py            NEW  M4  model, effort, chunk size, paths, verdict + cache keys, seed
├─ relevance_strings.py         NEW  M4  judge system prompt, CSV headers, log lines
├─ clients/
│  └─ llm_client.py             NEW  M4  Anthropic Batches API: submit / wait / stream results
├─ relevance/                   NEW  M4
│  ├─ judgement_cache.py             load / save / checksum-invalidate
│  ├─ build_judgement_items.py       the two diff JSON files → JudgementItem list
│  ├─ chunk_judgement_items.py       group by (query, side), split at chunk size
│  ├─ judgement_schema.py            JSON schema for structured output
│  ├─ build_judgement_request.py     one Batches request
│  ├─ parse_judgement_result.py      batch result → ServiceJudgement list
│  └─ judge_relevance.py             orchestrator
├─ human_review/                NEW  M6
│  ├─ build_review_sample.py         stratified sample → blank-verdict CSV
│  ├─ load_review_verdicts.py        read the filled-in CSV back
│  └─ align_verdicts.py              join human verdicts to LLM judgements
├─ metrics/
│  ├─ aggregate_relevance_statistics.py   NEW  M5
│  ├─ adjusted_set_metrics.py             NEW  M5
│  └─ agreement_statistics.py             NEW  M6
├─ report/
│  ├─ build_service_diff_json.py     NEW  M2 + M3
│  ├─ write_relevance_csv.py         NEW  M4  the final scores + verdicts table
│  ├─ build_score_band_table.py      NEW  M4  verdict share per cosine / ratio band
│  ├─ build_relevance_table.py       NEW  M5
│  └─ write_agreement_report.py      NEW  M6
├─ clients/retrieval_client.py   EXTEND  M2  return the score map alongside the names
├─ evaluate_dataset.py           EXTEND  M2  thread the score map through
├─ metrics/evaluate_query.py     EXTEND  M2  carry scores onto QueryEvaluation (no metric change)
├─ data/
│  └─ relevance-judgements.json  NEW  M4  committed label cache
└─ schemas.py                   EXTEND  ServiceScores + service_scores on QueryEvaluation (M2),
                                        ServiceJudgement (M4), HumanVerdict (M6)
```

### 2.1 Data flow

```
summary.json (existing)
   │
   ├─► unexpected_retrieved.json ──┐   M2
   └─► missed_ground_truth.json ───┤   M3
                                   ▼
                      relevance/judge_relevance.py            M4
                      Batches API + data/relevance-judgements.json
                                   │
                                   ▼
                        relevance_judgements.csv              M4 deliverable
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
   aggregate_relevance_statistics.py     build_review_sample.py        M6
   + adjusted_set_metrics.py    M5                │
                    │                             ▼
                    │                    human_review_sample.csv
                    │                    → filled in by a human
                    ▼                             ▼
             summary.json                agreement_statistics.py
             + dashboard                 → agreement_report.json
                    └──────────────┬──────────────┘
                                   ▼
                    operating-point sweep → session with Eli   M7
```

---

## 3. Execution plan — conventions and global gates

### 3.1 Hierarchy

```
Mission  = one of the 7 original missions
  Phase  = a shippable unit; ends with something reviewable. One branch / PR.
    Task = one coherent change. One commit.
      Step = one file, or one single action.
```

IDs are `Mission.Phase.Task.Step` — e.g. Step 4.2.3.1. Not every mission has multiple phases and not
every task has multiple steps; the hierarchy is kept even when a level has one child.

### 3.2 Order and gates

| Order | Missions | Gate before starting |
| --- | --- | --- |
| 1 | M2 → M3 | none |
| 2 | M4 | M2 + M3 merged (M4 reads their output files) |
| 3 | M5 | M4 Phase 4.3 complete (labels exist) |
| 4 | M6 | M5 Phase 5.1 complete (statistics exist to sample from) |
| 5 | M7 | **M6 gate passed** (Task 6.2.3) |

Three hard rules:

- **`retrieval/.env` is frozen until Phase 7.1.** Changing it mid-plan invalidates the judged labels
  and the baseline comparison. Reasoning in §11.4. Note this is about **config values**; Phase 2.1
  changes retrieval *code* additively and is not affected.
- **No adjusted metric is presented without its agreement number.** M6 is a gate, not a report.
- **Every score the retriever produced reaches the final table unmodified.** No rounding, no
  recomputation, no zero-for-null substitution. Step 4.2.5.5 is the end-to-end check.

Phase 2.1 is the only phase that touches `retrieval/`. It is additive (five optional response fields)
and changes no default behaviour, but it needs review from whoever owns retrieval, and it should land as
its own PR ahead of everything else.

### 3.3 Effort summary

| Mission | Phases | Est. |
| --- | --- | --- |
| M1 | 1 | 0 (verify only) |
| M2 | 2 | 1.5 d (0.5 d score plumbing incl. retrieval, 0.5 d the file, 0.5 d verification) |
| M3 | 1 | 0.1 d (reuses M2) |
| M4 | 3 | 2.5–3.5 d (+0.5 d for the score-band table) |
| M5 | 2 | 1 d |
| M6 | 2 | 1 d + 2–3 h human review |
| M7 | 2 | 0.5 d + the session |

---

## 4. Mission 1 — Recall ALL

**Status: already implemented.** No code work.

### Phase 1.1 — Verify and document

#### Task 1.1.1 — Confirm the metric is Recall ALL

- **Step 1.1.1.1** — Confirm `metrics/compute_returned_set_metrics.py:20-22` computes
  `recall_at_returned = count_hits(ranked_names, ground_truth) / len(ground_truth)`, where `count_hits`
  scans the **entire** returned list (its docstring at line 7-8 explicitly rejects the per-k slice).
- **Step 1.1.1.2** — Confirm it is averaged in `metrics/aggregate_set_metrics.py`, written to
  `per_query.csv`, printed in the console "Set metrics over the returned list" table, and rendered in
  the dashboard.
- **Step 1.1.1.3** — Record the current value (**0.698**) as the mission-1 answer.

#### Task 1.1.2 — Make it findable

- **Step 1.1.2.1** — `README.md`: add the phrase "Recall ALL" as an alias next to `Recall@returned` in
  the set-metrics table, so the next person searching the mission name lands on the right metric.

---

## 5. Mission 2 — JSON of what we retrieved that isn't in the golden set

**Deliverable:** `results/unexpected_retrieved.json`, **with per-service scores**. Payload shape §11.1.

### Phase 2.1 — Carry the retrieval scores through

*Cross-cutting prerequisite: M2, M3 and M4 all need these values. Reasoning and verified field names in
§0.2. **This phase touches `retrieval/`** and needs its own review — all changes are additive optional
fields, no default behaviour changes, and a full re-scrape is not required.*

#### Task 2.1.1 — Attach the winning document's scores to each collapsed service (retrieval side)

- **Step 2.1.1.1** — `retrieval/app/schemas/service_hierarchy_schemas.py`: add five optional fields to
  `Service` — `retrieval_score`, `semantic_score`, `lexical_score`, `cosine_score`,
  `cosine_score_ratio`, all `Optional[float] = None`. Name the fused one `retrieval_score`, **not**
  `score`, so it can never be confused with the card boost that `create_service_from_card` already sets
  and that the schema currently drops.
- **Step 2.1.1.2** — `retrieval/app/services/service_hierarchy/order_services_by_ranking.py`: accept the
  fused `retrieved_documents` and, for each surviving name, attach the scores of **the document whose
  service_id won that name** — i.e. the one being iterated when the name was first seen. This is the only
  place where fused rank order and name collapse are both in hand.
- **Step 2.1.1.3** — `retrieval/app/services/service_hierarchy/assemble_services_from_documents.py`: pass
  `retrieved_documents` through to `order_services_by_ranking`.
- **Step 2.1.1.4** — Keep both functions ≤30 lines; if the attach logic pushes past it, split the
  score-mapping helper into its own file.
- **Step 2.1.1.5** — Verify against one query in the mock FE: for a service name that appears once, the
  attached values must equal that document's badges exactly. For a name spanning several service_ids,
  confirm the attached values come from the **best-ranked** of them, not an arbitrary card hit.
- **Step 2.1.1.6** — Confirm `documents[]` is unchanged and no existing field was renamed, so the mock FE
  and any BE consumer keep working.

#### Task 2.1.2 — Read the scores in the evaluation client

- **Step 2.1.2.1** — `evaluation/schemas.py`: add a frozen `ServiceScores(retrieval_score,
  semantic_score, lexical_score, cosine_score, cosine_score_ratio)`, all `float | None`.
- **Step 2.1.2.2** — `evaluation/clients/retrieval_client.py`: return the ranked names **and** a
  `dict[str, ServiceScores]` keyed by normalized service name. Keep reading `services[]` for the name
  list — the README explains why that is the right side to match on — and read the scores from the same
  entries now that Task 2.1.1 put them there.
- **Step 2.1.2.3** — Apply `normalize_service_name` to the score-map keys too, so they match the names
  `normalize_and_dedupe` produces. A score map keyed on raw names silently misses every name that needed
  normalizing.
- **Step 2.1.2.4** — `None` stays `None`. A retriever that never surfaced a document is not the same as
  one that scored it zero — `attach_retriever_scores` is explicit about this and the distinction must
  survive into the CSV.

#### Task 2.1.3 — Carry scores onto the evaluation record

- **Step 2.1.3.1** — `evaluation/schemas.py`: add `service_scores: dict[str, ServiceScores]` to
  `QueryEvaluation` (default empty, so skipped queries stay valid).
- **Step 2.1.3.2** — `evaluation/evaluate_dataset.py` and `metrics/evaluate_query.py`: thread the score
  map through. **No metric changes** — scores are carried, never scored on.
- **Step 2.1.3.3** — `report/serialize_summary.py`: serialize the score map per query.
- **Step 2.1.3.4** — Regression check: `overall_score` byte-identical before and after this phase.

### Phase 2.2 — Emit the file

#### Task 2.2.1 — Config and text constants

- **Step 2.2.1.1** — `vars.py`: add `UNEXPECTED_RETRIEVED_JSON_PATH` and `MISSED_GROUND_TRUTH_JSON_PATH`
  under the existing results-path block (M3 uses the second one; declaring both now avoids touching
  this file twice).
- **Step 2.2.1.2** — `vars.py`: add the payload key constants (`DIFF_JSON_SIDE_KEY`,
  `DIFF_JSON_QUERIES_KEY`, `DIFF_JSON_COUNT_KEY`, `DIFF_JSON_SERVICES_KEY`,
  `DIFF_JSON_GENERATED_FROM_KEY`) and the five score keys.
- **Step 2.2.1.3** — `strings.py`: extend `LOG_WROTE_RESULTS` with two new named params. One call site
  (`run_evaluation.py:58`) — update it in Step 2.2.3.2.

#### Task 2.2.2 — The payload builder

- **Step 2.2.2.1** — Create `report/build_service_diff_json.py` with a private
  `_build_query_entry(entry, names_key)` returning one query's dict: `query`, `ground_truth_size`,
  `returned_count`, `count`, `services`, and `skip_reason` when set.
- **Step 2.2.2.2** — Same file: each element of `services` is
  `{rank, service_name, retrieval_score, semantic_score, lexical_score, cosine_score, cosine_score_ratio}`
  — an object per service rather than a bare name string, so the scores travel with it. `rank` is the
  1-based position within its own side.
- **Step 2.2.2.3** — Same file: `build_unexpected_payload(summary)` — wraps the entries with `side`,
  `generated_from`, and `meta` copied from `summary['meta']`.
- **Step 2.2.2.4** — Skipped queries: emit `count: null` and `services: []`, mirroring how
  `build_per_query_rows.py:34-38` blanks skipped cells instead of writing zeroes.
- **Step 2.2.2.5** — Do **not** re-sort. Order is rank, already guaranteed by
  `metrics/compute_service_name_diff.py`.
- **Step 2.2.2.6** — Confirm the file is ≤100 lines and every function ≤30.

#### Task 2.2.3 — Wire into the writer

- **Step 2.2.3.1** — `report/write_results.py`: add `write_unexpected_retrieved_json(summary)` using
  `ensure_ascii=False, indent=2`, matching `write_summary_json`.
- **Step 2.2.3.2** — `report/write_results.py`: call it from `write_results`; update the
  `LOG_WROTE_RESULTS` call in `run_evaluation.py`.

#### Task 2.2.4 — Verify

- **Step 2.2.4.1** — Run one full evaluation (Phase 2.1 changed the retrieval response, so the committed
  `results/summary.json` no longer has the score fields — this phase does need a live run).
- **Step 2.2.4.2** — Assert: 65 query entries; total `count` == 16,953; Hebrew unescaped; skipped queries
  carry `null`; **every** entry on the unexpected side has all five scores populated.
- **Step 2.2.4.3** — Spot-check one query against the mock FE badges for the same query — the numbers
  must match to the displayed precision.
- **Step 2.2.4.4** — `README.md`: add the file to the Outputs section, noting `results/` is gitignored so
  this is a run artifact, not committed data.

---

## 6. Mission 3 — JSON of golden-set services we never retrieved

**Deliverable:** `results/missed_ground_truth.json`. Same shape as M2, other side of the diff.

> Mission 3 deliberately reuses everything M2 built. If M2 is done properly this is one small task.

### Phase 3.1 — Emit the file

#### Task 3.1.1 — Second payload and writer

- **Step 3.1.1.1** — `report/build_service_diff_json.py`: add `build_missed_payload(summary)`, reusing
  the same private `_build_query_entry`. Same-scope multi-export is allowed and mirrors the existing
  `build_service_diff_rows.py`.
- **Step 3.1.1.2** — `report/write_results.py`: add `write_missed_ground_truth_json(summary)` and call
  it from `write_results`.
- **Step 3.1.1.3** — Emit the same five score keys as `null` on this side. These services were never
  retrieved, so they have no cosine, no BM25 and no fused score — see §11.9. Emit the keys explicitly
  rather than omitting them, so the two files share one schema and the M4 CSV has a stable column set.
- **Step 3.1.1.4** — Verify as in Task 2.2.4: total `count` == 576; all five score fields `null`.
- **Step 3.1.1.5** — `README.md`: add the second file to Outputs.

---

## 7. Mission 4 — LLM relevance judging

**Deliverable:** `results/relevance_judgements.csv` + committed `data/relevance-judgements.json`.

> **Rule 7 applies in full.** All understanding, parsing and decision-making stays with the LLM. No code
> may pre-filter, keyword-match, score, or hint. If the judge is wrong, the fix is the **prompt, worked
> examples, or model choice** — never code that does part of the judging.

Design reasoning: model and API choices §11.2, cache §11.3, prompt §11.5, cost §11.6.

### Phase 4.1 — Plumbing (no LLM calls in anger)

*Goal: everything except the prompt, verifiable with two hand-written requests.*

#### Task 4.1.1 — Config and text

- **Step 4.1.1.1** — Create `relevance_vars.py`: `JUDGE_MODEL='claude-opus-5'`, `JUDGE_EFFORT='low'`,
  `JUDGEMENT_CHUNK_SIZE=40`, `JUDGE_MAX_TOKENS`, `JUDGEMENT_CACHE_PATH`,
  `RELEVANCE_JUDGEMENTS_CSV_PATH`, verdict constants (`VERDICT_RELEVANT`, `VERDICT_IRRELEVANT`,
  `VERDICT_UNCLEAR`), cache keys, `REVIEW_SAMPLE_SEED`, `JUDGEMENT_SCHEMA_VERSION`. Split out of
  `vars.py` following the `scraper_vars.py` precedent.
- **Step 4.1.1.2** — Create `relevance_strings.py`: the judge system prompt, CSV headers, log lines,
  error messages.

#### Task 4.1.2 — Schema

- **Step 4.1.2.1** — `schemas.py`: add frozen `ServiceJudgement(query, side, rank, service_name,
  verdict, reason)`.

#### Task 4.1.3 — Dependency and credentials

- **Step 4.1.3.1** — `requirements.txt`: add `anthropic`, pinned, with a comment matching the file's
  existing convention.
- **Step 4.1.3.2** — `.env.example`: add `ANTHROPIC_API_KEY=` (name only, never a value).
- **Step 4.1.3.3** — Confirm `.env` is gitignored in `evaluation/.gitignore`. It is — no change, just
  verify before the first key is written.

#### Task 4.1.4 — LLM client

- **Step 4.1.4.1** — Create `clients/llm_client.py`: `submit_judgement_batch(requests)`,
  `wait_for_batch(batch_id)` (poll `processing_status` until `ended`), `stream_batch_results(batch_id)`.
  `try/except` is allowed here and in `run_evaluation.py` only.
- **Step 4.1.4.2** — Smoke test with two hand-written requests. Confirm results are keyed by
  `custom_id` and **may arrive in any order** — never index by position.
- **Step 4.1.4.3** — Confirm no `fallbacks` parameter is passed; it is rejected on the Batches API.

#### Task 4.1.5 — Judgement cache

- **Step 4.1.5.1** — Create `relevance/judgement_cache.py`: `load_judgement_cache()`,
  `save_judgement_cache(judgements)`, `compute_prompt_checksum()`, and invalidation on
  `model` / `prompt_checksum` / `schema_version` mismatch. Model it on
  `ground_truth/ground_truth_cache.py`.
- **Step 4.1.5.2** — Key strictly on `(query, service_name)` — never rank, never side. Both change with
  retrieval config; the verdict does not.
- **Step 4.1.5.3** — Verify: save/load round trip, and that editing the prompt invalidates the cache.

### Phase 4.2 — The judge

#### Task 4.2.1 — Items and chunks

- **Step 4.2.1.1** — Create `relevance/build_judgement_items.py`: read
  `results/unexpected_retrieved.json` and `results/missed_ground_truth.json`, emit a flat item list
  carrying `(query, side, rank, service_name)`.
- **Step 4.2.1.2** — Create `relevance/chunk_judgement_items.py`: group by `(query, side)`, split each
  group at `JUDGEMENT_CHUNK_SIZE`. ~440 chunks at size 40.

#### Task 4.2.2 — Request construction

- **Step 4.2.2.1** — Create `relevance/judgement_schema.py`: the structured-output JSON schema.
  `additionalProperties: false` on every object, all fields in `required`, no numeric or string
  constraints (unsupported).
- **Step 4.2.2.2** — Create `relevance/build_judgement_request.py`: one Batches request per chunk —
  `custom_id`, system prompt with `cache_control: {"type": "ephemeral"}`, user payload of
  `{query, services: [{id, name}]}`, `output_config: {effort, format}`, `max_tokens` with headroom.
- **Step 4.2.2.3** — Do **not** set `thinking: {"type": "disabled"}`. Thinking is on by default on
  Opus 5 and counts against `max_tokens`; disabling it has documented failure modes and is rejected
  above `effort: high`. `effort` is the cost lever.

#### Task 4.2.3 — Result parsing

- **Step 4.2.3.1** — Create `relevance/parse_judgement_result.py`: batch result → `ServiceJudgement`
  list, joining back to items via `custom_id` and the echoed per-item `id`.
- **Step 4.2.3.2** — Assert every submitted `custom_id` came back and every item id inside each chunk
  got exactly one verdict. Raise on any gap — a silently dropped chunk looks like valid output.
- **Step 4.2.3.3** — Handle `stop_reason == "refusal"` and `"max_tokens"` explicitly: log the chunk,
  do not write a verdict, count it as unjudged.

#### Task 4.2.4 — Orchestrator

- **Step 4.2.4.1** — Create `relevance/judge_relevance.py`: items → drop cache hits → chunk → submit →
  wait → parse → merge into cache → save → return the full judgement list.

#### Task 4.2.5 — The final table

*This is the deliverable the whole plan converges on: every score next to its verdict.*

- **Step 4.2.5.1** — Create `report/write_relevance_csv.py` writing
  `results/relevance_judgements.csv` with exactly these columns, in this order:

  ```
  query, side, rank, service_name,
  retrieval_score, cosine_score, cosine_score_ratio, lexical_score, semantic_score,
  verdict, reason, model, judged_at
  ```

- **Step 4.2.5.2** — Scores come from the two diff JSON files (Phase 2.1 → 2.2 → 3.1), never re-derived.
  On the `missed_ground_truth` side they are empty by construction (§11.9); write blank cells, not zeroes.
- **Step 4.2.5.3** — Column order is deliberate: identity, then scores in the order the FE badges read
  them (fused → cosine → ratio → bm25), then the verdict. It should be pivotable in Excel without
  rearranging.
- **Step 4.2.5.4** — Reuse the existing `side` constants so the table joins to `service_diff.csv` on
  `(query, side, rank)`.
- **Step 4.2.5.5** — Verify the full chain on one query: pick a service from the mock FE, confirm its four
  badge values appear unchanged in this CSV alongside a verdict. **This is the "passes all the way"
  check** — retrieval → client → evaluation → diff JSON → judge → CSV.
- **Step 4.2.5.6** — Assert row count == judged pairs, and that no row has a verdict without an identity
  or an identity without a verdict.

#### Task 4.2.6 — Score-banded verdict summary

*The reason for carrying the scores: it answers "where in the score range does the judge disagree with
the golden set?" — which is exactly what picks the operating point in Phase 7.1. Interpretation in §11.10.*

- **Step 4.2.6.1** — Create `report/build_score_band_table.py`: bucket the judged `unexpected_retrieved`
  rows by `cosine_score` band (e.g. 0.05-wide bands) and report per band the count and the share judged
  `relevant` / `irrelevant` / `unclear`.
- **Step 4.2.6.2** — Do the same for `cosine_score_ratio`, since that is what `SEMANTIC_SCORE_RATIO`
  actually cuts on — the band table over the ratio *is* the threshold-selection evidence.
- **Step 4.2.6.3** — Write it to `results/relevance_by_score_band.csv` and print it to console.
- **Step 4.2.6.4** — Read the shape before Phase 7.1 and record which of the three §11.10 cases it is.

#### Task 4.2.7 — CLI

- **Step 4.2.7.1** — `run_evaluation.py`: add `--judge` and `--judge-limit N`. Judging is **opt-in**;
  the default run must stay free, offline and reproducible.
- **Step 4.2.7.2** — When `--judge-limit` is set, `log()` exactly how many pairs were skipped. A
  silently truncated judgement set reads as full coverage in the M5 statistics.

### Phase 4.3 — Calibrate, then run

#### Task 4.3.1 — Token baseline

- **Step 4.3.1.1** — Run `client.messages.count_tokens(model='claude-opus-5', ...)` on one
  representative chunk. Record actual input tokens against the §11.6 estimate. Do not use `tiktoken` —
  it is OpenAI's tokenizer and undercounts Hebrew badly.

#### Task 4.3.2 — Prompt iteration on a slice

- **Step 4.3.2.1** — Run `--judge --judge-limit 200`. Cost: a few cents.
- **Step 4.3.2.2** — Measure the `unclear` rate and read 20 verdicts by hand.
- **Step 4.3.2.3** — If `unclear` > 10%: this is the name-only-vs-enriched decision (§11.5) — resolve it
  before iterating further, rather than tuning the prompt around missing information.
- **Step 4.3.2.4** — Revise **prompt only** (rule 7) and repeat until `unclear` ≤ 10% and the
  spot-check reads correctly.

#### Task 4.3.3 — Full run

- **Step 4.3.3.1** — Run `--rescrape` first. The ground-truth cache only invalidates on CSV checksum or
  base-URL change, never on staging content changing, so refresh it immediately before judging.
- **Step 4.3.3.2** — Full `--judge` over all 17,529 pairs. ~$13.
- **Step 4.3.3.3** — Commit `data/relevance-judgements.json`. It is the reproducible labelled dataset
  and lets a clean checkout compute adjusted metrics with no API key.
- **Step 4.3.3.4** — Record the retrieval configuration (`CANDIDATE_POOL_SIZE`, weights, all cutoffs)
  and the scrape date alongside the labels.

---

## 8. Mission 5 — relevance statistics

**Deliverable:** a `relevance` block in `summary.json`, a console table, a dashboard panel.

Definitions in §11.7.

### Phase 5.1 — Compute

#### Task 5.1.1 — Verdict statistics

- **Step 5.1.1.1** — Create `metrics/aggregate_relevance_statistics.py`: per side, the counts of
  `relevant` / `irrelevant` / `unclear` / unjudged, plus `missed_truly_irrelevant_rate` and
  `unexpected_actually_relevant_rate`.
- **Step 5.1.1.2** — Exclude `unclear` from rate denominators, and always emit the raw counts next to
  each rate. A rate over a shrunken denominator is misleading on its own.
- **Step 5.1.1.3** — Never fold `unclear` into `irrelevant`. It is its own bucket end to end.

#### Task 5.1.2 — Adjusted metrics

- **Step 5.1.2.1** — Create `metrics/adjusted_set_metrics.py`:
  `adjusted_precision_at_returned = (hits + unexpected_judged_relevant) / |R|`,
  `adjusted_recall_at_returned = hits / (|G| − missed_judged_irrelevant)`, and
  `adjusted_f1_at_returned` from the two.

### Phase 5.2 — Surface

#### Task 5.2.1 — `summary.json`

- **Step 5.2.1.1** — `report/serialize_summary.py`: add a `relevance` **sibling** block next to
  `set_metrics` and `count_stats`.
- **Step 5.2.1.2** — Never put these keys inside `metrics`. `compute_overall_score` averages whatever
  keys it finds in each per-k dict, so folding them in silently redefines the headline score and breaks
  comparison with `results-arm0-baseline/`. `aggregate_metrics.py:31-36` documents this hazard.
- **Step 5.2.1.3** — Add a regression check asserting `overall_score` is byte-identical with and
  without `--judge`.

#### Task 5.2.2 — Console

- **Step 5.2.2.1** — Create `report/build_relevance_table.py`.
- **Step 5.2.2.2** — `run_evaluation.py`: print it via `render_titled_table` only when the block exists.
- **Step 5.2.2.3** — `strings.py`: labels and table title.

#### Task 5.2.3 — Dashboard

- **Step 5.2.3.1** — `dashboard/dashboard.html`: add a relevance panel that renders nothing when the
  block is absent, so an un-judged run still produces a valid dashboard.

---

## 9. Mission 6 — human audit of the judge

**Deliverable:** `results/human_review_sample.csv` out, `results/agreement_report.json` back.

Field definitions and the acceptance bar in §11.8.

### Phase 6.1 — Sheet out

#### Task 6.1.1 — Stratified sample

- **Step 6.1.1.1** — Create `human_review/build_review_sample.py`: stratify by `side × verdict` so the
  rare cells (all 576 missed rows; every `unclear`) are represented rather than drowned by the
  16,953-row unexpected side.
- **Step 6.1.1.2** — Draw with `REVIEW_SAMPLE_SEED` from `relevance_vars.py` so the sheet is
  reproducible and two reviewers can be handed the identical rows.
- **Step 6.1.1.3** — Shuffle rows and **withhold the `verdict` and `reason` columns**. Showing the LLM's
  answer first is anchoring and would make the agreement number meaningless.
- **Step 6.1.1.4** — **Withhold the score columns too.** The reviewer is judging whether a service helps
  someone who asked that query — a cosine of 0.85 is not evidence for that, but it will read as
  evidence and pull the human toward the retriever's opinion. The scores belong in the final joined
  table (Task 4.2.5), not in the sheet a human answers from.

#### Task 6.1.2 — Emit

- **Step 6.1.2.1** — `run_evaluation.py`: add `--review-sample N` (default 200).
- **Step 6.1.2.2** — Write `review_id, query, side, rank, service_name, human_verdict, human_notes`
  with the last two blank.

### Phase 6.2 — Verdicts in

#### Task 6.2.1 — Read back

- **Step 6.2.1.1** — Create `human_review/load_review_verdicts.py`.
- **Step 6.2.1.2** — Create `human_review/align_verdicts.py` joining on `review_id`.
- **Step 6.2.1.3** — `schemas.py`: add frozen `HumanVerdict`.
- **Step 6.2.1.4** — Tolerate partially-filled sheets: report `reviewed_count` separately from
  `sample_size` rather than treating a blank as a verdict.

#### Task 6.2.2 — Agreement

- **Step 6.2.2.1** — Create `metrics/agreement_statistics.py`: `raw_agreement`, `cohens_kappa`,
  `confusion_by_side` (3×3 per side), `agreement_by_verdict`, `disagreement_rows`. Pure; κ is a few
  lines of arithmetic, no new dependency.
- **Step 6.2.2.2** — Create `report/write_agreement_report.py`.
- **Step 6.2.2.3** — `run_evaluation.py`: add `--agreement`.

#### Task 6.2.3 — The gate

- **Step 6.2.3.1** — Check `raw_agreement ≥ 0.85` **and** `cohens_kappa ≥ 0.60`. Report both always: with
  a skewed verdict distribution raw agreement can look excellent while κ is near zero, which means the
  judge is guessing the majority class.
- **Step 6.2.3.2** — If below the bar: return to Task 4.3.2, revise the **prompt only**, re-judge (the
  cache invalidates on prompt change), and re-sample. Do not proceed to M7.
- **Step 6.2.3.3** — If at or above the bar: the M5 adjusted metrics are usable. Proceed.

---

## 10. Mission 7 — decide what is OK and what is not

### Phase 7.1 — Pick the operating point

*This is the first point at which `retrieval/.env` may change. Reasoning in §11.4.*

#### Task 7.1.1 — Offline sweep against cached labels

- **Step 7.1.1.1** — Build a sweep script that re-scores the existing per-query returned lists at
  candidate `SEMANTIC_SCORE_RATIO` and `MAX_RETURNED_SERVICES` values, reading verdicts from the
  committed cache. **No LLM calls** — every narrower setting is a subset of the current wide config
  (§11.3).
- **Step 7.1.1.2** — Produce a table of `f1_at_returned` **and** `adjusted_f1_at_returned` per
  candidate; locate the interior maximum of the adjusted curve.
- **Step 7.1.1.3** — Report both curves side by side. The gap between them is the M7 finding.
- **Step 7.1.1.4** — Cross-check the winner against the Task 4.2.6 band table: the chosen
  `SEMANTIC_SCORE_RATIO` should sit at or just above the band where the `relevant` share drops. If the
  adjusted-F1 maximum and the band cliff disagree, do not average them — work out why before choosing
  (usually it means one query with a large ground truth is dominating the macro mean).

#### Task 7.1.2 — Verify the winner live

- **Step 7.1.2.1** — Set the chosen values in `retrieval/.env`, restart the service (`app/vars.py`
  loads `.env` at import).
- **Step 7.1.2.2** — Full evaluation run; judge only the newly-surfaced pairs (cache covers the rest).
- **Step 7.1.2.3** — Compare predicted vs. actual adjusted F1. A gap means fusion reordering, which is
  expected only if `CANDIDATE_POOL_SIZE` changed.

### Phase 7.2 — The session with Eli

#### Task 7.2.1 — Numbers to bring

- **Step 7.2.1.1** — `raw_agreement` and `cohens_kappa` **first**. They set how much weight everything
  after them deserves.
- **Step 7.2.1.2** — `missed_truly_irrelevant_rate` and `unexpected_actually_relevant_rate`.
- **Step 7.2.1.3** — Adjusted precision / recall / F1 against their raw counterparts. The size of the
  gap is the finding.
- **Step 7.2.1.4** — The operating-point sweep table from Task 7.1.1.
- **Step 7.2.1.5** — Current headline (`overall_score`, metric × k matrix, count parity) and
  `results-arm0-baseline/` for movement.

#### Task 7.2.2 — Questions to close

- **Step 7.2.2.1** — **Is the golden set the right ground truth?** If
  `unexpected_actually_relevant_rate` is high, the staging site is narrower than relevance and
  `precision_at_returned` is not a retrieval metric.
- **Step 7.2.2.2** — **What is the target operating point?** Adopt the Task 7.1.1 winner or override it.
- **Step 7.2.2.3** — **Is returning ~282 services per query acceptable?** `mean_count_parity` 0.082.
  Product decision, not an evaluation one — see §11.4.
- **Step 7.2.2.4** — **Which thresholds become the CI gate?** `MIN_OVERALL_SCORE` and
  `PER_METRIC_THRESHOLDS` in `vars.py` are still empty; the pipeline always exits 0.
- **Step 7.2.2.5** — **Do judged verdicts feed back into the golden set?** If judge and human agree a
  service is relevant, should it be added to `data/Raw-Golden-Set.csv`? That turns this from measurement
  into ground-truth curation — a scope decision.
- **Step 7.2.2.6** — **The 2 unsupported rows** (`/p/card/c/35e9b749`, `/internal_emergency_services`) —
  fix or permanently exclude?

#### Task 7.2.3 — Record the outcome

- **Step 7.2.3.1** — Append a decision log to this file: agreed thresholds, agreed ground-truth policy,
  agreed priority order, agreed operating point.

---

## 11. Reference — design decisions behind the steps

### 11.1 Diff JSON payload shape (M2, M3)

```json
{
  "side": "unexpected_retrieved",
  "generated_from": "results/summary.json",
  "meta": { "num_queries": 65, "num_evaluated": 59, "num_skipped_unsupported": 2 },
  "queries": [
    {
      "query": "<hebrew query>",
      "ground_truth_size": 19,
      "returned_count": 4,
      "count": 2,
      "services": [
        {
          "rank": 1,
          "service_name": "<name>",
          "retrieval_score": 0.0164,
          "cosine_score": 0.8508,
          "cosine_score_ratio": 1.0,
          "lexical_score": null,
          "semantic_score": 0.9254
        }
      ]
    }
  ]
}
```

`services` is a list of objects, not bare name strings, so the scores travel with each service. Order is
the rank: `missed_ground_truth` keeps the site's render order, `unexpected_retrieved` keeps retrieval's
rank order. On the `missed_ground_truth` side all five score fields are `null` (§11.9). Empty-ground-truth
queries are included (they have a real unexpected list). Written with `ensure_ascii=False` so Hebrew stays
readable.

`lexical_score: null` means BM25 never surfaced that document — not that it scored zero. The distinction
is load-bearing for how the semantic floor imputes, and it must survive into the CSV as a blank cell.

### 11.2 Judge model and API surface (M4)

- **`claude-opus-5`.** The mission says "LLM חכם", and this is the arbiter the rest of the plan leans on
  — a cheaper judge wrong 15% of the time makes M5 and M6 worthless. `effort: low`: Opus 5 is unusually
  strong at low effort and this is bounded classification, not open-ended reasoning.
- **Thinking is ON by default on Opus 5** (unlike Opus 4.8) and counts against `max_tokens`. Size
  `max_tokens` with headroom or chunk outputs truncate mid-list.
- **Message Batches API** — 50% cost reduction, fully offline job. Key by `custom_id`; results arrive in
  arbitrary order.
- **Structured outputs** via `output_config.format`. `additionalProperties: false` required on every
  object; numeric/string constraints unsupported.
- **Prompt caching** on the system prompt. Opus 5's minimum cacheable prefix is 512 tokens — below that
  it silently won't cache.
- **No `fallbacks`** — rejected on the Batches API.

### 11.3 The judgement cache (M4)

A verdict is a pure function of `(query, service_name, model, prompt)`. It does **not** depend on
retrieval configuration, so it caches — exactly as the scraped ground truth already does.

```json
{
  "model": "claude-opus-5",
  "prompt_checksum": "sha256:...",
  "schema_version": 1,
  "judgements": { "<query> <service_name>": { "verdict": "relevant", "reason": "..." } }
}
```

`MAX_RETURNED_SERVICES` and `SEMANTIC_SCORE_RATIO` both filter the *same* fused list, so any narrower
setting returns a strict **subset** of the current wide config. Judge once at
`CANDIDATE_POOL_SIZE=500` and every candidate operating point below scores against cached labels at
zero additional cost. Changing `CANDIDATE_POOL_SIZE` itself is **not** a subset — it reorders fusion —
so that incurs incremental judging for newly-surfaced pairs.

### 11.4 Why `retrieval/.env` stays frozen until Phase 7.1

The instinct is to shrink retrieval first so the judging job is smaller. **That inverts the dependency.**

`f1_at_returned` is the correct tuning objective — it is the only metric with an interior maximum over
the threshold. But it is computed against the golden set, and M4–M6 exist because we do not yet know
whether the golden set represents relevance. Tuning first means:

- if the golden set is narrower than relevance, the sweep cuts genuinely-good results to raise a
  precision number that is measuring the wrong thing;
- and the cut destroys the tail evidence needed to detect that narrowness — a top-50 judging run samples
  the head of the ranking, where retrieval is presumably already fine.

**Row counts by operating point.** Measured from the current `summary.json` by truncating at rank N —
exactly what `MAX_RETURNED_SERVICES` does. `recall`/`precision` here are **micro-averaged** (pooled hits
÷ pooled totals) and are not comparable to the macro means in `set_metrics`.

| Cap | Rows to judge | vs. now | Micro-recall | Micro-precision |
| ---: | ---: | ---: | ---: | ---: |
| **none (today)** | **17,529** | — | 0.511 | 0.034 |
| 50 | 3,615 | −79% | 0.275 | 0.105 |
| 25 | 2,291 | −87% | 0.187 | 0.142 |
| 10 | 1,553 | −91% | 0.105 | 0.199 |
| 5 | 1,341 | −92% | 0.064 | 0.239 |
| 3 | 1,268 | −93% | 0.042 | 0.259 |

**Hard floor of 1,177 rows** — the total ground-truth size. Every service not retrieved becomes a
`missed_ground_truth` row that still needs a verdict, so cutting below ~10 buys almost nothing
(1,553 → 1,268) while micro-recall collapses (0.105 → 0.042). Use this table to size a
`--judge-limit` slice, not to pick a production operating point.

**Separately: 282 services per query is a product defect** worth raising on its own terms — the site
shows a median of 8. The likely `.env` change, to be decided in Task 7.1.1:

```bash
CANDIDATE_POOL_SIZE=50        # back to the documented default
SEMANTIC_SCORE_RATIO=0.90     # swept 0.85–0.97 against adjusted F1
```

Prefer `SEMANTIC_SCORE_RATIO` over `MAX_RETURNED_SERVICES`: the ratio is a relevance cut whose length
varies per query, while a hard cap is a fixed top-N that every fixed-k metric is blind to.
`KEEP_LEXICAL_ONLY_DOCUMENTS` is already `false`, which is what lets the ratio cut BM25-only documents.

### 11.5 The judge prompt (M4)

Lives in `relevance_strings.py` (rule 4). Per **rule 8** the system prompt gives instructions only, and
worked examples show **structure and types only — never real service names, queries, or domain values**:

```
input:  {"query": "<free-text query>", "services": [{"id": <int>, "name": "<service name>"}]}
output: {"judgements": [{"id": <int>, "verdict": "relevant" | "irrelevant" | "unclear",
                         "reason": "<one short sentence>"}]}
```

The prompt must state, in words rather than in code:

- The judgement is **"would a person who asked this query be helped by this service"** — not string
  similarity, not category matching.
- Each verdict is independent of the others in the list.
- `unclear` is legitimate and preferred over guessing.
- One judgement per input id, any order, ids echoed exactly.

**Open decision — name-only vs. enriched.** The judge currently sees only the service *name*. Some
Kolsherut names are opaque acronyms, so a name-only judge will over-produce `unclear`. Adding the
service description from the retrieval index is **supplying data, not helping the model reason** — it
does not violate rule 7. It raises input tokens ~5–8× (~$40–60 per run, still affordable).
**Recommendation:** ship name-only, measure, enrich only if `unclear` > 10%.

### 11.6 Cost estimate (M4)

Assumptions: Hebrew service name ≈ 20 tokens (measured mean 31.5 chars); system prompt ≈ 600 tokens;
verdict + reason ≈ 25 output tokens; adaptive thinking at `effort: low` roughly doubles output.
Re-baseline with `count_tokens` (Task 4.3.1) before trusting these.

| | Input | Output | List price | With Batches (−50%) |
| --- | ---: | ---: | ---: | ---: |
| Opus 5 (`$5`/`$25` per MTok) | ~0.7 M | ~0.9 M | ~**$26** | ~**$13** |
| Sonnet 5 (`$3`/`$15`, intro `$2`/`$10`) | ~0.7 M | ~0.9 M | ~**$16** | ~**$8** |

**Cost is not a constraint.** Judge everything; do not sample for cost reasons.

### 11.7 Statistic definitions (M5)

| Statistic | Definition | Reads as |
| --- | --- | --- |
| `missed_truly_irrelevant_rate` | of `missed_ground_truth`, share judged `irrelevant` | "% of what we didn't retrieve that genuinely didn't matter" — golden-set noise |
| `unexpected_actually_relevant_rate` | of `unexpected_retrieved`, share judged `relevant` | "% of what we returned but the site doesn't show that is actually good" — golden-set narrowness |

### 11.8 Agreement report fields (M6)

| Field | Meaning |
| --- | --- |
| `sample_size`, `reviewed_count` | Coverage of the sheet actually filled in. |
| `raw_agreement` | Share of reviewed rows where human == LLM. **This is "באיזה אחוז המעריך האנושי מסכים עם ה-LLM".** |
| `cohens_kappa` | Agreement corrected for chance. Report alongside raw agreement, never instead of it. |
| `confusion_by_side` | 3×3 human × LLM matrix per side — shows *which direction* the judge errs. |
| `agreement_by_verdict` | Per-LLM-verdict accuracy — reliable on `relevant` but not `irrelevant`? |
| `disagreement_rows` | The disagreeing rows themselves, for reading at the M7 session. |

**Acceptance bar (proposal, to confirm with Eli):** `raw_agreement ≥ 0.85` **and** `cohens_kappa ≥ 0.60`.

### 11.9 Why `missed_ground_truth` has no scores — and how to fill them

Those services were never returned by retrieval at `CANDIDATE_POOL_SIZE=500`, so no retriever produced a
score for them. Blank is the honest value; writing zeroes would make them look like documents the
embedder scored as maximally dissimilar, which is a different claim.

This is a real diagnostic gap, though. For a recall failure the most useful question is **"how close was
it?"** — a golden-set service at cosine 0.84 that fell just outside the pool is a ranking problem; one at
cosine 0.31 is an embedding or indexing problem. Blank cells cannot distinguish those.

**Optional enhancement (retrieval side, not required by any mission).** Add an endpoint that scores a
given list of `service_id`s against a query embedding — everything needed already exists
(`embed_query_text`, `fetch_service_by_id`, and the cosine recovery in
`select_documents_by_semantic_score`). The evaluation would call it once per query with the missed
service ids and fill the same five columns.

**Recommendation:** do not build this before the M7 session. Bring the blank columns and the §11.10 band
table, and let the discussion decide whether "how near-miss were our misses?" is worth an endpoint. It is
a new retrieval capability, not an evaluation change, and it is only worth it if recall turns out to be
the priority.

### 11.10 What the score bands are for

Carrying the scores is not decoration — it is what makes Phase 7.1 possible. The band table from
Task 4.2.7 crosses `cosine_score_ratio` against the judge's verdict on the `unexpected_retrieved` side,
and that cross-tab is the threshold-selection evidence:

- **`relevant` share falls off a cliff at some ratio** → that cliff is the operating point, and
  `SEMANTIC_SCORE_RATIO` set just above it cuts noise without cutting good results.
- **`relevant` share stays flat across all bands** → the cosine is not separating relevance at all, no
  score threshold will fix precision, and the problem is upstream in the embedded text or the index.
- **`relevant` share is high even in the lowest bands** → the golden set is narrow, not the retriever
  wrong, and the M7 conversation is about ground truth rather than tuning.

Without the scores in the table, none of those three can be told apart.

---

## 12. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Judge is systematically wrong** | M5 and M6 both become noise; wrong conclusions at the M7 session. | Task 6.2.3 is a gate. Never present adjusted metrics without agreement numbers. |
| **Tuning retrieval before judging** | Circular: the sweep optimises against the ground truth under question, and the cut destroys the evidence needed to test it. Confident wrong answer. | §3.2 freeze; §11.4 ordering. |
| **Judgements not cached** | Every sweep becomes another paid run, so the sweep gets skipped and the operating point is picked by eye. | Task 4.1.5; committed cache. |
| **Name-only → high `unclear` rate** | Rates computed over a shrunken denominator. | Step 4.3.2.3 decision point. Never fold `unclear` into `irrelevant`. |
| **Staging data drifts** | Ground truth silently stale — the cache never invalidates on staging content changing. | Step 4.3.3.1 `--rescrape` immediately before judging. |
| **Judged run cost creeps** | Repeated full runs during prompt iteration. | Task 4.3.2 iterates on 200 rows; full run once. |
| **`relevance` block leaks into `metrics`** | `compute_overall_score` silently changes meaning; baseline comparison breaks. | Step 5.2.1.2 sibling block + Step 5.2.1.3 regression check. |
| **Batch results keyed by position** | Silent mis-assignment of verdicts to services — worst case, because output still looks valid. | Step 4.1.4.2 and Step 4.2.3.2: key by `custom_id`, assert completeness. |
| **Scores joined to the wrong document** | A name spanning several service_ids gets an arbitrary card hit's scores instead of the best-ranked document's. Silent — the CSV looks complete and every threshold decision downstream is made on wrong numbers. | Attach at `order_services_by_ranking` where fused order and name collapse are both in hand (Step 2.1.1.2); verify a multi-id name explicitly (Step 2.1.1.5). |
| **`null` scores written as `0.0`** | "BM25 never surfaced it" becomes "BM25 scored it zero" — changes what the band table means and how the semantic floor reads. | Step 2.1.2.4 and Step 4.2.5.2: `None` stays blank end to end. |
| **Score columns shown to the human reviewer** | The human anchors on cosine instead of judging relevance; the agreement number stops measuring what it claims to. | Step 6.1.1.4: withhold scores (and verdicts) from the review sheet. |
| **API key handling** | Secret in the repo. | Step 4.1.3.2/3: `.env` only, `.env.example` names never values. |

---

## 13. Convention checklist for every new file

- One purpose per file; utils may multi-export only within one scope.
- ≤100 lines per file, ≤30 lines per function (target ~20).
- Pure functions; `try/except` only in `run_evaluation.py` and `clients/llm_client.py`.
- All imports at the top; `import` only, never `require`.
- No hardcoded text: literals live in `vars.py` / `strings.py` / `relevance_vars.py` /
  `relevance_strings.py` only.
- Long, informative names matching the existing style (`find_unexpected_retrieved_names`, not `findUnexp`).
- Functional first — no classes unless a framework demands one.
- **Rule 7**: no code that pre-processes, hints, regex-matches, or keyword-maps for the judge.
- **Rule 8**: system prompt instructs only; examples show structure and types, never real values.
