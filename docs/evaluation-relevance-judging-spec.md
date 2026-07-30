# SPEC — Relevance Judging for the Retrieval Evaluation

Plan for the 7 missions on the `evaluation/` microservice. Written against the state of
`evaluation/` on branch `fix-embedding-text-and-reindex` (last commit touching it: `6aaf267 Eval enhancement`).

**How to read this document**

- **§0–§2** — why the work exists, what already exists, target architecture. Read once.
- **§3–§10** — the execution plan as `Mission → Phase → Task → Step`. This is the part to review.
- **§11** — reference appendix: the design reasoning behind the steps (prompt, cache, cost, tuning).
- **§12–§13** — risks and the convention checklist.
- **§14** — execution log: what has actually shipped, and the live checks still owed.

> ## STATUS — 2026-07-30
>
> **All the code for Missions 1–6 is written. Not one real relevance label exists.**
>
> | Mission | Code | Measured |
> | --- | --- | --- |
> | M1 Recall ALL | ✅ | ✅ |
> | M2 unexpected-retrieved JSON | ✅ | ✅ live, with real scores |
> | M3 missed-ground-truth JSON | ✅ | ✅ live |
> | M4 LLM judging | ✅ Phases 4.1 + 4.2 (18 files under `relevance/`) | ❌ **Phase 4.3 never ran** — `evaluation/data/relevance-judgements.json` does not exist |
> | M5 relevance statistics | ✅ (10 files) | ❌ synthetic verdicts only |
> | M6 human audit | ✅ (16 files) | ❌ gate **OPEN**; blocked on the 2–3 h human sitting |
> | M7 session with Eli | ❌ | ❌ |
>
> **One-line blocker, and it is a typo.** `evaluation/.env:13` sets **`GEMINI_JUDGE_KEY`**, but
> `evaluation/relevance_vars.py:15` reads **`GEMINI_JUDGE_API_KEY`** (as does `.env.example:17`). So
> `--judge` raises `ERROR_MISSING_GEMINI_JUDGE_API_KEY` and exits before making a single call. **Renaming
> that one variable unblocks Phase 4.3 → M5 → M6 in sequence.** See §14.8.
>
> **Second, larger question: the frozen snapshot is now two arms stale.** `results-judge-frozen/` pins the
> 2,148 pairs of a `0.3025` arm. The retriever has since moved to `0.3694` (the V4 Gemini embedder — see
> `docs/embedding-v4-gemini-spec.md` §14.4). Decide whether to judge the pinned snapshot or re-freeze on
> the current arm **before** spending the labels. §14.8.2.

**Status as of 2026-07-29: Missions 1, 2 and 3 are implemented and verified; Missions 4–7 are not started.**
*(Superseded by the status block above — M4/M5/M6 code has since shipped; see §14.5–§14.8.)*
**The M4 gate is MET.** Retrieval was restarted at 17:07 so it imports Phase 2.1's code, and the re-run
produced both diff files with the score fields **populated** — 2,148 pairs, all five fields real on the
unexpected side, all five `null` on the missed side. Attempt 1's `null`s were a stale process, not a code
defect; the whole of §14.2 is now closed. See §14.2. Read §14 before acting on §0's numbers: they belong
to a different arm than the current run (§14.3), and §14.4 records the arm Mission 4 will actually judge —
including the newly measured fact that **the arm is not bit-reproducible run to run** (§14.4.3), so the
labels must be pinned to the emitted files.

**Design change after first draft: the judge is `gemini-3.1-flash-lite`, not `claude-opus-5`.** Mission 4
is written against `google-genai` throughout — batch surface, structured output, thinking and finish
reasons all differ from the original Anthropic design. §11.2 is the API contract, **§11.2.1 is how a
lite-tier judge is kept honest**, and five `⚠️ VERIFY AT IMPLEMENTATION` markers flag details that must be
confirmed against live docs before Phase 4.1 is coded.

**Marker legend.** Every mission, phase, task and step in §4–§6 carries its outcome. An unmarked
heading or step (all of §7–§10) has not been started.

| Marker | Meaning | Count in M1–M3 |
| --- | --- | ---: |
| ✅ | Done and verified. The evidence is written under the step. | **37 steps** |
| ⏳ | **Deferred, not passed** — blocked on a live retrieval service + Elasticsearch. §14.2. | **0 steps** |
| 🟡 | Partial: one assertion still owed. | **0 steps** |
| ⚠️ | Not implementable as written; what was done instead is under the step. | 1 step |

38 steps in M1–M3. Counts updated 2026-07-29 after the live verification attempt 2 (§14.2) closed
Steps 2.1.1.5, 2.2.4.2 and 2.2.4.3 — the last ⏳ and both 🟡. `⚠️` Step 2.2.1.3 is unchanged and is not a
live-check item.

---

## 0. Why this work exists

The evaluation today scores retrieval against **what the incumbent staging site renders** for each
golden-set URL. That is a *proxy* for relevance, not relevance itself. The last full run says:

> ⚠️ **Every number in this section is from `evaluation/results-arm0-baseline/`, not from the current
> `evaluation/results/` run.** Measured 2026-07-29 — the current arm gives `recall_at_returned` 0.3266,
> 1,179 unexpected rows and 966 missed rows, i.e. **2,145 pairs to judge rather than 17,529**. Both arms
> are local-only (`evaluation/.gitignore` ignores `results*/`). Full comparison in §14.3; re-baseline
> §11.4 and §11.6 against whichever arm is frozen for judging before trusting them.

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
values the mock FE renders as badges. **This was true when the spec was written; Phase 2.1 has since
fixed it** — the diagnosis below is kept because it is the reasoning behind the fix, and because the
verified field table is still the contract Mission 4 reads.

`clients/retrieval_client.py:19-21` read `services[].service_name` and nothing else. Verified shape of
`POST /api/retrieve`:

| Field | Where | Badge | Meaning |
| --- | --- | --- | --- |
| `score` | `documents[]` | `score 0.0164` | Fused RRF score — `1/(k+rank)` summed with per-retriever weights |
| `lexical_score` | `documents[]` | `bm25 5.168` | Raw BM25 score. `null` when BM25 never surfaced it |
| `semantic_score` | `documents[]` | — | Raw Elasticsearch cosine score, i.e. `(1 + cosine) / 2` |
| `cosine_score` | `documents[]` | `cosine 0.8508` | Recovered cosine — what `MIN_SEMANTIC_SCORE` cuts on |
| `cosine_score_ratio` | `documents[]` | `ratio 1.000` | Fraction of the pool's best cosine — what `SEMANTIC_SCORE_RATIO` cuts on |
| `service_id` | `documents[]` | `guidestar:a0y…` | |

**`services[]` carried no scores at all.** `Service` in `retrieval/app/schemas/service_hierarchy_schemas.py`
declared no score fields, so the `score` and `service_boost` keys that `create_service_from_card` sets
were silently dropped at serialization. Note also that those keys were the card's static boost, never the
retrieval score — so there was nothing here to reuse. Step 2.1.1.1 added five *new* optional fields;
the card's `score`/`service_boost` are still dropped, which is why the fused field is `retrieval_score`.

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
| 1 | להוסיף Recall ALL | ✅ **Done** — verified 2026-07-29 | §4 — verify only |
| 2 | להוסיף קובץ json שמראה פר שאילתה איזה שירותים אנחנו שלפנו שלא קיימים ב goldenset | ✅ **Implemented** 2026-07-29 (2 live checks deferred, §14.2) | §5 |
| 3 | להוסיף קובץ json שמראה פר שאילתה איזה שירותים קיימים ב goldenset שלא שלפנו בכלל | ✅ **Implemented** 2026-07-29 | §6 |
| 4 | לשלוח גם את סעיף 2 וגם את סעיף 3 ל LLM חכם ולבקש פר שירות אם הוא רלוונטי לשאילתה ולהוציא כטבלה (csv) | 🟡 **Code done (Phases 4.1 + 4.2), never run.** Phase 4.3 is blocked on the `.env` key name — §14.8.1. No CSV exists. | §7 |
| 5 | להחזיק סטטיסטיקה של איזה אחוז מהדברים שלא שלפנו באמת לא רלוונטים, ואיזה אחוז מהדברים ששלפנו והמקור לא כן רלוונטים | 🟡 **Code done, unmeasured** — verified against synthetic verdicts over the real 2,148 identities only. §14.6 | §8 |
| 6 | לעבור ידנית על הטבלה מ 5 ולראות באיזה אחוז מהמקרים הוא נתן הערכה נכונה, והוספת סכימה באיזה אחוז המעריך האנושי מסכים עם ה LLM | 🟡 **Code done, gate OPEN.** The deliverable is a human sitting; no code can supply it. §14.7 | §9 |
| 7 | לשבת עם אלי, ועם התעדוף שעשינו להבין מה תקין ומה לא | ❌ **Not started (process)** | §10 |

**Read the 🟡 rows as "built but unproven".** M4–M6 are ~50 of the 61 new `evaluation/` files — working
plumbing whose every number is still synthetic. The load-bearing question in §0 — *is `precision_at_returned` measuring the
retriever or a narrow golden set?* — is **exactly as unanswered as on day one.**

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

`✅` = shipped 2026-07-29. Unmarked = not written yet. Two files were added that this tree did not
anticipate; both are marked and explained in §14.1.

```
retrieval/                          MODIFIED  M2 Phase 2.1 — additive only
├─ app/schemas/service_hierarchy_schemas.py ✅ EXTEND 5 optional score fields on Service
└─ app/services/service_hierarchy/
   ├─ order_services_by_ranking.py         ✅ EXTEND attach the winning document's scores
   ├─ attach_document_scores_to_service.py ✅ NEW    unplanned — the Step 2.1.1.4 split
   └─ assemble_services_from_documents.py  ✅ EXTEND pass documents through

evaluation/
├─ relevance_vars.py            NEW  M4  Gemini model + thinking level, chunk size, paths,
│                                        verdict + cache keys, seed
├─ relevance_strings.py         NEW  M4  judge system prompt, CSV headers, log lines
├─ clients/
│  ├─ parse_retrieval_response.py ✅ NEW M2  unplanned — pure parsing split off the HTTP call
│  └─ llm_client.py             NEW  M4  Gemini Batch API (google-genai): submit / poll / read results
├─ relevance/                   NEW  M4
│  ├─ judgement_cache.py             load / save / checksum-invalidate
│  ├─ build_judgement_items.py       the two diff JSON files → JudgementItem list
│  ├─ chunk_judgement_items.py       group by (query, side), split at chunk size
│  ├─ judgement_schema.py            JSON schema for structured output
│  ├─ build_judgement_request.py     one Gemini batch request (keyed JSONL line)
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
│  ├─ build_service_diff_json.py  ✅ NEW  M2 + M3  both payloads, one shared _build_payload
│  ├─ build_diff_service_entries.py ✅ NEW M3  unplanned — the service-object builder, split for size
│  ├─ serialize_service_scores.py ✅ NEW  M2  the single five-key flattener + UNSCORED_SERVICE
│  ├─ write_relevance_csv.py         NEW  M4  the final scores + verdicts table
│  ├─ build_score_band_table.py      NEW  M4  verdict share per cosine / ratio band
│  ├─ build_relevance_table.py       NEW  M5
│  └─ write_agreement_report.py      NEW  M6
├─ clients/retrieval_client.py ✅ EXTEND M2  HTTP only now; renamed to
│                                           fetch_retrieval_ranked_names_and_scores
├─ evaluate_dataset.py         ✅ EXTEND M2  thread the score map through
├─ metrics/evaluate_query.py   ✅ EXTEND M2  carry scores onto QueryEvaluation (no metric change)
├─ report/serialize_summary.py ✅ EXTEND M2  per-query service_scores block
├─ report/write_results.py     ✅ EXTEND M2 + M3  write_diff_json + both side writers
├─ vars.py / strings.py        ✅ EXTEND M2 + M3  paths, DIFF_JSON_* keys, SERVICE_SCORE_* keys, log line
├─ run_evaluation.py           ✅ EXTEND M2 + M3  LOG_WROTE_RESULTS params only
├─ README.md                   ✅ EXTEND M1 + M2 + M3  Recall ALL alias, both Outputs bullets
├─ data/
│  └─ relevance-judgements.json  NEW  M4  committed label cache
└─ schemas.py                 ✅ EXTEND  ServiceScores + service_scores on QueryEvaluation (M2),
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
                   Gemini Batch API + data/relevance-judgements.json
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

| Order | Missions | Gate before starting | State |
| --- | --- | --- | --- |
| 1 | M2 → M3 | none | ✅ implemented, uncommitted |
| 2 | M4 | M2 + M3 merged (M4 reads their output files) | ✅ **gate MET (2026-07-29, attempt 2)** — retrieval restarted at 17:07 so it imports Phase 2.1's code; the re-run wrote both diff files **carrying real scores**. 2,148 pairs (1,180 unexpected + 968 missed); `retrieval_score` / `cosine_score` / `cosine_score_ratio` / `semantic_score` **1,180/1,180 populated**, `lexical_score` 272/1,180 (correct for `LEXICAL_WEIGHT=0`), missed side 968/968 all-null, zero exact `0.0` in 10,740 cells. **Still uncommitted** — that remains a release blocker, not a gate blocker. §14.2 |
| 3 | M5 | M4 Phase 4.3 complete (labels exist) | blocked |
| 4 | M6 | M5 Phase 5.1 complete (statistics exist to sample from) | blocked |
| 5 | M7 | **M6 gate passed** (Task 6.2.3) | blocked |

**The M4 gate is met.** As of 2026-07-29 (attempt 2, after restarting retrieval) both files carry real
per-service scores and every assertion in §14.2 passes. Phase 4.1 may start. Two things to carry into it:
the work is **still uncommitted**, and §14.4.3 records that re-running this arm does not reproduce the
identical pair set — so Mission 4 must judge the **emitted files**, and Task 4.3.3.4 must record the file
hashes, not just the config.

Three hard rules:

- **`retrieval/.env` is frozen until Phase 7.1.** Changing it mid-plan invalidates the judged labels
  and the baseline comparison. Reasoning in §11.4. Note this is about **config values**; Phase 2.1
  changes retrieval *code* additively and is not affected.
  **This rule was already broken before the 2026-07-29 run** — the file on disk no longer matches §0.1.
  The drift is tabulated in §14.4.1, and §14.4 freezes the drifted arm as the judged one from here.
- **No adjusted metric is presented without its agreement number.** M6 is a gate, not a report.
- **Every score the retriever produced reaches the final table unmodified.** No rounding, no
  recomputation, no zero-for-null substitution. Step 4.2.5.5 is the end-to-end check.

Phase 2.1 is the only phase that touches `retrieval/`. It is additive (five optional response fields)
and changes no default behaviour, but it needs review from whoever owns retrieval, and it should land as
its own PR ahead of everything else.

### 3.3 Effort summary

| Mission | Phases | Est. | Actual |
| --- | --- | --- | --- |
| M1 | 1 | 0 (verify only) | ✅ as estimated |
| M2 | 2 | 1.5 d (0.5 d score plumbing incl. retrieval, 0.5 d the file, 0.5 d verification) | ✅ code done; the 0.5 d verification is still owed (§14.2) |
| M3 | 1 | 0.1 d (reuses M2) | ✅ one task, as predicted |
| M4 | 3 | 2.5–3.5 d (+0.5 d for the score-band table) | — cost/volume estimate needs re-baselining, §14.3 |
| M5 | 2 | 1 d | — |
| M6 | 2 | 1 d + 2–3 h human review | — |
| M7 | 2 | 0.5 d + the session | — |

---

## 4. Mission 1 — Recall ALL ✅

**Status: ✅ COMPLETE (2026-07-29).** Already implemented; verified, nothing changed but the README.

### Phase 1.1 — Verify and document ✅

#### Task 1.1.1 — Confirm the metric is Recall ALL ✅

- **Step 1.1.1.1** ✅ — Confirm `metrics/compute_returned_set_metrics.py:20-22` computes
  `recall_at_returned = count_hits(ranked_names, ground_truth) / len(ground_truth)`, where `count_hits`
  scans the **entire** returned list (its docstring at line 7-8 explicitly rejects the per-k slice).
- **Step 1.1.1.2** ✅ — Confirm it is averaged in `metrics/aggregate_set_metrics.py`, written to
  `per_query.csv`, printed in the console "Set metrics over the returned list" table, and rendered in
  the dashboard.
- **Step 1.1.1.3** ✅ — Record the current value (**0.698**) as the mission-1 answer.
  ✅ **Done, with a correction.** 0.698 is `results-arm0-baseline/` (`avg_returned_count` 278.63). The
  current `results/` arm reads **0.3266**. Recall at 0.698 is bought with precision, so **the mission-1
  answer must name its arm** — quoting a bare 0.698 overstates the current retriever. Per-arm table in
  §14.3. Also: there is no *committed* `summary.json` at all — `evaluation/.gitignore` ignores `results*/`.

#### Task 1.1.2 — Make it findable ✅

- **Step 1.1.2.1** ✅ — `README.md`: add the phrase "Recall ALL" as an alias next to `Recall@returned` in
  the set-metrics table, so the next person searching the mission name lands on the right metric.
  ✅ `evaluation/README.md:120` → `| **Recall@returned** (aka **Recall ALL**) | ...`.

---

## 5. Mission 2 — JSON of what we retrieved that isn't in the golden set ✅

**Deliverable:** `results/unexpected_retrieved.json`, **with per-service scores**. Payload shape §11.1.

**Status: ✅ IMPLEMENTED (2026-07-29).** All tasks done. Two live checks deferred — Steps 2.1.1.5 and
2.2.4.1–2.2.4.3 need the retrieval service and Elasticsearch running; see §14.2.

### Phase 2.1 — Carry the retrieval scores through ✅

*Cross-cutting prerequisite: M2, M3 and M4 all need these values. Reasoning and verified field names in
§0.2. **This phase touches `retrieval/`** and needs its own review — all changes are additive optional
fields, no default behaviour changes, and a full re-scrape is not required.*

#### Task 2.1.1 — Attach the winning document's scores to each collapsed service (retrieval side) ✅

> **Deviation from Step 2.1.1.3 as written, accepted.** `order_services_by_ranking`'s third parameter was
> *replaced* (`ranked_service_ids` → `retrieved_documents`) rather than a fourth being added.
> `ranked_service_ids` was built as `[d['service_id'] for d in retrieved_documents]`, so it is positionally
> 1:1 and the change is behaviour-identical; keeping both would have created two sources of truth for one
> rank order. Single internal caller, updated. `ranked_service_ids` still exists in
> `assemble_services_from_documents` for `fetch_cards_by_service_ids`, so nothing became dead.

- **Step 2.1.1.1** ✅ — `retrieval/app/schemas/service_hierarchy_schemas.py`: add five optional fields to
  `Service` — `retrieval_score`, `semantic_score`, `lexical_score`, `cosine_score`,
  `cosine_score_ratio`, all `Optional[float] = None`. Name the fused one `retrieval_score`, **not**
  `score`, so it can never be confused with the card boost that `create_service_from_card` already sets
  and that the schema currently drops.
- **Step 2.1.1.2** ✅ — `retrieval/app/services/service_hierarchy/order_services_by_ranking.py`: accept the
  fused `retrieved_documents` and, for each surviving name, attach the scores of **the document whose
  service_id won that name** — i.e. the one being iterated when the name was first seen. This is the only
  place where fused rank order and name collapse are both in hand.
- **Step 2.1.1.3** ✅ — `retrieval/app/services/service_hierarchy/assemble_services_from_documents.py`: pass
  `retrieved_documents` through to `order_services_by_ranking`.
- **Step 2.1.1.4** ✅ — Keep both functions ≤30 lines; if the attach logic pushes past it, split the
  score-mapping helper into its own file.
- **Step 2.1.1.5** ✅ — Verify against one query in the mock FE: for a service name that appears once, the
  attached values must equal that document's badges exactly. For a name spanning several service_ids,
  confirm the attached values come from the **best-ranked** of them, not an arbitrary card hit.
  ~~⏳ **DEFERRED — needs a live service.**~~ Proven offline first: driving the pure function with a
  synthetic name spanning two service_ids returned the *better-ranked* document's `retrieval_score`
  (0.0321), not the card-order id's (0.0100), which is exactly the §12 failure mode. Recipe for the live
  check in §14.2.2.
  🟡 **RE-PROVEN ON LIVE DATA 2026-07-29 — but not from the raw response.** The running retrieval process
  predates this code (§14.2), so `services[]` carries no score fields and could not be read. Substitute:
  the on-disk `order_services_by_ranking` driven with the **live** `documents[]` from
  `POST /api/retrieve` and the **live** `service_id → service_name` map read from `srm__cards`, with
  `services_by_name` built in *card return order* so the §12 failure mode is actually reachable. Two
  queries, **7 names examined — 4 single-id, 3 multi-id, 2 discriminating.**
  **(a) single-id** — `תכנית אחר הצהרים לילדי בית הספר` (`guidestar:a0y0800000Jfb15AAB`): all five values
  equal that one document's exactly — `retrieval_score` `0.010638297872340425`, `cosine_score`
  `0.8633895`, `cosine_score_ratio` `0.9885905371704945`, `lexical_score` **`None`** (LEXICAL_WEIGHT=0, so
  BM25 never surfaced it — arriving as `None`, not `0.0`, is the point), `semantic_score` `0.93169475`.
  Type-checked as well as value-checked, so `0 == 0.0 == False` cannot pass by coercion.
  **(b) multi-id, discriminating** — `מועדונית לילדים` spans **38** distinct `service_id`s across 38
  documents. `services_by_name`'s card-order id is `meser-s-219127`; the earliest document in fused order
  is `meser-s-206442`. Attached `retrieval_score` = **`0.01639344262295082`** = the earliest document's
  fused score, and **differs** from the card-order id's `0.01098901098901099` — the better-ranked one won,
  which is exactly what §12 says goes silently wrong. All five fields track the earliest document
  (`cosine` 0.873354 vs 0.8642258599999999, `ratio` 1.0 vs 0.9895481786308873, `lexical` 12.388985 vs
  11.792694, `semantic` 0.936677 vs 0.93211293). Second discriminating case, `מרכז יום לאזרחים ותיקים`
  (27 ids): attached `0.016129032258064516` (earliest `meser-s-201121`) vs `0.015625` (card-order
  `meser-s-201125`). Same verdict.
  Also confirmed behaviour-identical on the name/order side: the rebuilt `services[]` came out with the
  same 3 entries in the same order as the live response's, so the Task 2.1.1 deviation changed nothing but
  the added fields.
  ✅ **CLOSED ON THE RAW LIVE RESPONSE 2026-07-29 17:13 (attempt 2).** After the restart, `services[i]`
  carries all five keys (live `services[0]` key set is the full 14), so both assertions were read straight
  off the `POST /api/retrieve` body — no substitute. Method as §14.2.2 prescribes: group `documents[]` by
  the `service_name` its `service_id` maps to in `srm__cards`, compare `services[i]` against the group's
  **earliest** document and against the document whose `service_id == services[i].id`. Two queries, 7
  names, **3 single-id, 4 multi-id, 3 discriminating**. Every one of the 7 names matched the earliest
  document on **all five fields, by value and by type**.
  **(b) multi-id, discriminating — the known case, now confirmed on `services[i]` directly.**
  `מועדונית לילדים`, **38 service_ids across 38 documents**. `services[0].id` is `meser-s-219127`, sitting
  at fused position **30**; the earliest document of that name is `meser-s-206442` at fused position
  **0**. `services[0].retrieval_score` = **`0.01639344262295082`** = the earliest document's fused `score`,
  and **differs** from the card-order id's **`0.01098901098901099`** — exactly the two numbers §14.2.2
  predicted. All five track the earliest: `cosine_score` 0.873354 vs 0.8642258599999999,
  `cosine_score_ratio` 1.0 vs 0.9895481786308873, `lexical_score` 12.388985 vs 11.792694,
  `semantic_score` 0.936677 vs 0.93211293. Two further discriminating cases on the second query:
  `מרכז יום לאזרחים ותיקים` (27 ids) attached `0.016129032258064516` (earliest `meser-s-201121`, position 1)
  vs the card-order id's `0.015625` (`meser-s-201125`, position 3); and `מועדון מופת לאזרחים ותיקים`
  (2 ids) attached `0.015151515151515152` (earliest `meser-s-211764`, position 5) vs `0.011904761904761904`
  (`meser-s-213677`, position 23) — and there the card-order id's `lexical_score` is `None` while the
  earliest's is `15.924231`, so a wrong join would also have blanked a badge.
  **(a) single-id.** `תכנית אחר הצהרים לילדי בית הספר` (`guidestar:a0y0800000Jfb15AAB`, the only id):
  all five `services[i]` values equal that one document's exactly — `retrieval_score`
  `0.010638297872340425`, `cosine_score` `0.8633895`, `cosine_score_ratio` `0.9885905371704945`,
  `lexical_score` **`None` (NoneType, not `0.0`)**, `semantic_score` `0.93169475`. Type-compared as well
  as value-compared, so `0 == 0.0 == False` cannot pass by coercion. Second single-id case
  `מועדוניות לילדים בסיכון` behaves identically. The offline and on-disk-function results above are
  reproduced to the digit, so the substitute evidence was sound — but this step asked for the response,
  and this is it.
- **Step 2.1.1.6** ✅ — Confirm `documents[]` is unchanged and no existing field was renamed, so the mock FE
  and any BE consumer keep working. ✅ `RetrievedDocument` and all of `app/services/retrieval/` are absent
  from the diff; the schema change is +10 lines / −0; the mock FE's four badges all read `documents[]`
  (`mock_fe/index.html:371-374`) and `ServiceResult` ignores the new fields.

#### Task 2.1.2 — Read the scores in the evaluation client ✅

- **Step 2.1.2.1** ✅ — `evaluation/schemas.py`: add a frozen `ServiceScores(retrieval_score,
  semantic_score, lexical_score, cosine_score, cosine_score_ratio)`, all `float | None`.
- **Step 2.1.2.2** ✅ — `evaluation/clients/retrieval_client.py`: return the ranked names **and** a
  `dict[str, ServiceScores]` keyed by normalized service name. Keep reading `services[]` for the name
  list — the README explains why that is the right side to match on — and read the scores from the same
  entries now that Task 2.1.1 put them there.
- **Step 2.1.2.3** ✅ — Apply `normalize_service_name` to the score-map keys too, so they match the names
  `normalize_and_dedupe` produces. A score map keyed on raw names silently misses every name that needed
  normalizing.
- **Step 2.1.2.4** ✅ — `None` stays `None`. A retriever that never surfaced a document is not the same as
  one that scored it zero — `attach_retriever_scores` is explicit about this and the distinction must
  survive into the CSV.

> **Constant names Mission 4 must reuse** (in `evaluation/vars.py`): `SERVICE_SCORE_RETRIEVAL_KEY`,
> `SERVICE_SCORE_COSINE_KEY`, `SERVICE_SCORE_COSINE_RATIO_KEY`, `SERVICE_SCORE_LEXICAL_KEY`,
> `SERVICE_SCORE_SEMANTIC_KEY`, and `SERVICE_SCORE_KEYS` — the five in §11.1 order, which is also the
> Step 4.2.5.1 CSV column order. Do not redeclare them. `evaluation/report/serialize_service_scores.py`
> is the **single** flattener (plus `UNSCORED_SERVICE`, the all-`None` instance); write no second one.

#### Task 2.1.3 — Carry scores onto the evaluation record ✅

- **Step 2.1.3.1** ✅ — `evaluation/schemas.py`: add `service_scores: dict[str, ServiceScores]` to
  `QueryEvaluation` (default empty, so skipped queries stay valid).
- **Step 2.1.3.2** ✅ — `evaluation/evaluate_dataset.py` and `metrics/evaluate_query.py`: thread the score
  map through. **No metric changes** — scores are carried, never scored on.
- **Step 2.1.3.3** ✅ — `report/serialize_summary.py`: serialize the score map per query.
- **Step 2.1.3.4** ✅ — Regression check: `overall_score` byte-identical before and after this phase.
  ✅ **PASS**, offline. There is no test suite under `evaluation/`, so: `evaluate_query` was loaded from
  `git show HEAD:` as a second module and both versions run over 400 randomized `(ranked_names,
  ground_truth)` pairs — every pre-existing field identical, `overall_score` 0.29306325821704826 both
  sides. Separately, recomputing `overall_score` from the `metrics` block of both local `summary.json`
  files reproduced the stored value exactly, confirming it is a pure function of `summary['metrics']`.
  `SERVICE_SCORE_KEYS` is in none of `METRIC_KEYS` / `SET_METRIC_KEYS` / `COUNT_STAT_KEYS`.

### Phase 2.2 — Emit the file ✅

#### Task 2.2.1 — Config and text constants ✅

- **Step 2.2.1.1** ✅ — `vars.py`: add `UNEXPECTED_RETRIEVED_JSON_PATH` and `MISSED_GROUND_TRUTH_JSON_PATH`
  under the existing results-path block (M3 uses the second one; declaring both now avoids touching
  this file twice).
- **Step 2.2.1.2** ✅ — `vars.py`: add the payload key constants (`DIFF_JSON_SIDE_KEY`,
  `DIFF_JSON_QUERIES_KEY`, `DIFF_JSON_COUNT_KEY`, `DIFF_JSON_SERVICES_KEY`,
  `DIFF_JSON_GENERATED_FROM_KEY`) and the five score keys.
- **Step 2.2.1.3** ⚠️ — `strings.py`: extend `LOG_WROTE_RESULTS` with two new named params. One call site
  (`run_evaluation.py:58`) — update it in Step 2.2.3.2.
  ⚠️ **Not implementable as written; split across the two missions.** `str.format()` raises `KeyError` on
  a declared-but-unpassed param, and M2 writes only one new file — so Phase 2.2 added `{unexpected_json}`
  only, and Step 3.1.1.2 added `{missed_json}`. Final template carries six params, all passed
  (`run_evaluation.py:56-62`).

#### Task 2.2.2 — The payload builder ✅

- **Step 2.2.2.1** ✅ — Create `report/build_service_diff_json.py` with a private
  `_build_query_entry(entry, names_key)` returning one query's dict: `query`, `ground_truth_size`,
  `returned_count`, `count`, `services`, and `skip_reason` when set.
- **Step 2.2.2.2** ✅ — Same file: each element of `services` is
  `{rank, service_name, retrieval_score, semantic_score, lexical_score, cosine_score, cosine_score_ratio}`
  — an object per service rather than a bare name string, so the scores travel with it. `rank` is the
  1-based position within its own side.
  ✅ Implemented in `report/build_diff_service_entries.py`. **Note the score-key order in this step's
  inline list contradicts §11.1's example; §11.1 wins** (`retrieval → cosine → cosine_ratio → lexical →
  semantic`), because it also matches `SERVICE_SCORE_KEYS` and the Step 4.2.5.1 CSV columns.
  Name-normalization finding: no re-normalization is needed. `ranked_names` and the score-map keys are
  both `normalize_service_name`'d from the same `services[]` list with the same blank filter, so
  `set(score_map) == set(ranked_names)` by construction — measured 0 of 18,132 diff names differing from
  their own normalization. A defensive normalize call was deliberately *not* added: it would be a no-op
  here and would wrongly start resolving names on the missed side, where all-null is the intent (§11.9).
- **Step 2.2.2.3** ✅ — Same file: `build_unexpected_payload(summary)` — wraps the entries with `side`,
  `generated_from`, and `meta` copied from `summary['meta']`.
- **Step 2.2.2.4** ✅ — Skipped queries: emit `count: null` and `services: []`, mirroring how
  `build_per_query_rows.py:34-38` blanks skipped cells instead of writing zeroes.
- **Step 2.2.2.5** ✅ — Do **not** re-sort. Order is rank, already guaranteed by
  `metrics/compute_service_name_diff.py`.
- **Step 2.2.2.6** ✅ — Confirm the file is ≤100 lines and every function ≤30.
  ✅ `build_service_diff_json.py` 75 lines (max function 23), `build_diff_service_entries.py` 35 lines
  (max 14). It hit 108 lines once M3's second export landed, which forced the split — see Step 3.1.1.1.

#### Task 2.2.3 — Wire into the writer ✅

- **Step 2.2.3.1** ✅ — `report/write_results.py`: add `write_unexpected_retrieved_json(summary)` using
  `ensure_ascii=False, indent=2`, matching `write_summary_json`.
- **Step 2.2.3.2** ✅ — `report/write_results.py`: call it from `write_results`; update the
  `LOG_WROTE_RESULTS` call in `run_evaluation.py`.

#### Task 2.2.4 — Verify ✅

- **Step 2.2.4.1** ✅ — Run one full evaluation (Phase 2.1 changed the retrieval response, so the committed
  `results/summary.json` no longer has the score fields — this phase does need a live run).
  ~~⏳ **NOT DONE — the one blocking item.**~~ Note the step's premise is wrong twice: there is no
  *committed* `summary.json` (`results*/` is gitignored), and the local ones don't "no longer" have the
  score fields — they *never* had them, predating Phase 2.1.
  ✅ **DONE 2026-07-29 16:01–16:04.** `python -m evaluation.run_evaluation` from the repo root against
  live retrieval (`:8200`) and Elasticsearch (`127.0.0.1:9200`), **no `--rescrape`** — the ground-truth
  cache hit on all 65 queries, so nothing was scraped. Exit **0**, all thresholds passed, ~2.3 s/query.
  Both `results/unexpected_retrieved.json` (388 KB) and `results/missed_ground_truth.json` (318 KB) were
  written for the first time, and `summary.json` grew 286 KB → 659 KB, matching §14.1's "roughly triple"
  sizing note. `overall_score` **0.3157333828247543**. Whether the score *fields* are populated is
  Step 2.2.4.2 — they are not, and why is in §14.2.
- **Step 2.2.4.2** ✅ — Assert: 65 query entries; total `count` == 16,953; Hebrew unescaped; skipped queries
  carry `null`; **every** entry on the unexpected side has all five scores populated.
  🟡 **Structure verified offline, scores cannot be.** Measured against both local arms: **65** query
  entries each; total `count` **16,953** in `results-arm0-baseline/` (matches the spec exactly) and
  **1,179** in the current `results/` arm; zero `\uXXXX` escapes (`ensure_ascii=False` confirmed
  load-bearing); both skipped queries carry `count: null` + `services: []` + `skip_reason`; `count ==
  len(services)` everywhere; ranks 1-based and contiguous; nothing re-sorted.
  **The five-scores-populated assertion is still owed** — it is 0/1,179 and 0/16,953 today because
  neither `summary.json` carries a `service_scores` map. A synthetic response driven through the real
  chain (`parse_retrieval_response` → `evaluate_query` → `build_summary` → `build_unexpected_payload`)
  produced §11.1's shape exactly with `lexical_score: null` preserved, so the path is proven — but only a
  live run proves retrieval actually emits all five per service.
  🟡 **LIVE RUN 2026-07-29: structure PASSES with new numbers, scores FAIL 0/1,176.**
  Structure, measured on the live files: **65** query entries; total `count` **1,176** on the unexpected
  side (not 16,953 — that is §14.3's baseline arm; the judged arm is narrow, §14.4) and **966** on the
  missed side; `count == len(services)` on every entry; ranks **1-based and contiguous** everywhere;
  **zero** `\uXXXX` escapes in either file's bytes (Hebrew unescaped, `ensure_ascii=False` load-bearing);
  both skipped queries (`ש.יל בבאר שבע`, `מרכז סיוע לנפגעי איבה`) carry `count: null` + `services: []`;
  `side` reads `unexpected_retrieved` / `missed_ground_truth`; `generated_from` reads
  `results/summary.json`.
  Scores: **0/1,176 populated on every one of the five fields.** `service_scores` *is* present in
  `summary.json` and correctly keyed per query — the map exists with the right names and the right five
  keys, every value `None`. The cause is upstream of `evaluation/` entirely: retrieval's `services[]` omits
  the keys, so `dict.get` returned `None` as designed. See §14.2 for the proof it is a stale process.
  ~~**This assertion is still owed and must be re-run after retrieval is restarted.**~~ Independent of it:
  **exact-zero count across both files is 0** (2,142 rows × 5 fields), so no path substitutes `0.0` for a
  missing score — the Step 2.1.2.4 / §3.2 rule holds.
  ✅ **PASS after the restart — attempt 2, run of 2026-07-29 17:08:35–17:10:59.** Structure re-verified and
  scores now real. **65** query entries per file; unexpected side total `count` **1,180** and
  `sum(len(services))` **1,180**; missed side **968** / **968**; `count == len(services)` on every entry;
  ranks **1-based and contiguous** everywhere; **zero** `\uXXXX` escape sequences in either file's raw
  bytes; both skipped queries (`ש.יל בבאר שבע`, `מרכז סיוע לנפגעי איבה`) carry `count: null` +
  `services: []` + `skip_reason`; `side` reads `unexpected_retrieved` / `missed_ground_truth`;
  `generated_from` reads `results/summary.json`; `overall_score` **0.3025234053500492**.
  **Per-field populated counts on the 1,180 unexpected-side rows:**

  | Field | Populated | Null |
  | --- | ---: | ---: |
  | `retrieval_score` | **1,180 / 1,180** | 0 |
  | `cosine_score` | **1,180 / 1,180** | 0 |
  | `cosine_score_ratio` | **1,180 / 1,180** | 0 |
  | `semantic_score` | **1,180 / 1,180** | 0 |
  | `lexical_score` | 272 / 1,180 (23.1%) | 908 |

  Four of five are **fully populated**. **`lexical_score`'s 908 nulls are the correct value for this arm,
  not a failure**, and §14.4 predicted it: `LEXICAL_WEIGHT=0` means BM25 contributes nothing to fusion, so
  most documents that win a name on the semantic side were never in the BM25 hit list at all and have no
  lexical score to report. It is *not* null-everywhere — 272 rows do carry a real BM25 value (12–17 is the
  typical range), which is the useful confirmation: the field is genuinely plumbed end to end, and `null`
  is discriminating rather than a stuck default. Also re-checked: **exact-zero count is 0 across all 10,740
  cells** (2,148 rows × 5 fields) and **0 populated values are non-`float`**, so nothing coerced `None`
  into `0`/`0.0`/`False`.
- **Step 2.2.4.3** ✅ — Spot-check one query against the mock FE badges for the same query — the numbers
  must match to the displayed precision. ~~⏳ **DEFERRED** — recipe in §14.2.3.~~
  ~~⏳ **STILL DEFERRED after the live run.**~~ The query's shape reproduced exactly (`ground_truth_size` 19,
  `returned_count` 3, `count` 1, one unexpected service at rank 1) but all five of its values are `null`,
  so there is nothing to compare against the raw response. The null-not-zero rule — the one thing worth
  failing over — held everywhere measured, but against an all-null file. Expected values for the re-run are
  recorded in §14.2.3.
  ✅ **PASS 2026-07-29 (attempt 2), against the raw `POST /api/retrieve` response rather than the FE.**
  The mock FE renders no service-level badges (`ServiceResult` ignores the new fields, §14.2.2), so the
  comparison was made against the raw response, which is the stricter target: it is **unrounded**, so this
  matches on full precision instead of the FE's 4 dp. Three queries, **45 value cells, 0 mismatches**,
  compared by value **and** by type.
  **The suggested query closed exactly against §14.2.3's pre-computed expected values.**
  `ילדים בסיכון פעילות אחר הצהריים` → `תכנית אחר הצהרים לילדי בית הספר` at rank 1:

  | Field | §14.2.3 expected | `unexpected_retrieved.json` | Raw response |
  | --- | --- | --- | --- |
  | `retrieval_score` | 0.010638297872340425 | 0.010638297872340425 | 0.010638297872340425 |
  | `cosine_score` | 0.8633895 | 0.8633895 | 0.8633895 |
  | `cosine_score_ratio` | 0.9885905371704945 | 0.9885905371704945 | 0.9885905371704945 |
  | `lexical_score` | `null` | `null` | `null` |
  | `semantic_score` | 0.93169475 | 0.93169475 | 0.93169475 |

  All five identical across all three columns — so the prediction recorded before the restart was right to
  the last digit, which independently validates the `parse_retrieval_response` → `serialize_service_scores`
  chain. The backup query `מועדון יום לאזרחים ותיקים כולל הסעות באזור השרון` →
  `מרכז יום לאזרחים ותיקים` also matched on all five (including a **populated** `lexical_score` of
  `16.795755`, so the check is not vacuous on that field), and a 7-row query (`הוסטל בצפת`) matched on all
  35 of its cells, mixing populated and `null` lexical values. **The null-not-zero rule now has real
  evidence behind it:** on rows where other fields carry numbers, `lexical_score` still arrives as
  `NoneType`, never `0.0`.
- **Step 2.2.4.4** ✅ — `README.md`: add the file to the Outputs section, noting `results/` is gitignored so
  this is a run artifact, not committed data. ✅ `evaluation/README.md:183-202`.

---

## 6. Mission 3 — JSON of golden-set services we never retrieved ✅

**Deliverable:** `results/missed_ground_truth.json`. Same shape as M2, other side of the diff.

> Mission 3 deliberately reuses everything M2 built. If M2 is done properly this is one small task.

**Status: ✅ COMPLETE (2026-07-29).** It was one task, as predicted.

### Phase 3.1 — Emit the file ✅

#### Task 3.1.1 — Second payload and writer ✅

- **Step 3.1.1.1** ✅ — `report/build_service_diff_json.py`: add `build_missed_payload(summary)`, reusing
  the same private `_build_query_entry`. Same-scope multi-export is allowed and mirrors the existing
  `build_service_diff_rows.py`.
  ✅ `_build_query_entry` was reusable untouched, as designed. But the payload *wrapper* had not been
  factored out, so a second export took the file to 108 lines — over the limit. Resolved by extracting a
  shared private `_build_payload(summary, side, names_key)` (both public builders are now one-line
  delegations) **and** moving the service-object builder to `report/build_diff_service_entries.py`. Pure
  move; nothing outside the module imported it.
- **Step 3.1.1.2** ✅ — `report/write_results.py`: add `write_missed_ground_truth_json(summary)` and call
  it from `write_results`. ✅ Also extracted `write_diff_json(payload, path)` so both sides share one
  serializer. Plus the `{missed_json}` param Step 2.2.1.3 could not add — see that step.
- **Step 3.1.1.3** ✅ — Emit the same five score keys as `null` on this side. These services were never
  retrieved, so they have no cosine, no BM25 and no fused score — see §11.9. Emit the keys explicitly
  rather than omitting them, so the two files share one schema and the M4 CSV has a stable column set.
  ✅ **Guaranteed by construction — no code was added for it.** The score map is keyed on the names
  retrieval *returned*; `compute_service_name_diff` yields only names `not in set(ranked_names)`; so the
  lookup always misses → `serialize_service_scores(None)` → `UNSCORED_SERVICE` → five explicit JSON
  nulls, keys present. No path can produce a number: `dict.get` with no default throughout, no `or 0.0`,
  no `float()`, no rounding. Confirmed empirically with a synthetic summary whose score map *was*
  populated for the returned name — the missed side still emitted five nulls.
- **Step 3.1.1.4** ✅ — Verify as in Task 2.2.4: total `count` == 576; all five score fields `null`.
  ✅ **PASS.** `results-arm0-baseline/` totals **576** (matches the spec exactly); the current `results/`
  arm totals **966**. Zero non-null score fields on either. 65 query entries, Hebrew unescaped, skipped
  queries `null`/`[]`, ranks contiguous. `side` emits `missed_ground_truth`, byte-identical to
  `service_diff.csv` (both read `strings.SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH`), and the
  `(query, side, rank)` join to that CSV is **966/966** and **576/576** — so Step 4.2.5.4 is pre-satisfied.
  ✅ **Re-confirmed on the live run 2026-07-29.** Missed side totals **966**, all five score fields `null`
  on all 966 rows, zero exact-zeros. The `(query, side, rank)` join to the live `service_diff.csv` (2,142
  rows, columns `query, side, rank, service_name`) is **966/966** on the missed side and **1,176/1,176** on
  the unexpected side — **100% on both, 2,142/2,142 overall**, with no CSV row left unmatched.
  ✅ **Re-confirmed again on attempt 2's run (2026-07-29 17:08), the run that finally carries real scores —
  which is what makes this side's all-null assertion non-vacuous for the first time.** Previously the
  missed side would have passed either way, because retrieval was sending nothing at all; now the
  unexpected side of the *same* `summary.json` carries 1,180 fully-scored rows while the missed side still
  emits **968/968 rows with all five fields `null`**, so the null is demonstrably produced by
  `serialize_service_scores(None)` on a genuine lookup miss and not by an empty upstream. Missed side
  totals **968**; **0 non-null** on each of the five fields; zero exact-zeros. The `(query, side, rank)`
  join to the live `service_diff.csv` (**2,148** rows, same four columns, 2,148 distinct keys) is
  **968/968** missed and **1,180/1,180** unexpected — **100% on both, 2,148/2,148 overall**, **0 CSV rows
  left unmatched**, and the join also holds with `service_name` equality asserted, not just key presence.
- **Step 3.1.1.5** ✅ — `README.md`: add the second file to Outputs. ✅ `evaluation/README.md:203-208`.

---

## 7. Mission 4 — LLM relevance judging

**Deliverable:** `results/relevance_judgements.csv` + committed `data/relevance-judgements.json`.

> **Rule 7 applies in full.** All understanding, parsing and decision-making stays with the LLM. No code
> may pre-filter, keyword-match, score, or hint. If the judge is wrong, the fix is the **prompt, worked
> examples, or model choice** — never code that does part of the judging.

Design reasoning: model and API choices §11.2, **operating a lite-tier judge §11.2.1**, cache §11.3,
prompt §11.5, cost §11.6. **The judge is `gemini-3.1-flash-lite`** — every step below is written against
Google's `google-genai` SDK and Batch API, not Anthropic's.

### Phase 4.1 — Plumbing (no LLM calls in anger)

*Goal: everything except the prompt, verifiable with two hand-written requests.*

#### Task 4.1.1 — Config and text

- **Step 4.1.1.1** — Create `relevance_vars.py`: `JUDGE_MODEL='gemini-3.1-flash-lite'`,
  `JUDGE_THINKING_LEVEL='minimal'` (the Gemini thinking control that replaces Anthropic's `effort`; it is
  also this model's documented default and thinking cannot be disabled — §11.2),
  `JUDGEMENT_CHUNK_SIZE=40`, `JUDGE_MAX_TOKENS`, `JUDGEMENT_CACHE_PATH`,
  `RELEVANCE_JUDGEMENTS_CSV_PATH`, verdict constants (`VERDICT_RELEVANT`, `VERDICT_IRRELEVANT`,
  `VERDICT_UNCLEAR`), cache keys, `REVIEW_SAMPLE_SEED`, `JUDGEMENT_SCHEMA_VERSION`. Split out of
  `vars.py` following the `scraper_vars.py` precedent.
- **Step 4.1.1.2** — Create `relevance_strings.py`: the judge's **operational** literals — CLI help, CSV
  headers, log lines, error messages. **Amended 2026-07-29 (Phase 4.2): the judge system prompt lives in
  its own file, `relevance_prompt_strings.py`.** With Phase 4.2's additions `relevance_strings.py` reached
  140 lines, over §13's 100-line rule, and the prompt is the correct seam: it is owned by Phase 4.3 and any
  edit to it invalidates the judgement cache, while the operational strings change for unrelated reasons
  and must never move `prompt_checksum`. The move was byte-identical — `compute_prompt_checksum()` is
  `sha256:7151a637…d97b4` before and after — and `relevance/judgement_cache.py` and
  `relevance/build_judgement_request.py` are its only two importers.

#### Task 4.1.2 — Schema

- **Step 4.1.2.1** — `schemas.py`: add frozen `ServiceJudgement(query, side, rank, service_name,
  verdict, reason)`.

#### Task 4.1.3 — Dependency and credentials

- **Step 4.1.3.1** — `requirements.txt`: add `google-genai`, pinned, with a comment matching the file's
  existing convention. That is the current official package (`from google import genai`); the older
  `google-generativeai` package is not what these steps describe.
- **Step 4.1.3.2** — `.env.example`: add `GEMINI_JUDGE_API_KEY=` (name only, never a value), and declare
  it in `relevance_vars.py` as `os.getenv('GEMINI_JUDGE_API_KEY', '')`. The name is **purpose-scoped**,
  matching `retrieval/`'s `GEMINI_EMBEDDER_API_KEY`, so the judge's key and the embedder's key are
  independently settable and revocable. That makes explicit construction **mandatory**: `genai.Client()`
  with no argument only ever looks up `GEMINI_API_KEY` / `GOOGLE_API_KEY`, so the client must be built as
  `genai.Client(api_key=GEMINI_JUDGE_API_KEY)`, from an `@lru_cache(maxsize=1)` accessor in
  `clients/llm_client.py` whose empty-key check is **inside** the function — never at import time, so a
  run that never judges does not trip it. Mirrors
  `retrieval/app/services/text_embedding/providers/gemini/get_gemini_client.py`; the error text lives in
  `relevance_strings.py`.
- **Step 4.1.3.3** — Confirm `.env` is gitignored in `evaluation/.gitignore`. It is — no change, just
  verify before the first key is written.

#### Task 4.1.4 — LLM client

- **Step 4.1.4.1** — Create `clients/llm_client.py`: `submit_judgement_batch(requests)` — write the
  requests as a JSONL file, upload it via the File API, then `client.batches.create(model=JUDGE_MODEL,
  src=<uploaded_file.name>, config={'display_name': …})`; `wait_for_batch(job_name)` — poll
  `client.batches.get(name=job_name).state.name` until it leaves `JOB_STATE_PENDING` /
  `JOB_STATE_RUNNING`, treating `JOB_STATE_FAILED` / `JOB_STATE_CANCELLED` / `JOB_STATE_EXPIRED` as
  errors (jobs expire at 48 h); `read_batch_results(job)` — `client.files.download(...)` the result file
  and yield one parsed JSONL line at a time. **Use the file path, not `src=[inline dicts]`** — inline
  requests carry no `key` and are correlated by position (§11.2, and the §12 row on positional keying).
  `try/except` is allowed here and in `run_evaluation.py` only.
- **Step 4.1.4.2** — Smoke test with two hand-written requests carrying deliberately distinct `key`
  values. Confirm each result line can be joined back **by `key`** — the Gemini equivalent of Anthropic's
  `custom_id` — and **never index by position**. Ordering is not documented as guaranteed; treat it as
  arbitrary. This smoke test is also where the ⚠️ marker in §11.2 gets closed: verify the result lines
  actually echo `key` at all, and if a build does not echo it, stop and solve that before Phase 4.2.
- **Step 4.1.4.3** — Confirm the per-request `generation_config` is honoured inside the batch — system
  instruction, response schema/MIME type, `thinking_config`, `max_output_tokens`. Gemini has no
  batch-rejected-parameter equivalent of Anthropic's `fallbacks`, so there is nothing to omit; the check
  is the reverse one, that what you set is not silently ignored. Assert it by reading back one smoke-test
  response and confirming it is valid JSON matching the schema.

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

- **Step 4.2.1.1** — Create `relevance/build_judgement_items.py`: read `unexpected_retrieved.json`
  and `missed_ground_truth.json` **from `JUDGE_INPUT_DIR` (`evaluation/results-judge-frozen/`), not
  from `results/`**, and emit a flat item list carrying `(query, side, rank, service_name)` plus the
  five carried scores. **Amended 2026-07-29 — see §14.5.** `results/` is overwritten by any
  concurrent run, and §14.4.3 proves the same config does not reproduce the same pair set, so the
  frozen file content is the only thing that identifies the judged dataset. Reading `results/` here
  would let a run of a different arm silently redefine what is being judged mid-mission.
- **Step 4.2.1.2** — Create `relevance/chunk_judgement_items.py`: group by `(query, side)`, split each
  group at `JUDGEMENT_CHUNK_SIZE`. **Measured on the frozen snapshot: 2,148 pairs → 115
  `(query, side)` groups → 127 chunks at size 40** (63 unexpected-side, 64 missed-side; largest 40,
  smallest 1). The earlier "~440 chunks" figure was computed for the 17,529-pair baseline arm and does
  not apply — §14.3.

#### Task 4.2.2 — Request construction

- **Step 4.2.2.1** — Create `relevance/judgement_schema.py`: the structured-output JSON schema. Gemini's
  supported subset is **wider** than Anthropic's, and the constraints invert (§11.2): `additionalProperties`
  is *allowed but not required*, and `enum` / `minItems` / `maxItems` / `minimum` / `maximum` **are**
  supported. So: put every field in `required`, use `enum` on `verdict` to pin the three verdict
  constants, and keep the schema shallow — the API may reject very large or deeply nested schemas.
  **Unsupported keywords are silently ignored, not rejected**, so never rely on a constraint you have not
  seen take effect; Step 4.2.3.2's completeness assertion is the real guard.
- **Step 4.2.2.2** — Create `relevance/build_judgement_request.py`: one batch request per chunk — a
  `{"key": <chunk id>, "request": {...}}` JSONL line whose request carries the system instruction, a user
  payload of `{query, services: [{id, name}]}`, the structured-output config (response MIME type
  `application/json` + the Step 4.2.2.1 schema), `thinking_config` from `JUDGE_THINKING_LEVEL`, and
  `max_output_tokens = JUDGE_MAX_TOKENS` with headroom. **Declare no cache** — no `cached_content`, and no
  Anthropic-style `cache_control`: the ~600-token system prompt is far below every published minimum
  cacheable prefix, implicit caching is already on by default, and the input side of this job costs cents
  (§11.2, §11.6).
- **Step 4.2.2.3** — Thinking: set `thinking_config: {thinking_level: JUDGE_THINKING_LEVEL}` and leave it
  at `minimal`. Thinking **cannot be disabled** on any Gemini 3 model — `minimal` reduces it, it does not
  remove it — and `minimal` is already this model's documented default. `thinking_budget` is the Gemini
  2.5 control and must not be used here. Thinking tokens are billed at the output rate, so
  `thinking_level` is the cost lever that `effort` used to be; size `JUDGE_MAX_TOKENS` with headroom
  regardless of whether they consume the output cap (§11.2's ⚠️).

#### Task 4.2.3 — Result parsing

- **Step 4.2.3.1** — Create `relevance/parse_judgement_result.py`: batch result → `ServiceJudgement`
  list, joining back to items via the request **`key`** (Gemini's `custom_id` equivalent) and the echoed
  per-item `id`. Each result line is either a `GenerateContentResponse` or a status object, so branch on
  which one it is before reading any candidate.
- **Step 4.2.3.2** — Assert every submitted `key` came back and every item id inside each chunk got
  exactly one verdict. Raise on any gap — a silently dropped chunk looks like valid output, and on a
  lite-tier model id omission and id drift on long chunks are the *expected* failure, not an exotic one
  (§11.2.1(b)). When this fires repeatedly, halve `JUDGEMENT_CHUNK_SIZE` before touching anything else.
- **Step 4.2.3.3** — Branch on `finishReason` explicitly. **Only `STOP` yields a verdict.** Treat
  `MAX_TOKENS`, `SAFETY`, `RECITATION`, `PROHIBITED_CONTENT`, `BLOCKLIST`, `SPII`, `LANGUAGE`, `OTHER` and
  anything unrecognised as unjudged: log the chunk and its reason, write no verdict, count it. There is no
  `refusal` reason in Gemini — a safety block surfaces as `finishReason: SAFETY` on the response side.
- **Step 4.2.3.4** — Handle the **no-candidate** case separately: a prompt-side block returns
  `promptFeedback.blockReason` and **no `candidates` at all**, so never index `candidates[0]` blind — that
  is an `IndexError`/`AttributeError` on a chunk that should have been logged as unjudged. Also handle the
  per-line `error` object the Batch API returns for a failed request. Log the blocked chunk's `key` so the
  affected pairs are identifiable rather than just missing (see the §12 row).

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

- **Step 4.3.1.1** — Run `client.models.count_tokens(model=JUDGE_MODEL, contents=…).total_tokens` on one
  representative chunk. Record actual input tokens against the §11.6 estimate. Do not use `tiktoken` —
  it is OpenAI's tokenizer and undercounts Hebrew badly, and Gemini's tokenizer is not Anthropic's either,
  so §11.6's per-pair rate is inherited, not measured. After the first real chunk completes, also record
  `usageMetadata.thoughtsTokenCount` next to `candidatesTokenCount`: that is what closes the §11.2 ⚠️ on
  whether thinking tokens consume `max_output_tokens`, and it is the output-side input to §11.6.

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
- **Step 4.3.3.2** — Full `--judge` over the frozen arm: **2,145 pairs (~$0.09 batched)** on the current
  arm, **17,529 (~$0.76 batched)** on the baseline arm. §11.6 prices both; §14.3 is why the arm must be
  chosen first.
- **Step 4.3.3.3** — Commit `data/relevance-judgements.json`. It is the reproducible labelled dataset
  and lets a clean checkout compute adjusted metrics with no API key.
- **Step 4.3.3.4** — Record, alongside the labels in `data/relevance-judgements.json`: **the SHA-256
  of both frozen input files** (`unexpected_retrieved.json`, `missed_ground_truth.json`, as recorded in
  `results-judge-frozen/judge_input_manifest.json`), plus the retrieval configuration
  (`CANDIDATE_POOL_SIZE`, weights, all cutoffs) and the scrape date. **Amended 2026-07-29 — the two
  hashes are mandatory, not the config.** §14.4.3 measured that the same `.env` and the same
  Elasticsearch do not reproduce the same pair set, so the config identifies the *arm* but not the
  *dataset*; only the file content does. Adding these two keys changes the cache payload shape, so
  **bump `JUDGEMENT_SCHEMA_VERSION`** when this lands (§11.3) — Phase 4.2 deliberately left the
  payload untouched, since no labels exist yet to invalidate.

---

## 8. Mission 5 — relevance statistics

**Deliverable:** a `relevance` block in `summary.json`, a console table, a dashboard panel.

Definitions in §11.7.

**Implementation status: code shipped 2026-07-29, verified on synthetic labels only.** Every step
below is built and driven end to end, but `GEMINI_JUDGE_API_KEY` is unset and Phase 4.3 has not run,
so `data/relevance-judgements.json` does not exist and **no number this mission emits is real yet**.
The chain was proven against synthetic verdicts laid over the real 2,148 frozen identities — see
§14.6, which also records what that does and does not establish.

### Phase 5.1 — Compute ✅ (code)

#### Task 5.1.1 — Verdict statistics ✅ (code)

- **Step 5.1.1.1** ✅ — Create `metrics/aggregate_relevance_statistics.py`: per side, the counts of
  `relevant` / `irrelevant` / `unclear` / unjudged, plus `missed_truly_irrelevant_rate` and
  `unexpected_actually_relevant_rate`. Shipped, with the bucket tally split into
  `metrics/count_relevance_verdicts.py` to hold the 100-line rule. The tally is **items-driven, not
  judgement-driven**: iterating judgements would make a pair whose chunk came back blocked vanish
  instead of landing in `unjudged`, so the buckets always sum to the side's pair count.
- **Step 5.1.1.2** ✅ — Exclude `unclear` from rate denominators, and always emit the raw counts next to
  each rate. A rate over a shrunken denominator is misleading on its own. Shipped: the denominator is
  `relevant + irrelevant`, so **`unjudged` is excluded too** — it is a stronger exclusion, there being
  no verdict at all — and every rate travels with its own `_count` and `_denominator` key in
  `summary.json` and with both printed inside its own console label.
- **Step 5.1.1.3** ✅ — Never fold `unclear` into `irrelevant`. It is its own bucket end to end.
  Shipped and tested by counter-example: relabelling every `unclear` as `irrelevant` moves the
  bucket, the numerator and the denominator, which is what proves nothing merges them.

#### Task 5.1.2 — Adjusted metrics ✅ (code)

- **Step 5.1.2.1** ✅ — Create `metrics/adjusted_set_metrics.py`:
  `adjusted_precision_at_returned = (hits + unexpected_judged_relevant) / |R|`,
  `adjusted_recall_at_returned = hits / (|G| − missed_judged_irrelevant)`, and
  `adjusted_f1_at_returned` from the two. Shipped. `hits`, `|R|` and `|G|` are read off the **frozen
  snapshot's own per-query records** by `relevance/read_frozen_query_records.py`, never recomputed and
  never taken from the live run — the labels belong to the frozen bytes, and §14.5 explains why a
  re-run does not reproduce them. `|R|` and `|G|` are verbatim; `hits` is the set identity
  `|R| − |unexpected|`, cross-checked against `|G| − |missed|` from the other file and **raising** if
  the two files disagree. Both denominators are guarded through the existing `precision_at_k` /
  `recall_at_k` helpers, which return `0.0` on a zero denominator — the recall one is reachable when
  every golden-set service was missed *and* judged irrelevant. Aggregation is the per-query mean over
  the same 59 queries `aggregate_set_metrics` averages, so the adjusted and unadjusted pairs are
  comparable and the difference between them is the judge's contribution alone.

### Phase 5.2 — Surface ✅ (code)

#### Task 5.2.1 — `summary.json` ✅ (code)

- **Step 5.2.1.1** ✅ — `report/serialize_summary.py`: add a `relevance` **sibling** block next to
  `set_metrics` and `count_stats`. Shipped, spliced in between `count_stats` and `meta`. The key is
  **absent, not empty**, on an unjudged run: every reader branches on it existing, and an empty dict
  would render a panel of zeroes that reads as "the judge found nothing relevant".
- **Step 5.2.1.2** ✅ — Never put these keys inside `metrics`. `compute_overall_score` averages whatever
  keys it finds in each per-k dict, so folding them in silently redefines the headline score and breaks
  comparison with `results-arm0-baseline/`. `aggregate_metrics.py:31-36` documents this hazard.
  Closed: no new key enters `METRIC_KEYS` / `SET_METRIC_KEYS` / `COUNT_STAT_KEYS`, and every per-k
  metrics dict still holds exactly `METRIC_KEYS` after the block is added.
- **Step 5.2.1.3** ✅ — Add a regression check asserting `overall_score` is byte-identical with and
  without `--judge`. Proven structurally, since `--judge` cannot be run without a key:
  `compute_overall_score` reads only `aggregate['metrics']`, and `build_summary` called with and
  without a `relevance` block yields `repr()`-identical `0.3025234053500492` both ways — the frozen
  manifest's value to the last digit. See §14.6.

#### Task 5.2.2 — Console ✅ (code)

- **Step 5.2.2.1** ✅ — Create `report/build_relevance_table.py`. One table, so the rates are read in
  sight of the bucket counts they were computed over. Counts are rendered as strings, because
  `render_table`'s float formatter would otherwise print a pair count of 1,180 as `1180.0000`.
- **Step 5.2.2.2** ✅ — `run_evaluation.py`: print it via `render_titled_table` only when the block exists.
- **Step 5.2.2.3** ⚠️ **amended** — **not** `strings.py`. That file is 92 lines and the labels would
  have pushed it to ~107, so they went into a new focused `relevance_statistics_strings.py`, the same
  hold-the-line-limit move §14.5 records for `relevance_input_vars.py` and `relevance_report_vars.py`.
  `relevance_strings.py` was not an option either, at 98 lines. Keys went into a new
  `relevance_statistics_vars.py` for the same reason — `relevance_vars.py` is at exactly 100.

#### Task 5.2.3 — Dashboard ✅ (code)

- **Step 5.2.3.1** ✅ — `dashboard/dashboard.html`: add a relevance panel that renders nothing when the
  block is absent, so an un-judged run still produces a valid dashboard. Shipped and verified by
  executing the template's real script against both payloads: 4 panels without the block, 5 with, and
  no error panel either way. The panel reads the block's own keys rather than a list the HTML keeps,
  so it cannot drift from the aggregation; side labels keep their underscores because they are the
  same literals `service_diff.csv` joins on.

---

## 9. Mission 6 — human audit of the judge

**Deliverable:** `results/human_review_sample.csv` out, `results/agreement_report.json` back.

Field definitions and the acceptance bar in §11.8.

**Every step below is BUILT. The mission's deliverable is not, and cannot be by code: it needs the
human. See §14.7 for what was verified how, and for the runbook.**

### Phase 6.1 — Sheet out

#### Task 6.1.1 — Stratified sample

- **Step 6.1.1.1** ✅ — Create `human_review/build_review_sample.py`: stratify by `side × verdict` so the
  rare cells (the ~968 missed rows; every `unclear`) are represented rather than drowned by the
  1,180-row unexpected side. ~~all 576 missed rows … 16,953-row unexpected side~~ — those were the
  baseline arm's counts, corrected to the frozen arm's per §14.5. Built as a floor per non-empty cell
  and then a proportional split; three files, because the allocation arithmetic is its own concern
  (`allocate_sample_budget.py`, `stratify_judged_pairs.py`). **Note the literal reading of "all 968
  missed rows" is unachievable at N=200** and was implemented as "the missed side and every `unclear`
  cell are represented and lifted above pure proportionality" — §14.7.
- **Step 6.1.1.2** ✅ — Draw with `REVIEW_SAMPLE_SEED` from `relevance_vars.py` so the sheet is
  reproducible and two reviewers can be handed the identical rows. One `random.Random`, seeded once,
  consumed in a fixed stratum order. The read-back **redraws** the sample from that seed rather than
  persisting a review_id → pair mapping, which is what lets the sheet withhold the verdict.
- **Step 6.1.1.3** ✅ — Shuffle rows and **withhold the `verdict` and `reason` columns**. Showing the LLM's
  answer first is anchoring and would make the agreement number meaningless.
- **Step 6.1.1.4** ✅ — **Withhold the score columns too.** The reviewer is judging whether a service helps
  someone who asked that query — a cosine of 0.85 is not evidence for that, but it will read as
  evidence and pull the human toward the retriever's opinion. The scores belong in the final joined
  table (Task 4.2.5), not in the sheet a human answers from. Enforced by
  `write_review_sheet_csv.assert_header_withholds_answers` against the writers' own header constants,
  by exact equality so `human_verdict` is not mistaken for `verdict`.

#### Task 6.1.2 — Emit

- **Step 6.1.2.1** ✅ — `run_evaluation.py`: add `--review-sample N` (default 200). `nargs='?'` with
  `const=REVIEW_SAMPLE_SIZE_DEFAULT`, so the flag carries 200 when N is omitted while its **absence**
  still means "emit nothing" — a plain default would have emitted a sheet on every ordinary run.
- **Step 6.1.2.2** ✅ — Write `review_id, query, side, rank, service_name, human_verdict, human_notes`
  with the last two blank.

### Phase 6.2 — Verdicts in

#### Task 6.2.1 — Read back

- **Step 6.2.1.1** ✅ — Create `human_review/load_review_verdicts.py`.
- **Step 6.2.1.2** ✅ — Create `human_review/align_verdicts.py` joining on `review_id`. `review_id`
  carries no information about the pair, so the four identity columns are read back off the sheet and
  compared against the redraw; a mismatch raises rather than attaching an answer to a different service.
- **Step 6.2.1.3** ✅ — ~~`schemas.py`: add frozen `HumanVerdict`.~~ **`schemas.py` was at 99 of its 100
  lines**, so `HumanVerdict` went into a new sibling, `human_review_schemas.py`, alongside
  `ReviewSampleRow` and `AlignedVerdict` — the same split-for-budget precedent as
  `relevance/frozen_query_record.py` and the four `relevance*_vars.py` files. All three are frozen.
- **Step 6.2.1.4** ✅ — Tolerate partially-filled sheets: report `reviewed_count` separately from
  `sample_size` rather than treating a blank as a verdict.

#### Task 6.2.2 — Agreement

- **Step 6.2.2.1** ✅ — Create `metrics/agreement_statistics.py`: `raw_agreement`, `cohens_kappa`,
  `confusion_by_side` (3×3 per side), `agreement_by_verdict`, `disagreement_rows`. Pure; κ is a few
  lines of arithmetic, no new dependency. κ and the confusion matrix are their own files
  (`metrics/cohens_kappa.py`, `metrics/build_confusion_by_side.py`) for the line budget. κ validated on
  four hand-computable cases including the degenerate one — §14.7.
- **Step 6.2.2.2** ✅ — Create `report/write_agreement_report.py`.
- **Step 6.2.2.3** ✅ — `run_evaluation.py`: add `--agreement`. Both M6 flags **return before the
  evaluation runs**: they read the frozen snapshot and the committed label cache only, so evaluating
  would call retrieval and overwrite `results/` with whatever arm happens to be serving for no gain.

#### Task 6.2.3 — The gate

- **Step 6.2.3.1** ✅ (mechanism) / ⏳ **OPEN** (outcome) — Check `raw_agreement ≥ 0.85` **and**
  `cohens_kappa ≥ 0.60`. Report both always: with a skewed verdict distribution raw agreement can look
  excellent while κ is near zero, which means the judge is guessing the majority class. An **undefined**
  κ is `null` and does not pass — see §14.7 on the sentinel.
- **Step 6.2.3.2** ✅ (encoded) — If below the bar: return to Task 4.3.2, revise the **prompt only**,
  re-judge (the cache invalidates on prompt change), and re-sample. Do not proceed to M7. Encoded as the
  reported `gate.outcome` **string only**: nothing is re-judged, no prompt is edited, and the run still
  exits 0. Automating any of it from a threshold would re-judge the dataset on a dozen hand-filled rows.
- **Step 6.2.3.3** ✅ (encoded) — If at or above the bar: the M5 adjusted metrics are usable. Proceed.

**The gate is OPEN and undecided.** `GEMINI_JUDGE_API_KEY` is unset, Phase 4.3 has never run,
`data/relevance-judgements.json` does not exist, so there are no LLM verdicts to sample and no human has
reviewed anything. Every number in this section is unmeasured. **No human verdict was fabricated,
simulated or seeded anywhere** — doing so would make `raw_agreement` and `cohens_kappa` a measurement of
an LLM against an LLM, which is §12's top risk row and the one failure that still looks like a result.

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

### 11.2 Judge model and API surface (M4) — Gemini

- **Model: `gemini-3.1-flash-lite`** (Google, listed **Stable**). Confirmed 2026-07-29: `$0.25`/MTok
  input, `$1.50`/MTok output, `$0.025`/MTok cached input; **1,048,576** input / **65,536** output token
  limits; multimodal (text, image, video, audio, PDF); Batch API, caching, structured outputs, thinking
  and function calling all listed **Supported**. Google positions it as the low-latency, cost-effective
  model for high-frequency lightweight work. Artificial Analysis rates it intelligence index **25**
  (**#44 of 154**) and publishes **no multilingual benchmark** for it — so its Hebrew judgement quality
  is unmeasured going in. That gap is not hand-waved: §11.2.1 is how it is managed and Task 6.2.3 is
  what decides whether it is usable at all.
- **SDK: `google-genai`** — `pip install google-genai`, `from google import genai`, `client =
  genai.Client(api_key=…)`. The no-argument `genai.Client()` resolves only `GEMINI_API_KEY` /
  `GOOGLE_API_KEY`, and this judge's key is purpose-scoped as **`GEMINI_JUDGE_API_KEY`** (independent of
  `retrieval/`'s `GEMINI_EMBEDDER_API_KEY`), so the key is **always passed explicitly** — Step 4.1.3.2.
- **Batch API** — **50%** of interactive cost, 24-hour target turnaround, job **expires at 48 h**.
  `client.batches.create(model=…, src=…, config={'display_name': …})`; poll
  `client.batches.get(name=job.name).state.name` against `JOB_STATE_PENDING` / `JOB_STATE_RUNNING` /
  `JOB_STATE_SUCCEEDED` / `JOB_STATE_FAILED` / `JOB_STATE_CANCELLED` / `JOB_STATE_EXPIRED`.
- **The join key is `key`, not `custom_id`.** JSONL input is one
  `{"key": "<our chunk id>", "request": {"contents": […], "generation_config": {…}}}` per line, and the
  docs state the user-defined key is what the response uses to indicate which output belongs to which
  request. **Use the JSONL / File API path, not `src=[inline dicts]`** — inline requests carry no `key`
  and are correlated **by position**, which is exactly the §12 failure mode. Inline is also capped at
  20 MB total vs. 2 GB for an uploaded JSONL, and the docs recommend the file path for larger jobs.
  Results: inline via `batch_job.dest.inlined_responses` (each item has `response` or `error`), file via
  `client.files.download(file=result_file_name)` — a JSONL whose every line is either a
  `GenerateContentResponse` or a status object.
  > ⚠️ VERIFY AT IMPLEMENTATION: the Batch API page does **not** state that file-based result lines echo
  > `key`, nor that result order matches input order. Confirm both on the Task 4.1.4.2 smoke test
  > (2 requests, deliberately distinct keys) before trusting the join —
  > https://ai.google.dev/gemini-api/docs/batch-api
- **Structured output — the constraints are the opposite of Anthropic's.** Supported keywords:
  `type` (incl. `null`), `properties`, `required`, `additionalProperties`, `title`, `description`,
  `enum` (strings *and* numbers), `format` (`date-time`/`date`/`time`), `items`, `prefixItems`,
  `minItems`, `maxItems`, `minimum`, `maximum`. So `additionalProperties: false` is **allowed but not
  required**, and numeric/length constraints **are** supported. Unsupported keywords are **silently
  ignored, not rejected** — the risk inverts from "request fails" to "constraint you thought you set
  isn't there". Documented limits are qualitative only: the API may reject very large or deeply nested
  schemas.
  > ⚠️ VERIFY AT IMPLEMENTATION: the config key naming has moved. The Batch API page shows
  > `response_mime_type` + `response_schema`; the current structured-output page shows
  > `response_format: {"text": {"mime_type": "application/json", "schema": …}}`. Print the accepted
  > kwargs of the installed `google-genai` version and use whichever that build accepts —
  > https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- **Thinking replaces `effort`.** `thinking_config: {thinking_level: …}` (REST:
  `generationConfig.thinkingConfig.thinkingLevel`). For `gemini-3.1-flash-lite` the documented levels
  are `minimal` / `low` / `medium` / `high` with **default `minimal`**, and thinking **cannot be
  disabled** on any Gemini 3 model — `minimal` reduces it, it does not remove it. `thinking_budget` is
  the Gemini **2.5** control and does not apply here. Thinking tokens are **billed as output** (response
  price = output + thinking) and reported separately as `thoughtsTokenCount` / `total_thought_tokens`.
  Take the default: `minimal` is both the cheapest and the documented default, and this is bounded
  classification.
  > ⚠️ VERIFY AT IMPLEMENTATION: whether thinking tokens are *deducted from* `max_output_tokens` is
  > stated inconsistently — the Interactions page says thinking tokens "do not count against output
  > token limits", while Gemini 2.5 behaviour was the reverse and forum reports show `MAX_TOKENS` with
  > empty text. Size `JUDGE_MAX_TOKENS` with headroom either way and confirm on the Task 4.3.1 baseline —
  > https://ai.google.dev/gemini-api/docs/generate-content/thinking
- **Caching: expect implicit only, and expect it not to fire.** Implicit caching is on by default for
  Gemini 2.5 and newer, needs no field, and hits are reported in `usage.total_cached_tokens` /
  `cachedContentTokenCount`. Explicit caching is `client.caches.create(config={system_instruction,
  contents, ttl, display_name})` referenced per request by **`cached_content`** — and the docs confirm
  `cached_content` *is* honoured inside a batch. **But** the published minimum cacheable prefix is 4,096
  tokens (Gemini 3.5 Flash, 3.1 Pro Preview) / 2,048 (Gemini 2.5), and our judge system prompt is
  ~600 tokens — an order of magnitude below any of them. **Decision: declare no cache. Do not build
  Anthropic's `cache_control` equivalent.** At `$0.25`/MTok input the whole input side of the job costs
  cents (§11.6), so there is nothing to optimise.
  > ⚠️ VERIFY AT IMPLEMENTATION: no minimum-cacheable-token row is published for any Flash-Lite model.
  > If the judge prompt ever grows past ~4k tokens (e.g. the §11.5 enriched variant), re-check the
  > threshold table before assuming caching is unavailable —
  > https://ai.google.dev/gemini-api/docs/generate-content/caching
- **Finish reasons replace `stop_reason`. There is no `refusal`.** `candidates[].finishReason` values:
  `FINISH_REASON_UNSPECIFIED`, `STOP`, `MAX_TOKENS`, `SAFETY`, `RECITATION`, `LANGUAGE`, `OTHER`,
  `BLOCKLIST`, `PROHIBITED_CONTENT`, `SPII`, `MALFORMED_FUNCTION_CALL`, `IMAGE_SAFETY`,
  `UNEXPECTED_TOOL_CALL`, `TOO_MANY_TOOL_CALLS`. Only `STOP` is a usable verdict. A **response**-side
  safety block returns the candidate with `finishReason: SAFETY` and no content; a **prompt**-side block
  sets `promptFeedback.blockReason` (`SAFETY` / `OTHER` / `BLOCKLIST` / `PROHIBITED_CONTENT` /
  `IMAGE_SAFETY`) and returns **no candidate at all** — so `candidates[0]` must never be indexed blind.
  Safety thresholds are configurable per request via `safetySettings` (`category` × `threshold`, where
  `threshold` includes `OFF` and `BLOCK_ONLY_HIGH`); leave them at default until a block is actually
  observed, then raise it as a §12 item rather than silently loosening the filter.
- **Token counting**: `client.models.count_tokens(model=…, contents=…).total_tokens`. Per-response usage:
  `usageMetadata.promptTokenCount` / `candidatesTokenCount` / `thoughtsTokenCount` /
  `cachedContentTokenCount` / `totalTokenCount`.
- **No batch-rejected-parameter caveat.** Anthropic's "no `fallbacks` on the Batches API" has no Gemini
  analogue: the docs state per-request config — system instruction, response schema/MIME type, thinking,
  `max_output_tokens`, `cached_content`, tools — is honoured inside a batch.

**Sources relied on** (all fetched 2026-07-29):

- https://ai.google.dev/gemini-api/docs/batch-api — job create/poll/read, `key`, JOB_STATE_*, 50%, 48 h, 20 MB / 2 GB
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite — Stable, token limits, capability matrix
- https://ai.google.dev/gemini-api/docs/pricing — `$0.25` / `$1.50` / `$0.025`, batch −50%
- https://ai.google.dev/gemini-api/docs/generate-content/thinking — `thinking_config.thinking_level`, Flash-Lite default `minimal`, cannot disable
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output — supported JSON Schema subset, `response_format` shape
- https://ai.google.dev/gemini-api/docs/generate-content/caching — implicit vs. explicit, minimum-token table, `client.caches.create`, `cached_content`
- https://ai.google.dev/gemini-api/docs/safety-settings — `finishReason: SAFETY`, `promptFeedback.blockReason`, `safetySettings`
- https://ai.google.dev/api/generate-content — full `FinishReason` / `BlockReason` enums, `usageMetadata` fields
- https://ai.google.dev/gemini-api/docs/tokens — `client.models.count_tokens`, `total_tokens`, `usage.*`
- https://ai.google.dev/gemini-api/docs/quickstart — `google-genai`, `from google import genai`, `GEMINI_API_KEY`
- https://ai.google.dev/gemini-api/docs/models — model list and Stable/Preview status

### 11.2.1 Operating a lite-tier judge

The mission text is **"LLM חכם"** and this is Google's cheapest tier. The gap is real and the plan does
not pretend otherwise — it is managed by four mechanisms, in this order.

**(a) Task 6.2.3 is the gate, and it is the only thing that decides usability.** `raw_agreement ≥ 0.85`
**and** `cohens_kappa ≥ 0.60` against the human sample. Report both always — with a skewed verdict
distribution a lite model can score high raw agreement purely by predicting the majority class while κ
sits near zero, and that is precisely the failure this model tier is most prone to. **Per rule 7 a gate
failure can only be answered with a prompt change or a model change.** No code may pre-filter, keyword-
match, hint, or post-correct the judge's verdicts to lift the number.

**(b) `JUDGEMENT_CHUNK_SIZE` is now a reliability lever, not only a cost one.** A weaker model drifts
further into the list, omits items, and mis-echoes ids more as the chunk grows — the exact three failures
Step 4.2.3.2's completeness assertion catches. So when that assertion fires, **shrinking the chunk is a
legitimate first fix**, not a workaround: it is a request-shaping parameter, not code that does part of
the judging. Cost is indifferent to it (§11.6), so tune it purely on clean-completion rate. Start at 40
and halve on repeated id gaps.

**(c) §11.5's name-only vs. enriched decision matters more here.** A lite model carries less world
knowledge, so it is less able to resolve an opaque Hebrew acronym from the service *name* alone — the
information §11.5 says is optional for a strong judge is closer to mandatory for this one. **Step
4.3.2.3's 10% `unclear` ceiling is the tripwire.** If it trips, enrich with the indexed service
description rather than tuning the prompt around missing information — adding the description is
supplying data, not helping the model reason, so it does not violate rule 7. At `$0.25`/MTok the 5–8×
input increase §11.5 warned about is a rounding error (§11.6).

**(d) Escalation, if the gate still fails.** Do **not** tune indefinitely. After one prompt revision
cycle (Task 4.3.2) fails to clear Task 6.2.3, **re-judge with a stronger model** rather than iterating:
`gemini-3.1-pro-preview`, or the model this spec originally specced, `claude-opus-5`. The judgement cache
already keys on `model` (§11.3), so a model change **invalidates the cache automatically** — escalation
is a re-run of Task 4.3.3 and a re-sample of Phase 6.1, not a rewrite of anything. §11.6 prices the
escalation row so the decision can be made on evidence rather than on budget anxiety.

> ⚠️ VERIFY AT IMPLEMENTATION: `gemini-3-pro` is **not** a currently-listed model id. As of 2026-07-21 the
> Pro tier is `gemini-3.1-pro-preview` (**Preview**, not Stable) and the strongest listed **Stable**
> Gemini is `gemini-3.5-flash`. Re-read the model list at escalation time and pick the strongest Stable
> id then available — https://ai.google.dev/gemini-api/docs/models

### 11.3 The judgement cache (M4)

A verdict is a pure function of `(query, service_name, model, prompt)`. It does **not** depend on
retrieval configuration, so it caches — exactly as the scraped ground truth already does.

```json
{
  "model": "gemini-3.1-flash-lite",
  "prompt_checksum": "sha256:...",
  "schema_version": 1,
  "judgements": { "<query> <service_name>": { "verdict": "relevant", "reason": "..." } }
}
```

**Switching judge model must invalidate the cache — and it already does.** `model` is one of the three
invalidation keys (Step 4.1.5.1), so the §11.2.1(d) escalation to a stronger model is a clean re-run: the
lite-tier verdicts are discarded rather than blended with the stronger model's. A cache holding two
models' verdicts under one file would make the M6 agreement number meaningless, which is why `model` is
stored rather than assumed. Separately, **bump `JUDGEMENT_SCHEMA_VERSION` whenever the verdict schema
*shape* changes** — a new field, a renamed key, a changed verdict vocabulary. `prompt_checksum` catches
prompt edits and `model` catches model swaps, but neither notices that `reason` became a list.

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
does not violate rule 7. It raises input tokens ~5–8×, which at the chosen model's `$0.25`/MTok is under
a dollar per run rather than the ~$40–60 this line said when the judge was Opus 5 — see §11.6.
**Recommendation:** ship name-only, measure, enrich only if `unclear` > 10%. **§11.2.1(c): the bar for
enriching is lower with a lite-tier judge** — it has less world knowledge to resolve an opaque acronym
from the name alone, so treat Step 4.3.2.3 tripping as the expected outcome, not the surprising one.

### 11.6 Cost estimate (M4)

Assumptions unchanged from the original estimate: Hebrew service name ≈ 20 tokens (measured mean 31.5
chars); system prompt ≈ 600 tokens amortised across a chunk; verdict + reason ≈ 25 output tokens;
thinking roughly doubles output. That is **~40 input and ~51 output tokens per pair** — the per-pair rate
implied by the original 17,529 → ~0.7 M in / ~0.9 M out figures, reused here so the two arms are
comparable. **Re-baseline with `count_tokens` (Task 4.3.1) before trusting any of it** — Hebrew
tokenisation is the single largest source of error in the table, and Gemini's tokenizer is not
Anthropic's.

**Both volumes, because the arm is not yet chosen — see §14.3.** The current arm is **2,145 pairs**, the
baseline arm **17,529**; §14.3 explains why they differ and Step 4.3.3.4 must record which was frozen.
§14.3's "~$1.5–2" was derived from the old Opus 5 pricing and is superseded by the table below; its
**pair counts** remain correct and are what this table is built on.

| Model | Arm | Pairs | Input | Output | List price | Batch (−50%) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| **`gemini-3.1-flash-lite`** (`$0.25`/`$1.50` per MTok) — **chosen** | current | 2,145 | ~0.09 M | ~0.11 M | ~**$0.19** | ~**$0.09** |
| **`gemini-3.1-flash-lite`** — **chosen** | baseline | 17,529 | ~0.70 M | ~0.90 M | ~**$1.53** | ~**$0.76** |
| `gemini-3.1-pro-preview` (`$2.00`/`$12.00`, ≤200k prompts) — §11.2.1(d) escalation | current | 2,145 | ~0.09 M | ~0.11 M | ~**$1.48** | ~**$0.74** |
| `gemini-3.1-pro-preview` — §11.2.1(d) escalation | baseline | 17,529 | ~0.70 M | ~0.90 M | ~**$12.20** | ~**$6.10** |

**Cost is not a constraint, and at this tier it has stopped being a consideration at all.** Judge
everything; never sample for cost reasons. Three consequences worth stating outright:

- **`JUDGEMENT_CHUNK_SIZE` is cost-neutral**, so tune it purely on reliability — §11.2.1(b).
- **The §11.5 enriched variant is affordable outright.** A 5–8× input increase on the baseline arm is
  ~$0.6–1.1 list, ~$0.3–0.6 batched. The old "~$40–60 per run, still affordable" caveat no longer binds;
  if Step 4.3.2.3 trips, enrich.
- **Escalating to Pro costs single-digit dollars.** A gate failure is never a budget decision.

Thinking tokens are **billed as output** at the output rate (§11.2), so they are already inside the
~51 output tokens/pair assumption. `minimal` is the Flash-Lite default and cannot be turned off.

### 11.7 Statistic definitions (M5)

| Statistic | Definition | Reads as |
| --- | --- | --- |
| `missed_truly_irrelevant_rate` | of `missed_ground_truth`, share judged `irrelevant` | "% of what we didn't retrieve that genuinely didn't matter" — golden-set noise |
| `unexpected_actually_relevant_rate` | of `unexpected_retrieved`, share judged `relevant` | "% of what we returned but the site doesn't show that is actually good" — golden-set narrowness |

> **⚠️ DECIDED 2026-07-29 — `unexpected_actually_relevant_rate` must be reported TWICE, with counts.**
> Once **including** the empty-golden-set rows and once **excluding** them, each labelled with its
> denominator. Not one or the other.
>
> **Why:** the "reads as" gloss above — *"what we returned but the site doesn't show"* — is **false for 5% of
> the denominator.** §14.4 measures **107 of the 1,180 unexpected-side rows (9.1% of that side, 5.0% of the
> 2,148-pair job)** as belonging to four queries whose `ground_truth_size` is **0**:
> `תור לבדיקת שמיעה` (39 rows), `קבוצת תמיכה לאחים של ילדים עם צרכים מיוחדים` (32),
> `אני מוכרת בביטוח לאומי עם 40% נכות פסיכיאטרית…` (19), `אמא שלי מרותקת לכסא גלגלים…` (17). For those the
> site shows **nothing at all**, so "the site doesn't show it" carries no information — the service is
> "unexpected" trivially, by absence of a golden set rather than by disagreement with one. Folding them into
> a single rate silently mixes "we disagree with the incumbent" and "there is no incumbent to disagree with",
> which are different claims.
>
> **The judging decision is separate and is: judge them.** §14.4 records it. They are cheap, and they are the
> one slice where the golden set provably tells us nothing, so the judge's verdict is the *only* relevance
> signal available for them. What must not happen is quoting the combined rate as a comparison against the
> incumbent.
>
> **Concretely, M5 emits both** — suggested keys, to be fixed in `vars.py` at Task 5.1.1:
> `unexpected_actually_relevant_rate` (all 1,180 rows), `unexpected_actually_relevant_rate_excluding_empty_gt`
> (1,073 rows), plus the two denominators and `empty_ground_truth_row_count` (107) so a reader can reconstruct
> either. **Any figure framed as "vs the incumbent" uses the excluding-variant.** The 107 rows contribute 0
> missed-side rows by construction, so `missed_truly_irrelevant_rate` needs no such split.

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
| **Batch results keyed by position** | Silent mis-assignment of verdicts to services — worst case, because output still looks valid. **Sharper on Gemini than on Anthropic:** inline `src=[…]` requests carry *no* key field and are correlated by position, so the wrong shape is the easy one to write. | Step 4.1.4.1: JSONL / File API path only, never inline. Step 4.1.4.2: join by `key`, distinct keys in the smoke test, never index by position. Step 4.2.3.2: assert completeness. |
| **Judge fails the M6 gate outright** | The chosen judge is Google's cheapest tier with intelligence index 25 and no published multilingual benchmark, so a Hebrew-relevance miss is a live possibility. If `raw_agreement < 0.85` or `κ < 0.60`, every M5 adjusted metric is unusable and M7 cannot proceed. | Task 6.2.3 is a hard gate — that is what it is for. Per rule 7 the only permitted responses are a prompt revision (Task 4.3.2) or a model change; **one** revision cycle, then escalate per §11.2.1(d) to `gemini-3.1-pro-preview` / `claude-opus-5`. The cache invalidates on `model` (§11.3), so escalation is a re-run priced in §11.6, not a rewrite. |
| **High `unclear` rate from name-only Hebrew acronyms** | A lite-tier model has less world knowledge to resolve an opaque Kolsherut acronym from the name alone, so it over-produces `unclear` and every M5 rate is computed over a shrunken denominator. | Step 4.3.2.3's 10% ceiling is the tripwire; §11.2.1(c) says resolve it by enriching with the indexed service description (data, not reasoning help — rule 7 intact) rather than tuning the prompt around missing information. §11.6 shows the enriched variant is affordable. Never fold `unclear` into `irrelevant`. |
| **Id echo / omission drift on long chunks** | A weaker model omits items, invents ids, or mis-echoes them further into a 40-item list. Partial verdict sets read as complete coverage in M5. | Step 4.2.3.2 asserts every `key` returned and exactly one verdict per item id, and raises on any gap. Fix by **halving `JUDGEMENT_CHUNK_SIZE`** — §11.2.1(b) makes chunk size an explicit reliability lever, and §11.6 shows it is cost-neutral. |
| **Safety filter silently produces no verdict for a chunk** | A prompt-side block returns `promptFeedback.blockReason` and **no `candidates` at all**; a response-side block returns `finishReason: SAFETY` with no content. Blind `candidates[0]` access crashes, and a swallowed exception drops 40 pairs invisibly. Hebrew social-services text (abuse, addiction, mental health) is exactly the content most likely to trip a filter. | Step 4.2.3.3 branches on `finishReason` with only `STOP` yielding a verdict; Step 4.2.3.4 handles the no-candidate and per-line `error` cases and logs the blocked chunk's `key` so the pairs are identifiable. Step 4.2.3.2 then fails the run rather than reporting partial coverage. Do not loosen `safetySettings` reflexively — raise an observed block as a decision. |
| **Scores joined to the wrong document** | A name spanning several service_ids gets an arbitrary card hit's scores instead of the best-ranked document's. Silent — the CSV looks complete and every threshold decision downstream is made on wrong numbers. | 🟡 **Mitigated, live check owed.** Attached at `order_services_by_ranking` (Step 2.1.1.2 ✅) and reproduced offline on a synthetic two-service_id name. Step 2.1.1.5 still owed — §14.2.2. |
| **`null` scores written as `0.0`** | "BM25 never surfaced it" becomes "BM25 scored it zero" — changes what the band table means and how the semantic floor reads. | ✅ **Closed for M2/M3.** `dict.get` with no default in every reader, one flattener (`serialize_service_scores`), no `or 0.0` / `float()` / rounding anywhere in the chain. Still applies to Step 4.2.5.2. |
| **Score columns shown to the human reviewer** | The human anchors on cosine instead of judging relevance; the agreement number stops measuring what it claims to. | Step 6.1.1.4: withhold scores (and verdicts) from the review sheet. |
| **API key handling** | Secret in the repo. | Step 4.1.3.2/3: `GEMINI_API_KEY` in `.env` only, `.env.example` names never values. `genai.Client()` reads it from the environment — never pass a literal. |

---

## 13. Convention checklist for every new file

- One purpose per file; utils may multi-export only within one scope.
- ≤100 lines per file, ≤30 lines per function (target ~20).
- Pure functions; `try/except` only in `run_evaluation.py` and `clients/llm_client.py`.
- All imports at the top; `import` only, never `require`.
- No hardcoded text: literals live in `vars.py` / `strings.py` / `relevance_vars.py` /
  `relevance_strings.py` only. **This covers the provider constants too**: the model id
  (`gemini-3.1-flash-lite`), `JUDGE_THINKING_LEVEL`, `JUDGE_MAX_TOKENS`, `JUDGEMENT_CHUNK_SIZE` and the
  verdict vocabulary belong in `relevance_vars.py`; the `JOB_STATE_*` / `finishReason` strings the client
  branches on and the batch `key` prefix belong there too, not inline in `clients/llm_client.py`.
  `GEMINI_API_KEY` is read from the environment by `genai.Client()` and is never written in a file.
- Long, informative names matching the existing style (`find_unexpected_retrieved_names`, not `findUnexp`).
- Functional first — no classes unless a framework demands one.
- **Rule 7**: no code that pre-processes, hints, regex-matches, or keyword-maps for the judge.
- **Rule 8**: system prompt instructs only; examples show structure and types, never real values.

**Two standing exceptions found while executing M1–M3, for decision:**

- `evaluation/vars.py` is now **131 lines**, over the 100-line rule (118 before this work). Left as one
  file, consistent with the project's existing treatment of vars files. Flagged, not decided.
- `evaluation/report/serialize_summary.py` has **ten pre-existing inline key literals** (`'query'`,
  `'ground_truth_size'`, …). The new key uses a `vars` constant, so the file is now mixed. Not retrofitted
  — out of scope for M2 and it would churn the diff. Decide before applying this checklist literally.

---

## 14. Execution log

### 14.1 What shipped (2026-07-29, branch `fix-embedding-text-and-reindex`, **uncommitted**)

Missions 1, 2 and 3 are implemented. Missions 4–7 are untouched.

| Mission | Result |
| --- | --- |
| M1 | Verify-only, as predicted. Confirmed on all four surfaces; `count_hits`' docstring explicitly rejects the per-k slice. One README alias added. Value correction in Step 1.1.1.3. |
| M2 | Phase 2.1 (retrieval + evaluation score plumbing) and Phase 2.2 (the file) complete. `overall_score` regression passed offline. Live run done 2026-07-29 — structure passed but scores were `null` (stale retrieval process). **Closed 2026-07-29 attempt 2**: retrieval restarted, re-run emits real scores, all four owed checks now pass (§14.2). |
| M3 | One task, as predicted. Nulls guaranteed by construction; `(query, side, rank)` join to `service_diff.csv` is 100% on both arms. |

**Four files this spec's §2 tree did not anticipate**, all created to hold a convention limit rather than
to add scope: `retrieval/.../attach_document_scores_to_service.py` (Step 2.1.1.4's allowed split),
`evaluation/clients/parse_retrieval_response.py` (parsing split off the HTTP call so it can be pure),
`evaluation/report/serialize_service_scores.py` (the single five-key flattener, reused by both sides and
by M4), and `evaluation/report/build_diff_service_entries.py` (forced by Step 3.1.1.1's line count).

`evaluation/clients/retrieval_client.py`'s entrypoint was renamed to
`fetch_retrieval_ranked_names_and_scores` — single call site, updated.

**Sizing note for M4:** `service_scores` adds ~282 entries × 5 floats × 65 queries to `summary.json`, so
expect it to roughly triple from 285 KB. Unavoidable — Phase 2.2 builds the diff files from `summary.json`.
Verified inert for every existing consumer (`dashboard.html:185-198`, `build_per_query_rows.py`,
`build_service_diff_rows.py` all read named fields; none iterate per-query keys).

### 14.2 The live verification gate — ✅ CLOSED (2026-07-29, attempt 2)

Nothing below could be run without the retrieval service and Elasticsearch. ~~**All three are owed before
Phase 4.1**~~ — **all three are now closed.** The attempt history below is kept in full, oldest first,
because attempt 1's failure mode (a stale process indistinguishable from a code defect) is the thing a
future reader is most likely to hit again.

> **✅ Live attempt 2 — 2026-07-29 17:07–17:20. THE GATE IS CLOSED.** The single blocking cause identified
> in attempt 1 was environmental and it was removed by restarting the process. Sequence, for reproducibility:
>
> 1. **Pre-restart gate (`docs/embedding-v4-gemini-spec.md` Task 1.4 Step 2), run FIRST and deliberately
>    before any restart.** `retrieval/`'s working tree was mid-migration to the V4 pluggable embedder, so a
>    restart would also pick that up — which would have moved every vector and silently changed the arm the
>    labels describe. Proven a **no-op** instead; numbers in §14.4. This is why the restart was safe.
> 2. **Restart.** `Stop-Process -Id <pids> -Force` on the stale pair, then relaunched detached from
>    `C:\dev\Kolsherut-Application\retrieval` with its own venv, **no `--reload`**, exactly the command line
>    the stale process had been using (`-m uvicorn app.main:app --host 127.0.0.1 --port 8200`). Stopped
>    **17:07:22**, started **17:07:25**, `/health` `{"status":"ok"}` at **17:07:55**.
> 3. **Restart verified before anything else, by the same probe that diagnosed attempt 1.** Live
>    `GET /openapi.json` now reports `components.schemas.Service` with **14** properties, including all five
>    of `retrieval_score`, `semantic_score`, `lexical_score`, `cosine_score`, `cosine_score_ratio` — up from
>    the **9** attempt 1 measured. Startup log clean: the `warm_models` dimension probe ran and reported
>    **1024 probed = 1024 stored**, and the only warning is the expected, self-describing one that the V3
>    index predates V4's `_meta.embedding_provider` stamp so it cannot be provider-checked (it continues on
>    the dimension match). No exception.
> 4. **Re-ran `python -m evaluation.run_evaluation`** from the repo root, **no `--rescrape`** — the
>    ground-truth cache hit on all 65 queries. Exit **0**, all thresholds passed, 17:08:35–17:10:59.
>
> **Result: the scores are real.** Per-field counts in Step 2.2.4.2, join in Step 3.1.1.4, the multi-`service_id`
> assertions in Step 2.1.1.5, the badge spot-check in Step 2.2.4.3. Headline: **2,148 pairs**
> (1,180 unexpected + 968 missed); four of the five fields **1,180/1,180** populated; `lexical_score`
> 272/1,180, which is correct for `LEXICAL_WEIGHT=0`; missed side **968/968 all-null**; **zero** exact
> `0.0` in 10,740 cells; join to `service_diff.csv` **2,148/2,148**.
>
> **Attempt 1's diagnosis is fully vindicated:** nothing in `evaluation/` or `retrieval/` was changed
> between the two attempts, and the only difference was the process generation. There was never an
> evaluation-side defect.
>
> **Two things attempt 2 discovered that attempt 1 could not**, both recorded in §14.4 rather than here
> because they are properties of the arm, not of the check: the arm is **not bit-reproducible run to run**
> (§14.4.3), and attempt 1's numbers were produced by a process whose `.env` was **older than the `.env` on
> disk** (§14.4.4) — so the 2,142/0.3157 pair is not attributable to the config §14.4 documents.

> **Live attempt 1 — 2026-07-29 16:01–16:04 (superseded; kept for the failure mode).** The run executed against a live
> retrieval service and Elasticsearch and produced both diff files. **The five-scores assertion still
> failed, for an environmental reason, not a code one:** the `uvicorn app.main:app` process serving
> `:8200` was started at **11:43:40**, and Phase 2.1's retrieval-side files were written at **12:07**. It
> carries no `--reload`, so it was serving pre-Phase-2.1 code. Proof, not inference: the live
> `GET /openapi.json` reports `components.schemas.Service` with **9** properties; the schema on disk has
> **14**. Every `services[i]` in the raw response therefore omits all five score keys entirely, and the
> evaluation client's `dict.get` correctly returned `None` for each — so the nulls are the honest value
> given what retrieval sent, and no evaluation-side defect is implicated.
>
> **To close Steps 14.2.1–14.2.3 the retrieval process must be restarted so it imports the Phase 2.1
> code.** That was deliberately not done in this session. Note before restarting: `retrieval/`'s working
> tree is being changed concurrently (the `text_embedding` provider split, `requirements.txt`), so a
> restart also picks those up — confirm what is on disk first, or the judged arm changes underneath the
> labels.
> **Done in attempt 2, and the caution was the right one** — the V4 provider seam was proven a no-op
> *before* the restart, which is what made the restart safe rather than arm-changing. §14.4.

- **Step 14.2.1 — the blocking one (Step 2.2.4.1).** Start retrieval + Elasticsearch, run
  `python -m evaluation.run_evaluation`. This is the first run that produces
  `results/unexpected_retrieved.json` and `results/missed_ground_truth.json` with the score fields
  populated. Then complete the Step 2.2.4.2 assertion: **every** entry on the unexpected side carries all
  five scores, and every entry on the missed side carries five nulls.
  🟡 **ATTEMPT 1 — RUN DONE, ASSERTION FAILED (2026-07-29 16:01).** `python -m evaluation.run_evaluation` (no
  `--rescrape`; the ground-truth cache hit on all 65 queries) exited **0**, all thresholds passed, and
  wrote both diff files for the first time. Every structural assertion passed — numbers in Step 2.2.4.2.
  The score assertion is **0/1,176 populated**, cause above. The missed side's all-null assertion passed
  **966/966**, but vacuously: it would pass either way while retrieval sends nothing.
  ✅ **ATTEMPT 2 — CLOSED (2026-07-29 17:08).** Same command, same no-`--rescrape` cache hit on all 65
  queries, exit **0**, all thresholds passed. Unexpected side **1,180/1,180 populated** on
  `retrieval_score`, `cosine_score`, `cosine_score_ratio` and `semantic_score`; `lexical_score` 272/1,180
  (correct for `LEXICAL_WEIGHT=0`). Missed side **968/968 all-null** — and no longer vacuous, because the
  unexpected side of the same `summary.json` is fully scored. Full numbers in Steps 2.2.4.2 and 3.1.1.4.
- **Step 14.2.2 — the multi-`service_id` join (Step 2.1.1.5).** Read the raw `POST /api/retrieve` body,
  **not** the UI — the mock FE renders no service-level score badges (`ServiceResult` ignores the new
  fields), so use the DevTools Network tab or curl. Find the case programmatically: group `documents[]` by
  the `service_name` its `service_id` maps to, keep groups of size ≥2 whose earliest document's
  `service_id` differs from the matching `services[i].id`. Then assert **(a)** for a single-id name, all
  five `services[i]` values equal that one document's exactly, with a blank badge arriving as `null` and
  never `0`; and **(b)** for a multi-id name, `services[i].retrieval_score` equals the fused `score` of the
  **earliest** document with that name and **differs** from the score of the document whose
  `service_id == services[i].id`. If those two are equal the case is not discriminating — find another.
  Confirming they differ *and* that the attached value is the better-ranked one is the whole point.
  🟡 **ATTEMPT 1 — PROVEN ON LIVE DATA, NOT ON THE LIVE RESPONSE (2026-07-29).** The stale process cannot emit the
  fields, so the raw `services[]` could not be read. Instead the **on-disk** `order_services_by_ranking`
  was driven with the **live** `documents[]` from `POST /api/retrieve` and the **live**
  `service_id → service_name` map read straight out of `srm__cards` — real fused order, real name
  collapse, real multi-id names. Two queries, 7 names examined, 4 single-id, 3 multi-id, **2
  discriminating**. Evidence in Step 2.1.1.5. Re-run against the raw response after the restart; the
  arithmetic will not change, but the step asks for the response and this is not it.
  ✅ **ATTEMPT 2 — CLOSED ON THE RAW RESPONSE (2026-07-29 17:13).** Re-run exactly as this recipe
  prescribes, off the `POST /api/retrieve` body. Two queries, 7 names, **3 single-id, 4 multi-id, 3
  discriminating**; all 7 matched the earliest document on all five fields by value **and** type. The
  known case `מועדונית לילדים` came out at precisely the predicted numbers — `services[0].retrieval_score`
  **0.01639344262295082** (earliest `meser-s-206442`, fused position 0) vs the card-order id
  `meser-s-219127`'s **0.01098901098901099** (fused position 30) — so **the prediction above was correct to
  the digit and the arithmetic indeed did not change.** Single-id case matched with `lexical_score` arriving
  as `NoneType`, never `0.0`. Full evidence in Step 2.1.1.5.
- **Step 14.2.3 — FE badge spot-check (Step 2.2.4.3).** Suggested query
  `ילדים בסיכון פעילות אחר הצהריים` (`data/golden-set-ground-truth.json`, `entries[0]`) — 3 returned, 19
  ground truth, exactly **one** unexpected service at rank 1, so one badge row to compare. Backup:
  `מועדון יום לאזרחים ותיקים כולל הסעות באזור השרון` → `מרכז יום לאזרחים ותיקים`. Compare in badge order
  (fused → cosine → ratio → bm25 → semantic). The JSON is unrounded and the FE displays 4 dp (ratio 3), so
  match on the FE's **displayed** digits — `0.01643…` vs a displayed `0.0164` is a pass. **The one thing
  worth failing over: a badge the FE leaves blank must be `null`, never `0.0`.**
  ⏳ **ATTEMPT 1 — NOT CLOSED (2026-07-29).** The suggested query's shape reproduced exactly — `entries[0]`
  `ילדים בסיכון פעילות אחר הצהריים`: `ground_truth_size` 19, `returned_count` 3, `count` 1, one
  unexpected service at rank 1 (`תכנית אחר הצהרים לילדי בית הספר`). But its five values in
  `unexpected_retrieved.json` are all `null`, so there is nothing to compare. **The null-not-zero rule
  holds everywhere measured** — across both files, 2,142 rows × 5 fields, exact-zero count is **0**; the
  writer emits `null`, never `0.0`. That is the assertion worth failing over and it did not fail, but it
  was tested against an all-null file, so it is weak evidence. What the row *should* read once retrieval
  is restarted, computed from the live `documents[]` through the real
  `parse_retrieval_response` → `serialize_service_scores` chain: `retrieval_score`
  `0.010638297872340425`, `cosine_score` `0.8633895`, `cosine_score_ratio` `0.9885905371704945`,
  `lexical_score` **`null`**, `semantic_score` `0.93169475` — matching that document's raw
  `documents[]` values exactly, field for field. Use it as the expected value on the re-run.
  ✅ **ATTEMPT 2 — CLOSED (2026-07-29), and every one of the five predicted values above is exactly what
  the re-run produced.** Compared against the **raw response** rather than the FE, because the mock FE
  renders no service-level badges at all — which makes it the stricter target, since the raw response is
  unrounded and no displayed-precision allowance is needed. 3 queries, **45 cells, 0 mismatches**, value and
  type. The null-not-zero rule now rests on real evidence rather than an all-null file: on rows whose other
  four fields carry numbers, `lexical_score` still arrives as `NoneType`. Full table in Step 2.2.4.3.
  **Note for whoever wants the FE check literally:** it is still not possible and is not blocking. If the
  badges are wanted, `ServiceResult` has to render the five new fields first.

Also outstanding, not a verification step: **the work is uncommitted.** Per §3.2 Phase 2.1 touches
`retrieval/` and should land as its own PR, reviewed by whoever owns retrieval, ahead of the evaluation
commits.

### 14.3 Arm correction — read before quoting any number in §0, §11.4 or §11.6

Every headline figure in this spec was measured from `evaluation/results-arm0-baseline/`. Verified
2026-07-29 by rebuilding both payloads offline from each arm's `summary.json`:

| | `results/` (current) | `results-arm0-baseline/` (this spec's source) |
| --- | ---: | ---: |
| `recall_at_returned` | 0.3266 | **0.6981** |
| `overall_score` | 0.3157 | 0.3249 |
| `avg_returned_count` | 22.06 | 278.63 |
| `unexpected_retrieved` rows | 1,179 | **16,953** |
| `missed_ground_truth` rows | 966 | **576** |
| **total pairs to judge** | **2,145** | **17,529** |

Query entries (65), evaluated (63) and skipped (2) are identical in both.

**Consequences for M4 onwards:**

1. **The judging job may be ~8× smaller than planned.** At the current arm it is 2,145 pairs, not 17,529
   — so §11.6's ~$13 becomes roughly $1.5–2, and §11.4's row-count table describes the baseline arm only.
   §11.4's "hard floor of 1,177 rows" (total ground-truth size) is unaffected and now dominates: 966 of
   the current arm's 2,145 pairs are already missed-side rows.
2. **Decide which arm to freeze before Phase 4.1.** The choice is not cosmetic. §11.4's argument for
   judging wide still holds — the baseline arm's tail is exactly the evidence needed to test whether the
   golden set is narrower than relevance, and judging the current truncated arm samples the head where
   retrieval is presumably already fine. But the current arm is the one that reflects the embedding fix.
   Whichever is chosen, §3.2's freeze applies from that point and Step 4.3.3.4 must record it.
3. **`recall_at_returned` must never be quoted without its arm.** 0.698 is bought with precision
   (`avg_returned_count` 278.63); the same retriever truncated reads 0.3266.
4. **`evaluation/.gitignore` ignores `results*/`**, so no `summary.json` is committed and every arm
   directory is local-only. Steps that say "the committed `results/summary.json`" rest on a false premise.

### 14.4 The judged arm

**Decided 2026-07-29: Mission 4 judges the narrow arm below.** §14.3's item 2 asked which arm to freeze;
this is the answer. ~~Everything here is measured from the live run of 2026-07-29 16:01–16:04.~~
**Superseded 2026-07-29 17:08 (attempt 2):** the numbers below are now measured from the post-restart run,
which is the first run in which the process actually had this `.env` loaded *and* emitted the score fields.
The 16:01–16:04 figures are kept alongside for comparison but must not be quoted as this arm's — see
§14.4.4.

**This decision stands and is deliberate.** The narrow arm is the frozen judging arm by choice, not by
drift-by-accident: it is the arm that reflects the embedding fix, and it is what `retrieval/.env` holds. The
price is written out in full in §14.4.2 — §11.4's warning that shrinking retrieval before judging
**"inverts the dependency"** applies to us, and the consequence for Mission 7's offline sweep is already
recorded there. **Do not re-litigate the arm choice; read §14.4.2 and work within it.**

**The frozen judging config** — `retrieval/.env`, read off disk at run time:

```bash
RETRIEVAL_EMBEDDINGS_INDEX_NAME=srm__services_retrieval_embeddings_v3_enriched   # local V3 embedder
CANDIDATE_POOL_SIZE=50
LEXICAL_WEIGHT=0
SEMANTIC_WEIGHT=1.0
MIN_SEMANTIC_SCORE=0.3
MAX_RETURNED_SERVICES=400
MIN_FUSED_SCORE=0.01
SEMANTIC_SCORE_RATIO=0.0
KEEP_LEXICAL_ONLY_DOCUMENTS=false
```

**Measured pair count — this sizes the whole of Mission 4:**

| | **Attempt 2, 17:08 — AUTHORITATIVE** | Attempt 1, 16:01 (superseded, §14.4.4) |
| --- | ---: | ---: |
| Query entries per file | 65 (59 evaluated, 2 skipped unsupported, 6 skipped empty ground truth) | 65 (same split) |
| `unexpected_retrieved` rows | **1,180** | 1,176 |
| `missed_ground_truth` rows | **968** | 966 |
| **Total pairs to judge** | **2,148** | 2,142 |
| `overall_score` | **0.3025234053500492** | 0.3157333828247543 |
| `recall_at_returned` | **0.30839084256932864** | 0.3266 |
| `precision_at_returned` | **0.19435599554144598** | 0.1957 |
| `f1_at_returned` | **0.17213475095655903** | 0.1743 |
| `avg_returned_count` / `avg_ground_truth_size` | **22.0476** / 19.9492 | 22.0159 / 19.9492 |
| `median_returned_count` / `median_ground_truth_count` | **24 / 8** | — |

**The pair count moved: 2,142 → 2,148 (+6).** Both sides grew by a handful (+4 unexpected, +2 missed) and
`overall_score` fell 0.3157 → 0.3025. **Neither movement is caused by the restart's code changes** — the V4
provider seam was proven a no-op first (§14.4.5) and the query-embedding path is byte-identical. Two
distinct causes, and they are separated in §14.4.3 and §14.4.4. **Quote 2,148 / 0.3025 for this arm, and
treat both as ±small** rather than exact, for the reason in §14.4.3.

2,148, not §14.3's projected 2,145 nor attempt 1's 2,142 — those were rebuilt offline from older
`summary.json`s or measured under a stale process. **968 of the 2,148 (45%) are missed-side rows**, which
cannot be made smaller by any retrieval setting: §11.4's ground-truth floor now dominates the job.

**107 of the 1,180 unexpected-side rows (9.1% of that side, 5.0% of the job) have an empty golden set** —
the same 107 rows and the same four queries as attempt 1 measured, so this slice is stable. Six queries carry
`ground_truth_size: 0`; two of them are the skipped-unsupported pair and emit nothing, but the other four
(`תור לבדיקת שמיעה` 39 rows, `קבוצת תמיכה לאחים של ילדים עם צרכים מיוחדים` 32,
`אני מוכרת בביטוח לאומי עם 40% נכות פסיכיאטרית…` 19, `אמא שלי מרותקת לכסא גלגלים…` 17) are counted as
evaluated and contribute every service they returned. For these, "unexpected" is trivially true — there is
no golden set to be absent from — so the judge's verdicts on them are the *only* relevance signal
available, and they cannot be compared against the incumbent at all. ~~Decide in Phase 4.2 whether to judge
them~~ **DECIDED 2026-07-29: judge them.** The recommendation below was accepted — they are cheap and they
are the one slice where the golden set provably tells us nothing. The reporting rule that goes with the
decision is **not** "exclude them"; it is "report both ways with counts", and it is written where Mission 5
will actually read it: see the note under §11.7. They contribute 0 missed-side rows by construction.

Because `LEXICAL_WEIGHT=0`, expect `lexical_score` to be `null` on a substantial share of unexpected-side
rows. That is the honest value — `null` means BM25 never surfaced that document — and it is **not** a
failure of Step 2.2.4.2. Note the weight does not disable BM25: it still runs and still reports a score
(values of 12–17 were observed live), it simply contributes nothing to fusion.
**Measured on the attempt 2 run: `lexical_score` is populated on 272 of 1,180 unexpected-side rows (23.1%)
and `null` on 908.** So "a substantial share" was right, and usefully it is not *all* — the 272 real values
prove the field is plumbed end to end rather than stuck at `null`, which is what makes Step 2.2.4.2's pass
meaningful rather than trivially satisfied.

#### 14.4.1 `retrieval/.env` had already drifted from §0.1

§3.2's "`retrieval/.env` is frozen until Phase 7.1" rule was broken before this run, not by it. §0.1
documents the arm its numbers came from; the file on disk does not match it:

| Setting | §0.1 documents | On disk 2026-07-29 |
| --- | --- | --- |
| `CANDIDATE_POOL_SIZE` | 500 | **50** |
| `LEXICAL_WEIGHT` | 0.2 | **0** |
| `MIN_SEMANTIC_SCORE` | −1.0 (off) | **0.3** |
| `MAX_RETURNED_SERVICES` | 0 (off) | **400** |

`SEMANTIC_SCORE_RATIO=0.0` and `KEEP_LEXICAL_ONLY_DOCUMENTS=false` still match. The embeddings index also
moved to `..._v3_enriched`. Every §0, §11.4 and §11.6 figure describes the left column.

#### 14.4.2 Accepted limitation: the labels sample the head, not the tail

Judging this arm is a deliberate choice made in full knowledge of §11.4, which warns that shrinking
retrieval before judging **"inverts the dependency"**: if the golden set is narrower than relevance, a
narrow sweep "cuts genuinely-good results to raise a precision number that is measuring the wrong thing",
and the cut "destroys the tail evidence needed to detect that narrowness — a top-50 judging run samples
the head of the ranking, where retrieval is presumably already fine."

That is the position we are in. Record it as a **known, accepted limitation of the labelled dataset**: the
2,142 pairs sample the head of the ranking, so the labels cannot answer whether the golden set is
narrower than relevance in the tail. M5's adjusted metrics and M6's agreement number are valid *about this
arm* and must not be read as statements about the retriever's full candidate pool.

**Consequence for Mission 7.** §11.3's subset property runs one way only: `MAX_RETURNED_SERVICES` and
`SEMANTIC_SCORE_RATIO` filter the same fused list, so any *narrower* setting returns a strict subset of
what was judged and scores against cached labels for free. Widening does not — and changing
`CANDIDATE_POOL_SIZE` reorders fusion, so it is not a subset in either direction. Therefore **Task 7.1.1's
offline sweep can only explore operating points at or narrower than this arm.** Any wider point, and any
different pool size, needs incremental judging of the newly-surfaced pairs before it can be scored at all;
it cannot be swept for free and must not be compared against these labels as if it could.

#### 14.4.3 The arm is not bit-reproducible — pin the labels to the emitted files

**Measured 2026-07-29, and this is new information that attempt 1 could not have found.** Running
`python -m evaluation.run_evaluation` **twice against the same process, the same `.env` and the same
Elasticsearch** does not reproduce the same pair set:

| | Run A (17:08) | Run B (17:17) |
| --- | ---: | ---: |
| `unexpected_retrieved` rows | 1,180 | 1,178 |
| `missed_ground_truth` rows | 968 | 968 |
| **Total pairs** | **2,148** | **2,146** |
| `overall_score` | 0.3025234053500492 | 0.30303786541616984 |
| `recall_at_returned` / `precision_at_returned` | 0.3084 / 0.1944 | 0.3084 / 0.1944 (identical) |

Unexpected-side `(query, service_name)` sets: **1,169 shared, 11 only in A, 9 only in B — Jaccard 0.9832.**
Missed side: **968/968 identical, Jaccard 1.000**. Among the 1,169 shared pairs, **167 score cells differ**
— and the pattern identifies the cause: `cosine_score` is stable per document while `retrieval_score` (RRF,
a pure function of rank) and `cosine_score_ratio` (a fraction of the *pool's* best cosine) both move. So the
**candidate pool membership varies**, not the arithmetic.

Localised further, to rule out the obvious suspects. **It is not index churn:** `indices.stats` on both
`srm__services_retrieval_embeddings_v3_enriched` and `srm__cards` reports `index_total` 0, `delete_total` 0
and `merges.total` 0 — nothing was written or merged during the window. **It is not the embedder:** the
query-embedding path is byte-identical pre/post V4 (§14.4.5) and the fused score *tuples* are stable.
**It is the retrieval call itself.** Six byte-identical `POST /api/retrieve` calls for one query, same
process, produced **2 distinct `documents[]` id sets and 2 distinct `services[]` lists — 28 names on five
calls and 26 on one.** The most likely mechanism is Elasticsearch's **approximate** kNN (HNSW) over 19
segments with `CANDIDATE_POOL_SIZE=50`: near-ties at the pool boundary resolve differently between calls,
and a boundary document entering or leaving changes both the RRF ranks and the pool-best cosine.
*This is a hypothesis about the mechanism; the non-determinism itself is measured, not inferred.*

**Consequences — these are the actionable part:**

1. **Mission 4 must judge the emitted files, not "the arm".** Re-running to regenerate the inputs will
   quietly produce a slightly different pair set. **Task 4.3.3.4 must record a content hash of both
   `unexpected_retrieved.json` and `missed_ground_truth.json`**, not just the `.env` — the config does not
   identify the dataset.
2. **The judged files must be copied out of `evaluation/results/` before Phase 4.1.** `results*/` is
   gitignored (§14.3 item 4) *and* gets overwritten by any subsequent run, including runs of a different
   arm. This actually happened during attempt 2: a concurrent run overwrote `evaluation/results/` at
   **17:21:05** with a much wider arm (2,739 unexpected rows, `overall_score` 0.3853). The verified attempt
   2 artifacts survive only because they were archived outside the repo.
3. **Quote pair counts as approximate.** 2,148 ± ~2, `overall_score` 0.3025 ± ~0.0005 across reruns. Report
   the run, not just the arm.
4. **It further weakens §14.4.2's subset property.** §11.3 assumes a narrower setting yields a strict subset
   of what was judged. That holds for the *filters* applied to one fused list within a single response, but
   **not across calls**: re-issuing the same query can surface a document that was never judged. Task 7.1.1's
   offline sweep is therefore valid over the cached response set it already holds, and must not silently
   re-query.
5. **M6's agreement number is unaffected** — it samples the labelled rows, which are fixed once emitted.

#### 14.4.4 Attempt 1's numbers were produced under an older `.env` than the one §14.4 documents

**`retrieval/.env` was last modified 2026-07-29 16:00:50.** The process that served attempt 1's
16:01–16:04 run had started at **11:43:40** — and `app/vars.py` reads the environment **at import time**,
so that process was serving the pre-16:00:50 configuration regardless of what was on disk when the run
executed. §14.4's original line "the frozen judging config — `retrieval/.env`, read off disk at run time"
was therefore **not true of attempt 1**: the file was read off disk, but not by the process answering the
requests.

**So attempt 1's 2,142 pairs / `overall_score` 0.3157 are not attributable to the config tabulated in
§14.4.** That is the larger part of the 0.3157 → 0.3025 gap: §14.4.3's rerun noise is only ±0.0005, some
26× too small to explain 0.0132 on its own. The pre-16:00:50 contents cannot be recovered — `.env` is
gitignored, so there is no history — which is exactly why this is recorded rather than resolved.

**Attempt 2's run is the first one where the documented config was actually in force**, and it is the only
run whose numbers should be quoted for this arm. Operational rule this implies, worth keeping past Phase
7.1: **`retrieval/.env` and the serving process are one unit — editing `.env` without restarting silently
changes nothing, and restarting without checking `.env` silently changes everything.**

#### 14.4.5 The V4 embedder refactor was proven a no-op before the restart

`retrieval/` is mid-migration to the pluggable embedder of the separate `docs/embedding-v4-gemini-spec.md`
(its Mission 1). At restart time the working tree already had `text_embedding/embedding_model.py` deleted
and `resolve_embedding_provider.py`, `embed_text.py`, `probe_embedding_dimensions.py`,
`normalize_embedding_vector.py` and `providers/{local,gemini}/` in place. **A restart therefore imported the
V4 code**, and §14.2's own caution applies: if that refactor moved any vector, every retrieved set moved and
the labels about to be paid for would describe an arm that no longer exists.

**Gated before the restart, and it passed.** That spec's Task 1.4 Step 2 was run in-process against the
vectors already stored in the live V3 index — embed the passage text from the current on-disk code, compare
element-wise to the stored `embedding`:

| `service_id` | dims new / stored | max abs difference |
| --- | ---: | ---: |
| `soproc:yy-vts-vtypvl-bmshpkhvt-mmtsvt` | 1024 / 1024 | 1.71e-07 |
| `soproc:mrkzy-syv-lmshpkhvt-shkvlvt-qb-htbdvt-tvnvt-drkym-v-byrvt-hmth` | 1024 / 1024 | 1.47e-07 |
| `meser-s-220097` | 1024 / 1024 | 1.19e-07 |
| `meser-s-220498` | 1024 / 1024 | 1.70e-07 |
| `guidestar:a0y1p00000DsjckAAB` | 1024 / 1024 | 2.50e-07 |
| `guidestar:a0y0800000JGGETAA5` | 1024 / 1024 | 2.68e-07 |

**6 service_ids, spread across all three id namespaces in the index, 0 failures.** Worst case **2.68e-07**,
comfortably inside that spec's `< 1e-6` pass bar; the residual is float32 path noise from the
`embed_query` → `embed_documents([text])[0]` collapse, not a semantic change.
`resolve_embedding_provider().name == 'local'` was confirmed, and `EMBEDDING_PROVIDER` is unset in
`retrieval/.env`, so the default `local` is what serves — a restart could not have switched the arm to
Gemini. The startup probe agrees: `warm_models` reported **1024 probed = 1024 stored**.

The **query** path was checked separately and by inspection is **byte-identical**, which the passage check
does not cover: the deleted `embedding_model.embed_query_text` was
`get_embedding_model().embed_query(EMBEDDING_QUERY_PREFIX + text)` and the new
`providers/local.embed_local_query` is `load_local_embedding_model().embed_query(EMBEDDING_QUERY_PREFIX + text)`
— same model, same prefix constant, same method. Query vectors did not move at all.

**Therefore the judged arm is the documented local-E5 V3 arm, despite the V4 code being on disk.** The
restart changed which *code* is served but not which *vectors* are compared, and §14.4.3's rerun noise is
independent of it. Record the same conclusion in `docs/embedding-v4-gemini-spec.md`'s own §14 — it is that
spec's Task 1.4 Step 2, and it is satisfied. Note also that a `srm__services_retrieval_embeddings_v4_gemini`
index already exists and is populated (9,871 docs, same count as V3); it is **not** the index this arm reads.

### 14.5 The frozen snapshot — what Mission 4 actually judges (decided 2026-07-29, Phase 4.2)

**Decision: Mission 4 judges a frozen FILE SNAPSHOT, not "whatever is in `evaluation/results/`".** This
amends Step 4.2.1.1 and Step 4.3.3.4; §14.4.3 items 1 and 2 asked for it and this is the implementation.

**Why the config is not an identifier.** Three independent facts, all measured, all in §14.4:

1. `retrieval/.env` changed at least twice inside 11 minutes during the concurrent V4 embedder A/B work
   (§14.4.1, §14.4.4), and `app/vars.py` reads the environment at import time, so the file on disk and the
   process serving requests can disagree silently.
2. Three different arms landed in `evaluation/results/` in the same session; a concurrent run overwrote it
   at 17:21:05 with a much wider arm (2,739 unexpected rows, `overall_score` 0.3853) — §14.4.3 item 2.
3. **Six byte-identical `POST /api/retrieve` calls returned 2 distinct document sets** — Elasticsearch's
   approximate kNN resolving pool-boundary near-ties at `CANDIDATE_POOL_SIZE=50` (§14.4.3). So even a
   frozen `.env` and a frozen index do not reproduce a pair set.

Together: **a configuration does not identify the dataset. Only the file content does.**

**The frozen snapshot.** `evaluation/results-judge-frozen/`, promoted by copy from the verified
`evaluation/results-judge-candidates/run1/` (which is left untouched as the archive):

| | |
| --- | ---: |
| `unexpected_retrieved.json` | **1,180** rows |
| `missed_ground_truth.json` | **968** rows |
| **Total pairs** | **2,148** |
| `(query, side)` groups → chunks at size 40 | **115 → 127** |
| `overall_score` | **0.3025234053500492** |
| `avg_returned_count` | **22.0476** |
| `unexpected` rows with a populated `lexical_score` | **272 of 1,180 (23.1%)** — reconfirmed in Phase 4.2 |

`unexpected_retrieved.json` → `sha256:21858addb70fffbcfc4948b77b16e5716b90c8d0ce08891fef7e5c402247cf82`
`missed_ground_truth.json` → `sha256:b2f1b2b4080f04f296ef9f879ec12bf51585d00b36c9394c7f289f0c5a97f18c`

**The manifest.** `results-judge-frozen/judge_input_manifest.json`, built by
`relevance/build_judge_input_manifest.py`, records both hashes, both pair counts, the total, the chunk
count, `overall_score`, the scrape date and the §14.4 retrieval config. `results*/` is gitignored
(`evaluation/.gitignore:5`), so **the snapshot and its manifest stay local — that is intended.** The
committed artifact is `data/relevance-judgements.json`: the labels plus the two input hashes
(Step 4.3.3.4). Labels are identified by the content they were produced from, never by a config that
provably does not reproduce.

**Wiring.** `evaluation/relevance_input_vars.py` holds `JUDGE_INPUT_DIR` and the two derived input paths,
plus the manifest keys and the recorded config. It is **deliberately not env-overridable**: an override
would reintroduce exactly the ambiguity the freeze removes. Nothing in the judging path reads
`vars.RESULTS_DIR` for input — `results/` is written to (the two new CSVs) and never read from.

**One measurement worth carrying into Phase 7.1.** Driven with synthetic verdicts over the real 2,148
identities, the Task 4.2.6 band tables populate only **3 bands each** at `SCORE_BAND_WIDTH = 0.05`:
`cosine_score` spans 0.75–0.90 (949 of 1,180 rows in the single 0.80–0.85 band) and `cosine_score_ratio`
spans 0.90–1.05 (1,085 in 0.95–1.00; the ratio exceeds 1.0 for 44 rows). The spec's "e.g. 0.05-wide" is
kept as shipped, but **0.05 is too coarse to locate a cliff on this arm** — the distribution is that
compressed, which is itself a §11.10 signal. `SCORE_BAND_WIDTH` is a single constant in
`relevance_report_vars.py`; expect to re-run the table at 0.01 once real verdicts exist.

**Files holding literals after Phase 4.2** — reconciling §13's list, which names only
`vars.py` / `strings.py` / `relevance_vars.py` / `relevance_strings.py`. Three files were added, each to
hold the 100-line rule rather than to introduce a new convention: `relevance_prompt_strings.py` (the judge
system prompt alone — Step 4.1.1.2), `relevance_input_vars.py` (the frozen snapshot) and
`relevance_report_vars.py` (band width and band-table keys). `relevance_vars.py` was at exactly 100 lines,
so no new constant could go there. Purely structural payload/JSON field names sit at the top of the single
file that reads them, following the existing `report/build_service_diff_json.py` precedent.

### 14.6 Mission 5 — what shipped, and what "verified" means for it (2026-07-29)

**Ten new files, four edited.** New: `relevance_statistics_vars.py`, `relevance_statistics_strings.py`,
`relevance/frozen_query_record.py`, `relevance/read_frozen_query_records.py`,
`relevance/build_relevance_block.py`, `relevance/judge_and_rewrite_summary.py`,
`metrics/count_relevance_verdicts.py`, `metrics/aggregate_relevance_statistics.py`,
`metrics/adjusted_set_metrics.py`, `report/build_relevance_table.py`. Edited:
`report/serialize_summary.py`, `report/write_results.py`, `relevance/run_relevance_judging.py`,
`run_evaluation.py`, plus `dashboard/dashboard.html`. The judged run's two-stage write lives in
`relevance/judge_and_rewrite_summary.py` rather than in `run_evaluation.py`, which the orchestration
would otherwise have pushed to 104 lines; `run_evaluation.py` is 84, longest function 25.

**`results-judge-frozen/` holds no `summary.json`.** §14.5 promoted only the two diff JSON files and the
manifest; `summary.json`, `per_query.csv` and `service_diff.csv` stayed in
`results-judge-candidates/run1/`. This matters because Step 5.1.2.1 needs per-query `hits`, `|R|` and
`|G|` from the frozen snapshot. **No copy was made and no new dependency on the candidates archive was
introduced:** the two frozen diff files already carry every needed number themselves. Each per-query
entry re-emits `summary.json`'s own `ground_truth_size` and `returned_count` verbatim plus its own side's
`count`, so `|R|` and `|G|` are read directly and `hits` follows from either
`|R| − |unexpected|` or `|G| − |missed|`. **Both expressions agree on all 65 frozen queries**, and the
resulting unadjusted means reproduce `run1/summary.json` exactly — `precision_at_returned`
0.19435599554144598 and `recall_at_returned` 0.30839084256932864, equal to the last digit. The reader
raises if the two files ever disagree, because that would mean the labels are being paired with a
different arm.

**§11.7's note, re-measured on the frozen snapshot** (the note's own figures came from the same snapshot
and are confirmed, not merely reused): **107 unexpected-side rows across 4 queries** carry
`ground_truth_size: 0`. Six frozen queries have an empty golden set, but two are the
skipped-unsupported pair and contribute no rows at all, so the four contributing ones are
`תור לבדיקת שמיעה` (39), `קבוצת תמיכה לאחים של ילדים עם צרכים מיוחדים` (32),
`אני מוכרת בביטוח לאומי עם 40% נכות פסיכיאטרית…` (19) and `אמא שלי מרותקת לכסא גלגלים…` (17).
**They contribute 0 missed-side rows**, confirming the note's "`missed_truly_irrelevant_rate` needs no
such split". `empty_ground_truth_row_count` counts contributing rows and
`empty_ground_truth_query_count` counts contributing queries, so the emitted 4 is deliberately not 6.

**The `overall_score` regression check, both values.** `--judge` cannot be run without a credential, so
the claim was closed structurally instead: `compute_overall_score(aggregate['metrics'])` reads nothing
but that dict, no Mission 5 key appears in `METRIC_KEYS` / `SET_METRIC_KEYS` / `COUNT_STAT_KEYS`, and
`build_summary` was called twice on the frozen arm's aggregate — once with a `relevance` block and once
without. **With the block: `0.3025234053500492`. Without the block: `0.3025234053500492`.** Identical
under `repr()`, and equal to `judge_input_manifest.json`'s recorded value. The two summaries also
compare equal on every key except `relevance` itself.

**Write ordering: a judged run writes `summary.json` twice, and that is deliberate.** The sequence in
`run_evaluation.py` is (1) `write_results` — every base artifact on disk, before any network call;
(2) judging, if `--judge`; (3) `rewrite_summary_artifacts` — `summary.json` and `report.html` re-emitted
with the `relevance` sibling added. An earlier revision judged *before* the first write, to keep a single
write. **That was reverted, because it put irreplaceable data behind the most failure-prone stage of the
pipeline.**

Both halves of that reasoning are already established in this spec. §14.5 measures retrieval as **not
reproducible** — six byte-identical `POST /api/retrieve` calls returned two distinct document sets, with
`index_total` and `merges.total` both zero, so it is HNSW near-tie resolution at
`CANDIDATE_POOL_SIZE=50` and not index churn. An aborted run's artifacts therefore cannot be regenerated;
re-running produces a *different* dataset. And §11.2.1(b) names id omission and id drift as the
**expected** failure mode of this lite-tier judge, which Step 4.2.3.2 turns into a raised exception on any
gap. Judging first would therefore have traded a completed, unreproducible evaluation for the pipeline's
most likely exception — and would have left the cache's surviving labels pointing at a snapshot no longer
on disk. The double write costs one extra serialization of a payload already in memory.

**The guarantee, simulated rather than asserted:** with judging forced to raise, all six artifacts
(`summary.json`, `per_query.csv`, `service_diff.csv`, `unexpected_retrieved.json`,
`missed_ground_truth.json`, `report.html`) survive; `summary.json` is valid JSON, carries no `relevance`
key, holds `overall_score` `0.3025234053500492`, and is byte-identical to what an unjudged run writes.
The exception is not swallowed — **no `try/except` was added anywhere**; the ordering alone provides the
guarantee, which is why none was needed. The default unjudged path writes `summary.json` exactly once and
byte-identically to before this mission.

**`report.html` is refreshed by the second write too, not `summary.json` alone.** It is a pure render of
the same payload, so leaving it behind would make it the one artifact where the Task 5.2.3.1 panel never
appears. The four CSV and diff-JSON artifacts are *not* rewritten: no judgement changes them.

**What the synthetic verification does and does not establish.** 52 Python checks plus 10 dashboard
checks were run with synthetic verdicts laid over the **real 2,148 frozen identities** — a deliberate
mix of `relevant` / `irrelevant` / `unclear` / withheld, with the empty-golden-set rows labelled
distinctly so the two unexpected-side variants provably diverge. That establishes the plumbing: buckets
sum to their side's pair count, denominators equal `relevant + irrelevant`, relabelling `unclear` moves
the numbers, withheld pairs land in `unjudged`, the two rate variants differ while their counts
reconcile exactly to the 107 rows, adjusted ≥ unadjusted, zero denominators are guarded, and an absent
block leaves `summary.json`, the console and the dashboard all valid. It establishes **nothing about any
value**, because no real verdict exists. Every artifact was deleted afterwards; nothing that could be
mistaken for real labels was written to `evaluation/results/`, `results-judge-frozen/` or
`evaluation/data/`. **The first real numbers arrive with Phase 4.3, and per §12 they must not be
presented without Mission 6's agreement numbers.**

### 14.7 Mission 6 — what shipped, and why its deliverable is still open (2026-07-29)

**Sixteen new files, two edited.** New: `human_review_vars.py`, `human_review_strings.py`,
`human_review_schemas.py`, `human_review/{stratify_judged_pairs, allocate_sample_budget,
build_review_sample, build_sample_strata, read_judged_pairs, emit_review_sample,
load_review_verdicts, align_verdicts, check_agreement_gate, run_agreement_report,
run_human_review_stage}.py`, `metrics/{cohens_kappa, build_confusion_by_side,
agreement_statistics}.py`, `report/{write_review_sheet_csv, write_agreement_report,
build_agreement_table, format_agreement_value}.py`. Edited: `run_evaluation.py` (84 → 96 lines,
longest function 25) and `README.md`. **`schemas.py` was not touched** — Step 6.2.1.3 explains why.

**Ten files this spec's §2 tree did not anticipate**, every one created to hold the 100-line rule rather
than to add scope, and each named for the one thing it does: the allocation arithmetic and the grouping
are separate from the draw; κ and the 3×3 are separate from the statistics that use them; the strata
counts, the gate, the value formatter and the console table are each their own file; and the two stage
orchestrators keep `run_evaluation.py` inside its budget the same way
`relevance/judge_and_rewrite_summary.py` did for Mission 5. Longest function in the mission: 24 lines.

#### 14.7.1 The three-way status — read this before quoting anything from §9

| | |
| --- | --- |
| **BUILT AND VERIFIED** | The stratified draw, seed reproducibility, the shuffle, the withheld columns, the 7-column sheet with two blank cells, the read-back, the `review_id` join with its identity check, partial-sheet tolerance, all five agreement fields, κ, the report file, the gate mechanism, both CLI flags. Verified over the **real 2,148 frozen identities** and on hand-computable κ cases. |
| **BUILT BUT UNMEASURED** | Nothing about the *actual* judge. `--review-sample` cannot produce the real sheet yet: `data/relevance-judgements.json` does not exist, and `read_judged_pairs` raises rather than emitting an empty sheet. So `sample_strata` on real labels, the real `raw_agreement`, the real κ and the real `confusion_by_side` are all unknown. |
| **BLOCKED ON THE HUMAN** | The deliverable. `raw_agreement` and `cohens_kappa` are statements about whether a person agrees with the judge, and no code can supply the person. **The 2–3 hour sitting is the mission.** |

**The gate (Task 6.2.3) is explicitly OPEN.** Not passed, not failed — undecided, because there is
nothing to decide on. Do not present any Mission 5 adjusted metric as usable on the strength of this
mission being implemented.

#### 14.7.2 What was verified, and how

Driven with **obviously-synthetic verdicts over the real frozen identities** — scratchpad only, every
artifact deleted afterwards, nothing written to `evaluation/results/`, `evaluation/data/` or
`results-judge-frozen/`, and no credential read or written at any point.

**Stratification (Step 6.1.1.1).** 2,148 real pairs, synthetic verdicts skewed so `unclear` is ~2%:

| side / verdict | available | drawn at N=200 |
| --- | ---: | ---: |
| `unexpected_retrieved` / `relevant` | 680 | 55 |
| `unexpected_retrieved` / `irrelevant` | 476 | 41 |
| `unexpected_retrieved` / `unclear` | 24 | 11 |
| `missed_ground_truth` / `relevant` | 564 | 47 |
| `missed_ground_truth` / `irrelevant` | 379 | 35 |
| `missed_ground_truth` / `unclear` | 25 | 11 |

All 6 non-empty cells represented, none at zero. `unclear` drew **22 of 49 where pure proportionality
would have given 4.6** — a 4.8× lift, which is the floor doing its job. The missed side drew 93 where
proportionality gives 90.1, i.e. barely lifted, and that is correct: at 45% of the pairs the missed side
is not rare and needs no protection. **The spec's literal "all 968 missed rows" is impossible at N=200**
and would need `--review-sample 968` or more; the implementable reading is the one built.

**Seed (Step 6.1.1.2).** Same seed twice → identical rows *and* identical `review_id` order. Seed + 1 →
different rows (32 of 200 overlap) with the **strata unchanged**, which is the right signature: the
allocation is a function of the cell sizes and N, and only the draw within a cell is seeded.

**Shuffle and withholding (Steps 6.1.1.3, 6.1.1.4, 6.1.2.2).** Header exactly
`review_id, query, side, rank, service_name, human_verdict, human_notes`. `verdict`, `reason` and all
five score keys absent from the header; no verdict word, no reason text and **no score value** appears in
any of the 200 row bodies; both answer cells blank in all 200 rows. The adjacent-row verdict changed 112
times of 199 — a stratum-ordered sheet would change ~5 times.

**Allocation edge cases.** Exact row counts at N = 1, 7, 25, 60, 200, 999, 2148 and 5000 (a budget at or
above the population is a census, not an error), and a hand-checked 4-pair set at N = 2 and 3.

**Cohen's κ (Step 6.2.2.1), four hand-computable cases plus the case the bar exists for:**

| case | human / LLM | p_o | p_e | κ |
| --- | --- | ---: | ---: | ---: |
| perfect agreement | `R R I I U U` / identical | 1.0 | 3·(⅓·⅓) = ⅓ | **1.0** |
| chance level | `R R I I` / `R I R I` | 0.5 | (½·½)+(½·½) = 0.5 | **0.0** |
| systematic disagreement | `R R I I` / `I I R R` | 0.0 | 0.5 | **−1.0** |
| **degenerate** | `R×5` / `R×5` | 1.0 | (1·1) = 1.0 | **`null`** |
| skew the bar exists for | 95/5 vs 96/4, 93 matches | 0.93 | 0.914 | **0.186** |
| nothing reviewed | `[]` / `[]` | — | — | **`null`** |

Every value exact, no tolerance. The last two rows are the point of reporting both numbers: a raw 0.93
sails past its 0.85 bar while κ = 0.186 fails 0.60, and the degenerate case has a perfectly true raw
agreement of 1.0 that is not evidence of anything.

**The κ sentinel is JSON `null`, and that is a deliberate choice.** `p_e == 1` means both raters used one
class and the same one, so `1 − p_e` is zero and there is no chance-corrected agreement to report — chance
already explains every row. `0.0` and `1.0` were both rejected: each is a real κ a reader would act on. A
`null` can only be read as "not computable", and `check_agreement_gate.is_threshold_met` treats it as
**not met**, because an undefined κ cannot demonstrate above-chance agreement. An empty review returns the
same sentinel.

**Read-back, alignment and the report (Phase 6.2), four scenarios:**

| scenario | `sample_size` | `reviewed_count` | `raw_agreement` | κ | gate |
| --- | ---: | ---: | ---: | ---: | --- |
| sheet entirely unfilled | 200 | **0** | 0.0 | `null` | **OPEN** |
| 37 of 200 answered, all copying the judge | 200 | **37** | 1.0 | 1.0 | passed |
| 200 answered, ~25% flipped | 200 | 200 | 0.7500 | 0.5946 | **failed** |
| 200 answered, ~5% flipped | 200 | 200 | 0.9450 | 0.9074 | passed |

The first two rows are Step 6.2.1.4: a blank is never a verdict, and 37 answers on a 200-row sheet report
as 37 of 200 rather than as a completed 37-row study. In the third, the confusion totals reconcile against
`reviewed_count` (200), `agreement_by_verdict`'s matched sum reproduces `raw_agreement` to 1e-12, and
`len(disagreement_rows)` equals 200 − matched exactly. Both sides carry a full 3×3 whether or not every
cell is populated.

**The four guards all raise:** a typo in `human_verdict` (`relevnt`) — which would otherwise have counted
as a disagreement and pushed both numbers toward "the judge is wrong"; an unknown `review_id`; an identity
column that disagrees with the redraw; and a missing sheet.

**Nothing was fabricated where it could be mistaken for a result.** No human verdict exists in any
committed or user-visible artifact; `evaluation/results/human_review_sample.csv` and
`evaluation/results/agreement_report.json` were never created, and the paths were monkeypatched to the
scratchpad for every scenario with an assertion that the real path stayed absent. All scratchpad files
were deleted and the deletion confirmed.

#### 14.7.3 The M6 runbook — once labels exist

1. **Judge.** `python -m evaluation.run_evaluation --judge` (needs `GEMINI_JUDGE_API_KEY`). This is the
   hard prerequisite: with no `data/relevance-judgements.json`, step 2 raises by design.
2. **Emit the sheet.** `python -m evaluation.run_evaluation --review-sample` → 200 rows in
   `results/human_review_sample.csv`. Add `N` for a different size. Check the logged
   `Review sample strata` line: every non-empty `side/verdict` cell must show a non-zero draw, and if a
   partial-labels warning appears the sheet covers only the judged part of the snapshot.
3. **Copy the sheet out of `results/`.** `results*/` is gitignored **and** any later run overwrites it.
   Three different arms landed in that directory in one afternoon (§14.4.3); a hand-filled sheet lost that
   way costs 2–3 hours, not a re-run.
4. **Fill it in.** `human_verdict` ∈ `relevant` / `irrelevant` / `unclear`; `human_notes` free text.
   **Only those two columns.** Do not add, remove or reorder rows — the read-back redraws the sample from
   the seed and refuses a sheet whose identities have moved. Stopping part-way is fine.
   For a two-reviewer study hand out **the same sheet** (the seed guarantees it) and score each copy
   separately; there is deliberately no support for merging two reviewers into one number.
5. **Copy the filled sheet back** to `results/human_review_sample.csv`.
6. **Score it.** `python -m evaluation.run_evaluation --agreement` → the console table plus
   `results/agreement_report.json`. Neither flag evaluates anything, so neither needs retrieval running.
7. **Read BOTH headline numbers.** `raw_agreement ≥ 0.85` **and** `cohens_kappa ≥ 0.60`. A high raw
   agreement with a low κ is a judge guessing the majority class, not a passing judge.
8. **If the gate fails**, per Step 6.2.3.2 and §11.2.1(d): revise the **prompt only**, re-judge (the cache
   invalidates on the prompt checksum), re-sample — **one** cycle, then escalate the model. Nothing here
   is automatic; the run exits 0 either way and reports the outcome as a sentence.
9. **If it passes**, the M5 adjusted metrics are usable, and `disagreement_rows` is the reading list for
   the Mission 7 session.

**Re-emitting the sheet after a re-judge produces a different sheet, and must.** The verdicts change, so
the strata change, so the draw changes — the seed fixes the draw given the labels, not across label sets.
Discard the old sheet rather than trying to reconcile the two.

### 14.8 Status review — 2026-07-30

Nothing has been executed since §14.7. This section records what a fresh inspection of the working tree
found, and the two things that must be decided or fixed before Phase 4.3.

**What exists on disk.** `relevance/` holds 18 files, `human_review/` holds 12, plus 6 new `metrics/`
files, 13 new `report/` files, 10 new top-level vars/strings/schemas files and 2 new `clients/` files —
**61 new Python files under `evaluation/`, every one untracked.** `results-judge-frozen/` holds the
two pinned diff files and `judge_input_manifest.json`. **`evaluation/data/` holds only
`Raw-Golden-Set.csv` and `golden-set-ground-truth.json`** — there is no `relevance-judgements.json`, which
is the single fact that keeps M4, M5 and M6 all unmeasured. Every downstream stage raises by design when
it is absent, so the whole chain is gated on one file that one command produces.

#### 14.8.1 The blocker is a variable name

| Where | Name |
| --- | --- |
| `evaluation/.env:13` | `GEMINI_JUDGE_KEY` |
| `evaluation/relevance_vars.py:15` | `GEMINI_JUDGE_API_KEY` |
| `evaluation/.env.example:17` | `GEMINI_JUDGE_API_KEY` |
| `evaluation/relevance_strings.py:68` | `'--judge was requested but GEMINI_JUDGE_API_KEY is not set'` |

The code and the example agree; **the actual `.env` is the odd one out.** `get_judge_client` checks the
resolved value and raises before constructing the client, so `--judge` fails instantly with a message that
names the variable it wants — the failure is loud and correct, it just has not been acted on. The fix is
renaming the key in `evaluation/.env` to `GEMINI_JUDGE_API_KEY`.

Note the value currently sitting in `evaluation/.env:13` is **byte-identical to
`retrieval/.env`'s `GEMINI_EMBEDDER_API_KEY`** — the same credential is doing both jobs. `.env.example:15`
explicitly asks for the opposite ("differ from retrieval's `GEMINI_EMBEDDER_API_KEY` and be revoked on its
own"). Worth splitting them while renaming, since the judge is about to spend real tokens under it and a
shared key cannot be revoked independently. Both files are gitignored; neither key should reach a commit.

#### 14.8.2 The frozen snapshot is two arms behind the retriever — decide before spending labels

§14.5 froze `results-judge-frozen/` deliberately, and the reasoning there is still correct: a config does
not identify a dataset, only content does. But the *retriever* has moved twice since, under the concurrent
V4 embedder work (`docs/embedding-v4-gemini-spec.md`):

| Arm | `overall_score` | `precision_at_returned` | `recall_at_returned` |
| --- | ---: | ---: | ---: |
| **`results-judge-frozen/` (the pinned snapshot)** | **0.3025** | 0.1944 | 0.3084 |
| `results-arm3-v3-local` (local embedder, current cuts) | 0.3157 | 0.1957 | 0.3266 |
| **`results-arm4-v4-gemini` (current best)** | **0.3694** | **0.2397** | **0.4285** |

The V4 Gemini embedder improved every one of the 35 metric cells (+17% relative on `overall_score`), so the
frozen snapshot's 2,148 pairs describe a retriever that has been superseded. Two readings, and this spec
does not choose between them:

- **Judge the pinned snapshot anyway.** §0's load-bearing question is about the *golden set*, not the
  retriever: "are the services we return but the site doesn't genuinely irrelevant?" A relevance label on a
  `(query, service)` pair is a fact about that pair, so most labels transfer to any arm that retrieves the
  same service. The cache is keyed on pair identity for exactly this reason (§11.3), so labels bought now
  are partially reusable later. Cheapest path to an answer, and it preserves every guarantee §14.5 built.
- **Re-freeze on `results-arm4-v4-gemini`.** Mission 7's operating-point sweep should be run against the
  arm that will actually ship, and adjusted metrics on a superseded arm are of limited use to the session
  with Eli. Costs a re-freeze and re-judge, and the arm is still non-reproducible (§14.4.3) so it needs the
  same file-hash pinning.

**Recommendation: judge the pinned snapshot first.** It is already verified end to end, the manifest and
hashes exist, and the §0 question it answers is the one that determines whether the precision number means
anything at all. Re-freezing on arm 4 is the right move for Mission 7's sweep, but doing it *before* any
labels exist trades a ready dataset for another round of setup while the core question stays open.

Whichever is chosen: **the V4 arm decision and the judge decision are independent** and should not be
serialized behind one another.

#### 14.8.3 Still true, still worth repeating

- **Everything is uncommitted** — ~30 modified and ~40 new files, mixing this spec's work with the V4
  embedder spec's. §3.2 called this a release blocker rather than a gate blocker; it has now been true
  across two specs and a full A/B measurement, and the two bodies of work want separating into their own
  commits before either lands.
- **No Mission 5 adjusted metric may be presented without Mission 6's agreement numbers** (§12). The gate
  is OPEN, not passed. Nothing in §14.6's synthetic verification changes that.
- **`results/` currently holds the V4 Gemini no-cut arm** (`overall_score` 0.3853), not the judged arm —
  a fourth arm has landed in that directory since §14.4.3 counted three. The judging path reads
  `results-judge-frozen/` and never `results/` (§14.5), so this is harmless, but it is one more reason not
  to identify a dataset by its directory.
