# Feature Research

**Domain:** ETL Pipeline Comparison & Validation
**Researched:** 2026-03-23
**Confidence:** HIGH

## Context

Milestone v3.0 validates that the refactored `derive_curation` (Operator A) and `derive_es` (Operator B) faithfully reproduce the behavior of the original monolithic `derive` operator. The old pipeline uses `dataflows` streaming; the new uses pandas batch. Output targets: 6 ES indexes + Airtable card records. An existing `validate.py` script covers single-index health checks and pairwise doc comparison — this research catalogs the full landscape of validation features beyond that initial tool.

---

## Feature Landscape

### Table Stakes (Must Have for Valid Comparison)

These are the minimum checks needed to credibly claim "the new pipeline matches the old one." Skipping any of these leaves an obvious gap a reviewer would flag.

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Doc count parity (all 6 indexes)** | First thing anyone checks — total record counts must match | LOW | `validate.py` already does `_doc_count()` per index |
| **Schema/mapping equivalence** | Field names and types must match or intentional differences must be documented | LOW | `validate.py` already checks `_field_names()` vs `ALL_MAPPINGS` |
| **ID-level doc matching** | Confirm same set of document `_id` values in old vs new index | MEDIUM | `compare_indexes()` exists but limited to sampled `size` docs — needs full-index version |
| **Field-level diff on matched docs** | For docs with same `_id`, every field value must match | MEDIUM | `_compare_docs()` exists — needs scaling to full index and diff reporting |
| **Airtable write verification** | Operator A writes orgs/branches/services to staging AT — counts must match | MEDIUM | No tooling exists yet; need AT record count comparison |
| **Deterministic re-run** | Running same input through old and new must produce identical output — confirms no randomness | LOW | Procedural — run both pipelines on frozen AT snapshot |
| **Exit code / error parity** | Both pipelines must succeed or fail on the same inputs | LOW | Check log output + exit codes from both runs |

### Differentiators (Thorough Validation)

Features that distinguish a thorough validation from a cursory one. These catch subtle bugs — order-dependent logic, floating point drift, encoding quirks — that count-based checks miss.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Full-index doc-by-doc diff** | Sample-based comparison misses long-tail issues; exhaustive diff catches all | HIGH | Scroll/scan all docs from both aliases, match by `_id`, diff field-by-field. Memory: ~2×index size |
| **Nested field deep diff** | `_compare_docs` uses JSON serialization — misses semantic equivalence (e.g., list order) | MEDIUM | Recursive diff with configurable list-order sensitivity. Taxonomy arrays should be order-insensitive |
| **Numeric tolerance comparison** | RS scoring and card scoring use float math — pandas vs dataflows may produce ε differences | LOW | Add `math.isclose(rel_tol=1e-6)` to numeric field comparison |
| **Known-difference allowlist** | Intentional changes (e.g., `_airtable_id` standardization) shouldn't pollute the diff | LOW | Config file listing expected field renames/removals. Filters diff output |
| **Autocomplete count + content validation** | Autocomplete is the most complex transform — template counts, scoring, dedup all need checking | HIGH | Compare `srm__autocomplete` doc counts per template type, spot-check expansion correctness |
| **Sort-order validation** | ES search quality depends on `card_score` ranking — verify sort order matches | MEDIUM | Query both indexes with same search terms, compare result ordering |
| **Cross-index referential integrity** | `srm__cards` references IDs found in `srm__situations`, `srm__responses`, etc. | MEDIUM | For each card, verify referenced taxonomy IDs exist in corresponding indexes |
| **HTML/text encoding parity** | Hebrew text through different serialization paths can produce encoding differences | LOW | Byte-level comparison on a representative sample of Hebrew text fields |
| **Timing/performance baseline** | New pipeline should be ≤ old pipeline runtime (no performance regression) | LOW | Time both runs, compare. Not a correctness issue but a deployment readiness signal |
| **Diff report with categorization** | Raw diff output is useless at scale — categorize diffs by type (missing field, value mismatch, type mismatch) | MEDIUM | Structured report: group by diff category, show counts + samples per category |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Line-by-line source code diff** | "Show me exactly what changed" | Meaningless across frameworks — dataflows streaming vs pandas batch are structurally different; line diff is noise | Module-level behavior audit: document what each module does, confirm new module does same thing |
| **Intermediate state snapshots** | "Compare data at each pipeline stage" | Old pipeline has 15 checkpoints in different formats (NDJSON, CSV); new has none. Comparing intermediates requires building throwaway instrumentation | Compare final output only — if output matches, intermediates are irrelevant |
| **Automated test generation from old pipeline** | "Generate unit tests by recording old pipeline behavior" | Brittle — tests encode implementation details and data-dependent behavior; break on any AT data change | Write targeted tests for pure transform functions (taxonomy, scoring, phone normalization) |
| **Bit-identical ES index comparison** | "Indexes must be byte-for-byte identical" | ES doesn't guarantee serialization order; `_source` field ordering varies; float representation differs | Semantic comparison with tolerance: field-by-field, type-aware, with known-difference allowlist |
| **Full regression test suite before shipping** | "We need 100% test coverage first" | Pipeline is data-dependent on live Airtable; meaningful tests require frozen fixture data | Ship with runtime validation (full-index diff on staging), add unit tests in future milestone |
| **Parallel execution comparison** | "Run old and new simultaneously to compare" | Both write to ES and AT — concurrent writes create race conditions and corrupt data | Sequential: run old → snapshot ES indexes → run new → diff against snapshot |

---

## Feature Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     VALIDATION INFRASTRUCTURE                    │
│                                                                  │
│  Frozen AT Snapshot (prerequisite for deterministic comparison)   │
│      │                                                           │
│      ├──> Run OLD derive operator ──> ES indexes (aliased _old)  │
│      │                                                           │
│      └──> Run NEW operators ──> ES indexes (aliased _new)        │
│               │                                                  │
│               ├─ derive_curation ──> AT staging records          │
│               └─ derive_es ──> 6 ES indexes                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                      COMPARISON TOOLS                            │
│                                                                  │
│  validate.py (EXISTS)                                            │
│      ├── doc count check ............... table stakes            │
│      ├── field/mapping check ........... table stakes            │
│      ├── sample doc comparison ......... table stakes (limited)  │
│      └── pairwise compare_indexes() ... table stakes (limited)  │
│                                                                  │
│  Full-index differ (NEW)                                         │
│      ├── scroll all docs from both aliases                       │
│      ├── match by _id                                            │
│      ├── deep field-level diff                                   │
│      │     ├── numeric tolerance (float fields)                  │
│      │     ├── list-order insensitivity (taxonomy arrays)        │
│      │     └── known-difference allowlist                        │
│      └── categorized diff report                                 │
│            ├── depends on: es_utils.py, es_mappings.py           │
│            └── depends on: diff allowlist config                 │
│                                                                  │
│  AT record comparator (NEW)                                      │
│      ├── count records in old vs new staging base                │
│      └── depends on: load/airtable.py, AIRTABLE_BASE            │
│                                                                  │
│  Cross-index integrity checker (NEW)                             │
│      └── depends on: full-index differ output + ALL_MAPPINGS     │
│                                                                  │
│  Report generator (NEW)                                          │
│      ├── aggregates all diff results                             │
│      └── outputs summary table + exit code                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     EXISTING DEPENDENCIES                        │
│                                                                  │
│  es_utils.py ──── es_instance(), bulk_index_dataframe()          │
│  es_mappings.py ── ALL_MAPPINGS (6 index mapping dicts)          │
│  load/airtable.py ── load_airtable_as_dataframe()                │
│  srm_tools/logger.py ── logger                                   │
│  conf/settings.py ── AIRTABLE_BASE, ES config                   │
└──────────────────────────────────────────────────────────────────┘
```

### Dependency Notes

- **Frozen AT data** is the single prerequisite for all comparison work — both pipelines must run against identical input
- **`validate.py`** already provides the skeleton — extend rather than replace
- **`es_mappings.ALL_MAPPINGS`** serves double duty: mapping creation AND expected-field validation
- **No new external dependencies** — everything builds on `elasticsearch-py` + `pandas` already installed

---

## Complexity Summary

| Category | LOW | MEDIUM | HIGH | Total |
|----------|-----|--------|------|-------|
| Table Stakes | 4 | 2 | 1 | 7 |
| Differentiators | 3 | 4 | 2 | 9 |
| **Total validation features** | **7** | **6** | **3** | **16** |

---

## MVP Definition

### Launch With (v3.0 Milestone)

**Code Audit Features:**
- [ ] Module-level behavior comparison: old `from_curation.py` vs new `derive_curation/from_curation/`
- [ ] Module-level behavior comparison: old `to_dp.py` + `helpers.py` vs new `derive_es/to_dp.py` + `helpers.py`
- [ ] Module-level behavior comparison: old `autocomplete.py` vs new `derive_es/autocomplete/`
- [ ] Module-level behavior comparison: old `to_es.py` + `es_utils.py` + `es_schemas.py` vs new `derive_es/to_es.py` + `es_utils.py` + `es_mappings.py`
- [ ] Module-level behavior comparison: old `to_sql.py` vs new `derive_curation/` upsert modules
- [ ] Shared module comparison: `manual_fixes.py`, `autotagging.py`, `__init__.py` orchestration

**Runtime Validation Features:**
- [ ] Doc count parity across all 6 ES indexes (extend existing `validate.py`)
- [ ] Schema/mapping equivalence (already in `validate.py`)
- [ ] Full-index doc-by-doc diff with `_id` matching (upgrade `compare_indexes()` from sample-based to exhaustive)
- [ ] Nested field deep diff with numeric tolerance and list-order insensitivity
- [ ] Known-difference allowlist (`_airtable_id` rename, any intentional schema changes)
- [ ] Categorized diff report (group by: missing docs, extra docs, field value mismatch, field type mismatch)

**Reporting Features:**
- [ ] Summary table: per-index status (OK/WARN/FAIL), doc count delta, diff count, diff categories
- [ ] Gap/fix list: every discrepancy logged with enough context to diagnose and resolve
- [ ] Exit code: 0 = match, 1 = differences found

### Future Consideration (v4+)

- [ ] Autocomplete template-level validation (count + content per template type)
- [ ] Sort-order / search-quality validation (same queries, compare result rankings)
- [ ] Cross-index referential integrity checking
- [ ] AT record-level comparison (Operator A output)
- [ ] Performance baseline comparison (timing both pipelines)
- [ ] Unit tests for pure transform functions (taxonomy, scoring, phone, address)
- [ ] Integration tests with frozen AT fixture data

---

## Key Insight

The most common failure mode in ETL refactors is **silent data loss or corruption** — the pipeline runs successfully, returns exit code 0, but produces subtly different output. The table stakes catch gross failures (wrong count, missing fields). The differentiators catch the subtle ones (float drift, list reordering, encoding differences). The anti-features list exists because people consistently request line-diff and intermediate-state comparison, which are actively counterproductive when the implementation framework has changed.

The existing `validate.py` is a solid foundation — it already handles single-index health checks and sampled pairwise comparison. The v3.0 work is primarily about **scaling it to exhaustive comparison** and **adding diff intelligence** (tolerance, allowlists, categorization).

---
*Researched: 2026-03-23 — supersedes v2.0 feature research for validation milestone*
