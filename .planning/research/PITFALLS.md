# Pitfalls Research

**Domain:** ETL Pipeline Comparison & Validation
**Researched:** 2026-03-23
**Confidence:** HIGH

> This document covers pitfalls specific to **comparing and validating** the refactored `derive_curation` and `derive_es` operators against the original `derive` operator. It is NOT about implementation pitfalls (those are covered in the v2.0 implementation research). Every pitfall here addresses a way the comparison/validation process itself can produce false confidence, false alarms, or missed regressions.

---

## Critical Pitfalls

### Pitfall 1: Array Element Ordering Mismatch (False Positive)

**What goes wrong:**
Diffing old vs. new ES documents shows arrays like `situation_ids`, `response_ids`, `responses`, `situations`, `data_sources` as "changed" — but the actual _set_ of values is identical. The old dataflows streaming code processes rows in arrival order and accumulates arrays via generators (`chain`, `set`, `sorted`). The new pandas code accumulates via `groupby().agg(list)` or `explode/merge`, which produces different insertion orders. The comparison flags thousands of "differences" that are semantically identical.

**Why it happens:**
- `DF.join(..., aggregate='set')` returns a Python `set` cast to list — iteration order depends on hash ordering (CPython insertion-ordered dict, but set iteration is non-deterministic across runs).
- pandas `groupby().apply(list)` preserves DataFrame row order, which depends on merge order.
- `merge_array_fields()` in old code calls `sorted(set(vals))` — but only for the merged field. Individual sub-arrays (`branches`, `organization_branches`) are not sorted before merge.
- `normalize_taxonomy_ids()` deduplicates while "preserving order of first appearance" — this order differs between streaming and batch.

**How to avoid:**
- **Phase 1 of comparison:** Sort all array-valued fields before diffing. Use a canonical form: `sorted(arr, key=str)`.
- For nested object arrays (`responses`, `situations`), sort by a stable key (`id` field).
- Build a `normalize_for_comparison(doc)` function that recursively sorts all arrays — apply to both old and new output before any diff.
- **Do NOT** change the production code to sort — this is comparison-only normalization.

**Warning signs:**
- Diff report shows >80% of records as "different" when you expected near-zero.
- "Changed" fields are exclusively array-typed.
- Running the same old pipeline twice also shows these "diffs" (proves the ordering is non-deterministic, not a regression).

**Phase to address:** Before any ES diff — must be the very first normalization step.

---

### Pitfall 2: NaN vs None vs Empty-List Type Mismatch (False Positive)

**What goes wrong:**
Pandas uses `NaN` (float) and `None` for missing values. The old dataflows code uses Python `None`, empty string `""`, and empty list `[]` interchangeably. When serialized to JSON for ES, these become `null`, `""`, or `[]` — all different but semantically equivalent for missing data. Naive JSON diff flags them as different.

**Why it happens:**
- `load_airtable_as_dataframe()` returns `NaN` for missing cells; the old `load_from_airtable()` returns `None`.
- pandas converts `None` in an integer column to `NaN` (and the column to float64), changing `3` → `3.0`.
- Array columns: old code defaults to `[]` via `v or []` patterns; pandas defaults to `NaN`.
- `json.dumps(NaN)` raises or writes `NaN` (invalid JSON) vs `json.dumps(None)` → `null`.

**How to avoid:**
- Normalize null-equivalents before comparison: `{None, NaN, float('nan'), '', [], {}}` → canonical `None`.
- For numeric fields, compare with tolerance: `abs(old - new) < 1e-9` rather than exact equality.
- For integer fields stored as float64, normalize: `3.0` → `3` before comparison.
- Check for `numpy.int64` vs `int` type mismatches — these serialize differently to JSON.

**Warning signs:**
- Fields like `service_boost` show `0` vs `0.0` diffs.
- `phone_numbers` sometimes shows `null` vs `[]`.
- ES bulk indexing fails with "NaN not allowed" errors.

**Phase to address:** Normalization function — applies alongside Pitfall 1 sorting.

---

### Pitfall 3: Checkpoint/Cache Staleness Poisoning the "Old" Baseline (False Negative)

**What goes wrong:**
Running the old `derive` pipeline to generate baseline data, but one or more of the 15 checkpoint/cache directories contain stale data from a previous run. The old pipeline _claims_ to clear caches with `shutil.rmtree()`, but if a partial failure leaves a `.checkpoints/to_dp/` directory intact, the checkpoint absorb behavior (`handle_flow_checkpoint`) silently skips the entire upstream pipeline and serves stale data. The comparison then validates the _new_ code against _stale old_ output — missing genuine regressions.

**Why it happens:**
- The dataflows `checkpoint` on cache-hit replaces the entire upstream chain with a disk read. The old code deletes checkpoints in `operator()` before each stage, but if the pipeline crashed mid-stage in a previous run, some checkpoints survive.
- `shutil.rmtree(path, ignore_errors=True)` silently swallows permission errors on Windows.
- The `from-curation-*` dump_to_path directories (#1-3 in the cache map) are deleted per-table _inside_ the loop, but if the loop previously wrote table 1 and crashed before table 2, table 1's cache is fresh but table 2's is stale.

**How to avoid:**
- **Before generating baseline:** Run a hard clean: delete ALL `.checkpoints/` and `data/` subdirectories manually. Verify with `ls -la .checkpoints/` that nothing remains.
- Add a pre-run verification step: hash all cache directories after cleanup, assert empty.
- Run the old pipeline twice on clean state. If outputs differ, the pipeline itself is non-deterministic (see Pitfall 5) and you need a different baseline strategy.

**Warning signs:**
- Old pipeline completes suspiciously fast (cache hits where there should be none).
- Baseline data has timestamps from a previous run.
- `data/card_data/datapackage.json` has a `created` field from a different date.

**Phase to address:** Pre-comparison setup — gating step before any diff.

---

### Pitfall 4: Airtable ID Remapping Validation Blindspot (False Negative)

**What goes wrong:**
The old `from_curation.py` builds `updated_orgs` and `updated_branches` dicts by: (1) upserting records via `airtable_updater`, (2) collecting Airtable record IDs from the write response via `collect_ids()`, (3) doing a _second_ AT read (`DF.Flow(load_from_airtable(...), lambda: conversion.setdefault(row['id'], row.get(AIRTABLE_ID_FIELD)))`) to build `{id → airtable_id}` mapping, then (4) composing: `{curation_airtable_id → staging_airtable_id}`. The new `reference_remapper.py` uses `_remap_list()` with a simpler dict.

The comparison only checks ES output (cards), which is many stages downstream. If the remapping has an off-by-one error (maps curation org A to staging org B), the downstream joins may _still produce plausible-looking output_ because a different org has a similar name. ES diff shows same field values, but the data linkage is wrong.

**Why it happens:**
- Airtable record IDs are opaque strings (`recXXXXX`). A mismap between two valid IDs doesn't produce null — it produces _different valid data_.
- The old code's two-phase lookup (upsert → re-read) creates a window where AT records could be modified by another process.
- The new code's `build_staging_id_mapping()` builds the map from a single read — timing difference means different AT state.

**How to avoid:**
- **Validate remapping separately** before comparing downstream output: For each entity type (orgs, branches), assert `new_remap.keys() == old_remap.keys()` and `new_remap.values() == old_remap.values()`.
- Spot-check 10-20 specific services: verify their `organization_id`, `branch_id` link to the _same entity_ (by name/address, not by AT record ID).
- Add a cross-reference check: for every service in new output, does `organization_name` match the org linked by `organization_id`?

**Warning signs:**
- Service count matches but organization_id values differ between old and new (easy to miss if you only diff ES card documents).
- A small number of cards show different org names — dismissed as "data update" when it's actually a remap error.
- `from_curation` log shows different numbers of mapped IDs between runs.

**Phase to address:** from_curation audit — before ES-level comparison.

---

### Pitfall 5: Dataflows Non-Determinism Polluting Diff Baseline (False Positive)

**What goes wrong:**
Running the old `derive` pipeline twice against the same Airtable data produces _different_ output. The diff between old₁ and old₂ is non-zero. This means any diff between old and new includes both genuine regressions AND inherent non-determinism noise, making it impossible to distinguish real issues.

**Why it happens:**
- **Branch deduplication** in `merge_duplicate_branches()`: iterates a generator, keeps the _first_ occurrence of each key. Generator order depends on upstream processing order, which in dataflows depends on resource iteration interleaving.
- **`service_implements` dedup** in `merge_duplicate_services()`: relies on encounter order — which service is seen first determines which one gets kept.
- **`possible_autocomplete()`**: builds a `set()`, then `sorted()` — deterministic per run, but the set contents depend on upstream ordering of responses/situations.
- **Airtable API pagination**: The Airtable API does not guarantee row order across calls unless a sort is specified. If the view's sort changes or AT re-balances internally, the same logical dataset arrives in different row order.

**How to avoid:**
- **Run old pipeline 3× on identical AT state** (freeze the AT base or use the emulator). Compute diff(old₁, old₂) and diff(old₁, old₃). The _union_ of these diffs is the "noise floor." Any diff(old, new) items that fall within this noise floor are NOT regressions.
- For the comparison, use the _last_ old run as baseline (most recent AT state).
- Document every known non-deterministic field so auditors can filter them.
- Consider using the old dump_to_path intermediate files as a "frozen" comparison point instead of running old code again.

**Warning signs:**
- Old pipeline's `flat_branches/flat_branches.csv` has a different row count across runs (duplicate merge order sensitivity).
- `autocomplete.csv` row count varies by ±5% across identical-input runs.
- diff(old₁, old₂) shows >0 differences when it should show 0.

**Phase to address:** Baseline establishment — must quantify noise floor before any old-vs-new comparison.

---

### Pitfall 6: DF.join Aggregate Semantics vs. pandas merge/groupby (False Negative)

**What goes wrong:**
The old code uses `DF.join('source_resource', ['key'], 'target_resource', ['key'], fields={..., 'aggregate': 'set'})` throughout `flat_branches_flow`, `flat_services_flow`, `flat_table_flow`, and `to_es.py`. Dataflows' `DF.join` has specific semantics for aggregation that differ subtly from pandas equivalents:
- `aggregate='set'` → collects unique values as a list (order undefined).
- `aggregate='count'` → counts non-null matches.
- `aggregate='array'` → collects ALL values including duplicates.
- Default (no aggregate) → takes the LAST matching value.

If the new pandas code uses `merge + groupby` but chooses a different aggregate behavior (e.g., `first` instead of `last`, or `list` instead of `set`), the comparison passes for most records but fails on the ~5% of records with multiple matches — the hardest cases to catch.

**Why it happens:**
- `DF.join` with no aggregate takes the LAST source row that matches the key (because the source is consumed into a dict, and dict assignment overwrites). Developers often assume "first" or "any."
- In `flat_branches_flow`, organizations join onto branches with `mode='inner'`. If a branch links to org A (row 50) and org A appears twice in the organizations resource (rows 10 and 30), the join takes row 30's values. Pandas `merge().drop_duplicates(keep='last')` would only match if the DataFrame is in the same order.
- `DF.join_with_self` combines grouping + aggregation in a single operation. The pandas equivalent requires `groupby().agg()` with the exact same aggregation functions.

**How to avoid:**
- **Map every DF.join call** to its aggregate mode. For each, write the pandas equivalent and verify edge cases:
  - No aggregate → `merge().drop_duplicates(subset=[key], keep='last')`
  - `set` → `merge().groupby(key).agg(lambda x: list(set(x)))`
  - `count` → `merge().groupby(key).size()`
  - `array` → `merge().groupby(key).agg(list)`
- Validate against records with >1 match per key. Sort intermediate results by key and manually inspect the multi-match cases.
- Use the old `flat_branches/flat_branches.csv` (checkpoint #6) as ground truth for the joining stage specifically — don't wait until the final ES diff to catch join errors.

**Warning signs:**
- A handful of records have different `organization_name` or `branch_address` between old and new (multi-match last-vs-first).
- Record counts match exactly but field values differ for <5% of records.
- `join_with_self` aggregation produces different `count` values.

**Phase to address:** Module-level audit of `to_dp.py` joins — must enumerate and map every join before runtime comparison.

---

### Pitfall 7: Taxonomy Normalization Edge Cases Masked by Sparse Data (False Negative)

**What goes wrong:**
`normalize_taxonomy_ids()` handles 5 specific edge cases: comma-concatenated IDs, space-concatenated IDs, singular→plural canonicalization (`human_situation:` → `human_situations:`), bare root removal, and deduplication. The comparison passes because only 2-3 records in the current dataset actually trigger each edge case. A comparison that checks only aggregate counts or random samples will miss that these specific records are handled differently.

**Why it happens:**
- Taxonomy data is mostly clean — the edge cases exist in <1% of records.
- `fix_situations()` has special logic: if BOTH `men` and `women` are present, remove both; if `arabs` or `bedouin` is present, add `arabic_speaking`. These compound conditions trigger on a small number of records.
- `update_taxonomy_with_parents()` expands IDs to include all ancestor levels. If the expansion logic has an off-by-one in split/join, the output has one extra or one fewer parent — but the parent sets are large enough that a count-based check won't notice.

**How to avoid:**
- **Targeted test cases:** Extract the specific records that trigger each edge case from the old pipeline's output. For taxonomy normalization:
  - Find records where `situation_ids` or `response_ids` contain commas within a single array element.
  - Find records where `human_situation:` (singular) appears.
  - Find records where both `gender:men` and `gender:women` are present.
  - Find records where `sectors:arabs` or `sectors:bedouin` is present.
- Diff these _specific records_ field-by-field between old and new output.
- Use the old `data/card_data/card_data.csv` as the reference, not Airtable (AT data may have been corrected since last run).

**Warning signs:**
- Overall diff shows 99.5% match — "looks clean" — but the 0.5% are all taxonomy edge cases.
- `situation_ids` array lengths differ by exactly 1 for a handful of records.
- `fix_situations()` applied to 12 records in old pipeline but 0 in new pipeline (logic not ported).

**Phase to address:** Business logic audit — taxonomy normalization module comparison.

---

### Pitfall 8: Autocomplete Score/Deduplication Comparison — Combinatorial Divergence (False Positive + False Negative)

**What goes wrong:**
The autocomplete stage generates ~500K-1M suggestion rows via a Cartesian product of templates × responses × situations × orgs × cities, then deduplicates by `(query, response_id, situation_id)`. Comparing old vs. new autocomplete output produces massive diffs because:
1. Different intermediate row ordering → different "first seen" record wins dedup → different `score`, `card_id`, `visible` values for the same `query`.
2. The old `DF.join_with_self` dedup aggregates `score` as `max` and other fields as `first`. Pandas `groupby().agg({'score': 'max', 'card_id': 'first'})` only matches if the DataFrame is in the same order.
3. Fuzzy city name matching (`thefuzz.process.extractBests`) has score thresholds — a city name scoring 85 in one run and 84 in another flips between match/no-match.

**Why it happens:**
- The autocomplete is the highest fan-out stage (1 card → hundreds of suggestions). Any ordering difference in the input amplifies into massive output differences.
- The `thefuzz` library's string matching is sensitive to the comparison set — if locations are loaded in different order, the match set presented to `process.extractBests()` differs, changing which cities cross the match threshold.

**How to avoid:**
- **Compare autocomplete at the query level only**: group by `query`, compare the _set_ of unique queries generated. Ignore per-query scores and metadata.
- For score comparison: compare `(query, max_score)` pairs. The `max` should be deterministic regardless of input order.
- For city matching: freeze the location bounds file (download once, use for both old and new runs).
- Accept that autocomplete will have ~1-5% legitimate diff due to ordering sensitivity. Document this as known noise.

**Warning signs:**
- Autocomplete diff shows >50% "different" rows — almost certainly an ordering/dedup artifact, not a regression.
- Total unique `query` count differs by <1% but total row count differs by >10%.
- Same `query` appears in both old and new but with different `score` values.

**Phase to address:** Autocomplete comparison — should be its own validation phase with relaxed matching criteria.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip intermediate-stage comparison, only diff ES output | Faster validation cycle | Hides which stage introduced a difference — debugging is 5× harder | Never for initial validation; OK for regression testing after first clean diff |
| Use old cached CSV files as baseline instead of re-running old pipeline | No need to run old dataflows code | Baseline may reflect a different AT state than the new run | Acceptable if AT data hasn't changed; document the AT snapshot timestamp |
| Accept ±1% diff threshold as "close enough" | Avoids chasing non-deterministic noise | Masks real regressions affecting exactly the 1% of edge-case records | Only after quantifying the noise floor (Pitfall 5) |
| Compare JSON dumps instead of ES queries | Avoids ES analyzer differences | Misses mapping/analyzer regressions (Hebrew search, keyword vs. text) | Acceptable for data correctness; must also run ES mapping comparison separately |
| Diff ES index mapping only (skip data comparison) | Fast structural check | Mapping match ≠ data match (correct mapping with wrong data is invisible) | Never sufficient alone; useful as a first gating check |

---

## Validation Anti-Patterns

### Anti-Pattern 1: "Row Count Match = Success"
Checking that old and new produce the same number of ES documents per index. This catches gross errors (entire table missing) but misses: wrong field values, swapped references, missing array elements, incorrect scores. **Every** Kol Sherut comparison should diff at the field level for a statistically significant sample.

### Anti-Pattern 2: "Random Sampling for Data Correctness"
Sampling 50 random cards and eyeballing the JSON. This misses: edge cases that affect <1% of records (see Pitfall 7), systematic biases that only show in aggregate (e.g., all scores shifted by 10%), and fields that are correct for most records but wrong for a specific data_source.

### Anti-Pattern 3: "Comparing Against Airtable Instead of Old ES Output"
Comparing the new pipeline's output against the current Airtable data. This validates the pipeline _reads AT correctly_ but doesn't validate it _transforms identically to the old pipeline_. Airtable is the input, not the expected output.

### Anti-Pattern 4: "Snapshot Timing Mismatch"
Running the old pipeline on Monday, the new pipeline on Wednesday, and comparing. Airtable data changes continuously (curators update records). Any diff could be a genuine data update, not a code regression. **Both pipelines must run against the same AT snapshot** — either freeze the AT base, run both within minutes of each other, or use the old pipeline's dump_to_path caches as frozen input.

### Anti-Pattern 5: "Ignoring Fields Not Visible in the Frontend"
Fields like `possible_autocomplete`, `data_sources`, `response_category`, internal IDs, and `score` are not directly visible in the UI. Skipping them in comparison misses: search ranking regressions (wrong scores), autocomplete quality degradation, and broken data provenance. **Diff all fields**, even internal ones.

### Anti-Pattern 6: "ES Document ID Equality = Data Equality"
The old pipeline generates document IDs via `hasher(service_id, branch_id, ...)`. The new pipeline must use the same hash function with the same inputs. If the hash is correct but a field inside the document is wrong, checking "same doc ID exists in both indexes" validates nothing about data correctness.

### Anti-Pattern 7: "Green Unit Tests = Validated Pipeline"
Unit tests on individual functions (normalize_taxonomy, card_score, etc.) confirm function-level equivalence but don't catch: integration issues (data flows between functions differently), schema mismatches (field renamed between stages), and ordering dependencies (function A's output order affects function B's behavior). Unit tests are necessary but nowhere near sufficient — full pipeline execution comparison is required.

---
*Researched: 2026-03-23*
*Source: Analysis of derive/ (12 files, ~2500 LOC), derive_curation/ (15 files), derive_es/ (20 files), DERIVE-FLOW-ANALYSIS.md (855 lines)*
