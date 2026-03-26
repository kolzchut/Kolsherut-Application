# Project Research Summary

**Project:** Kol Sherut ETL — Derive Comparison & Validation
**Domain:** ETL Pipeline Comparison & Validation
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

The refactored `derive` operator has been split into two independent pandas-based operators — `derive_curation` (15 files, Airtable staging writes) and `derive_es` (20+ files, 6 ES indexes) — replacing the original monolithic dataflows-based implementation (12 files, ~2500 LOC). Research across stack, features, architecture, and pitfalls confirms that the comparison is feasible with existing tooling, but several **HIGH-risk integration gaps** must be addressed before the new operators can be considered faithful replacements.

The most critical finding is that four code paths from the old pipeline have **not been ported or have uncertain port status**: (1) `cards_to_at_flow()` — card field writeback to Airtable is entirely missing from both new operators, (2) `autotagging.py` — presence in the new `to_dp.py` is unconfirmed, (3) `manual_fixes.finalize()` — fix usage stats writeback may be dropped, and (4) the Airtable ID field naming convention (`__airtable_id` double-underscore vs `_airtable_id` single-underscore) creates a silent cross-table reference breakage risk. These gaps are HIGH severity because they produce valid-looking output — the pipeline won't crash, but data linkage or downstream features will be silently broken.

The validation strategy should extend the existing `validate.py` (which already covers doc-count, field-mapping, and sampled pairwise comparison) rather than building from scratch. The primary upgrade is scaling from 10-doc samples to exhaustive full-index comparison using `elasticsearch.helpers.scan()`, adding semantic normalization to handle the framework-change artifacts (array ordering, NaN/None/empty-list equivalence), and introducing a known-difference allowlist for intentional schema changes.

## Key Findings

### Recommended Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **DataFrame diffing** | `datacompy` 0.14+ | Join-key-aware comparison with detailed mismatch reports — far superior to manual `pd.merge` diffing |
| **ES document diffing** | `deepdiff` 8.x | Nested dict comparison with path reporting; replaces `validate.py`'s JSON string comparison |
| **Test harness** | `pytest` 8.x | Parametrize over 6 ES indexes; fixtures for ES client and DF snapshots |
| **Exact DF assertion** | `pandas.testing.assert_frame_equal` | Zero-install; `check_like=True` + `check_dtype=False` for framework-tolerant comparison |
| **Code structure audit** | `ast` + `difflib` (stdlib) | Extract function signatures, compute similarity scores between old→new function implementations |
| **Full-index scan** | `elasticsearch.helpers.scan()` | Replace 10-doc sample with exhaustive doc-by-doc comparison |
| **Fast equality check** | `hashlib` (stdlib) | SHA256 per doc's canonical JSON — O(n) set difference across indexes |

**New dependencies:** `datacompy`, `deepdiff` (both pure Python, `pip install datacompy deepdiff`). Zero-new-dep fallback exists using only `pandas.testing` + `json` + `hashlib` but sacrifices diagnostic quality.

### Expected Features

| Tier | Count | Key Items |
|------|-------|-----------|
| **Table Stakes** (must-have) | 7 | Doc count parity (all 6 indexes), schema/mapping equivalence, ID-level doc matching, field-level diff on matched docs, AT write verification, deterministic re-run, exit code parity |
| **Differentiators** (thorough) | 9 | Full-index doc-by-doc diff, nested field deep diff, numeric tolerance, known-difference allowlist, autocomplete validation, sort-order validation, cross-index referential integrity, encoding parity, categorized diff report |
| **Defer** (v4+) | 7 | AT record-level comparison, performance baseline, unit tests for pure transforms, integration tests with frozen fixtures, template-level autocomplete validation, search-quality ranking validation |

**MVP scope:** All 7 table stakes + full-index diff, nested deep diff, numeric tolerance, allowlist, and categorized report from differentiators. The existing `validate.py` provides ~40% of the table stakes already.

### Architecture Approach

**Old→New mapping is comprehensive** — every file and function in the old `derive/` has a documented target location in `derive_curation/` or `derive_es/`. The recommended comparison order follows the data dependency chain:

1. **Foundation:** `helpers.py`, `es_mappings.py`, `es_utils.py` (pure functions + static config)
2. **Operator A (derive_curation):** filtering → mapping → upsert (AT staging writes)
3. **Operator B / Denormalization:** `to_dp.py` (largest module, highest risk)
4. **Autocomplete:** vars → expansion → locations → scoring (highest fan-out)
5. **ES Loading:** `to_es.py` — all 6 index load functions
6. **Cross-cutting:** orchestration, `cards_to_at`, autotagging port status

**Validation points (VP1–VP4):** Staging AT state → card_data DataFrame → autocomplete suggestions → ES indexes. Each VP has defined capture and diff methods.

### HIGH-Risk Gaps

These four gaps are the most critical findings of the entire research. Each produces **silent failures** — the pipeline completes successfully but output is wrong.

| # | Gap | Severity | Impact | Action |
|---|-----|----------|--------|--------|
| 1 | **`cards_to_at_flow()` not ported** — old `to_sql.py` writes 8 card fields back to AT Cards table; this logic exists in neither `derive_curation` nor `derive_es` | **HIGH** | Cards table in AT loses computed fields (scores, taxonomy summaries). Downstream consumers of AT Cards see stale data. | Determine if writeback is still needed. If yes, port to `derive_es` after `to_dp`. |
| 2 | **`autotagging.py` port status unknown** — `apply_auto_tagging()` loads rules from AT and applies regex-like matching to enrich taxonomy fields | **HIGH** | If not ported, cards lose auto-assigned taxonomy tags → search recall degrades silently. No crash, just missing enrichment. | Audit `derive_es/to_dp.py` for autotagging logic. If absent, port it. |
| 3 | **AT ID field mismatch: `__airtable_id` (double) vs `_airtable_id` (single)** — old `dataflows_airtable` uses double-underscore; new `derive_es.helpers` uses single | **HIGH** | All cross-table reference remapping (`org_id → staging_org_id`) may silently fail or produce wrong linkages. ID lookups return `None` or match wrong records. | Verify what `load_airtable_as_dataframe()` actually returns. Standardize across both operators. |
| 4 | **`manual_fixes.finalize()` writeback uncertain** — old `ManualFixes` class writes fix usage stats back to AT; new flat `apply_manual_fixes()` may not | **MEDIUM-HIGH** | Fix tracking in AT becomes stale. Curators lose visibility into which fixes are applied. Not a data correctness issue but an operational gap. | Check new `apply_manual_fixes()` for AT writeback. If absent, assess whether it's still needed. |

### Critical Pitfalls (Top 5)

| # | Pitfall | Type | Mitigation |
|---|---------|------|------------|
| 1 | **Array element ordering mismatch** — `set` iteration in dataflows vs `groupby().agg(list)` in pandas produces different array orders. Flags thousands of false diffs. | False Positive | Build `normalize_for_comparison(doc)` that recursively sorts all arrays by `str` before any diff |
| 2 | **NaN/None/empty-list type mismatch** — pandas `NaN` vs dataflows `None` vs `""` vs `[]` all serialize differently to JSON | False Positive | Normalize null-equivalents to canonical `None`; compare numerics with tolerance; coerce `int64`↔`float64` |
| 3 | **Checkpoint/cache staleness** — old pipeline's 15 checkpoint dirs may silently serve cached output from previous runs | False Negative | Hard-clean ALL `.checkpoints/` and `data/` dirs before generating baseline; verify with hashes |
| 4 | **AT ID remapping blindspot** — mismapped `curation_org_A → staging_org_B` still produces plausible output (wrong org, valid data) | False Negative | Validate remap dicts directly: `old_keys == new_keys`, `old_values == new_values`; spot-check services by name |
| 5 | **Dataflows non-determinism** — running old pipeline twice on same input produces different output due to set/generator iteration order | False Positive | Run old pipeline 3× on frozen AT state; compute noise floor; exclude from old-vs-new diff |

## Implications for Roadmap

Based on the research, the v3.0 milestone should be structured as **6 phases** following the dependency chain, with HIGH-risk gaps front-loaded:

| Phase | Scope | Key Deliverable | Depends On |
|-------|-------|-----------------|------------|
| **Phase 1: Baseline Setup** | Freeze AT snapshot, hard-clean old caches, run old pipeline 3× to establish noise floor, install `datacompy`/`deepdiff` | Noise floor quantified; frozen baseline ES indexes with `_old` aliases | — |
| **Phase 2: Foundation Audit** | Compare `helpers.py`, `es_mappings.py` (auto-generated vs hand-written), `es_utils.py`. **Resolve AT ID field naming mismatch (Gap #3).** | Finding docs for 3 modules; AT ID convention standardized | Phase 1 |
| **Phase 3: Operator A (derive_curation)** | Audit filtering → mapping → upsert. **Validate ID remapping correctness.** Check `manual_fixes.finalize()` writeback **(Gap #4).** | Remap dict equality verified; manual_fixes gap resolved | Phase 2 |
| **Phase 4: Operator B / Core (derive_es)** | `to_dp.py` stage-by-stage comparison. **Confirm autotagging port status (Gap #2).** Map every `DF.join` aggregate mode to pandas equivalent. | Autotagging gap resolved; join semantics documented | Phases 2–3 |
| **Phase 5: Autocomplete + ES Loading** | Autocomplete expansion + dedup (relaxed matching). All 6 `to_es.py` indexes. **Determine `cards_to_at_flow()` disposition (Gap #1).** | Autocomplete noise threshold documented; cards_to_at gap resolved | Phase 4 |
| **Phase 6: Runtime Validation** | Extend `validate.py` to full-index comparison with normalization, tolerance, allowlist, categorized report. Run against Phase 1 baseline. | Enhanced `validate.py`; per-index pass/fail; exit code 0 or remediation list | Phases 1–5 |

**Critical path:** The AT ID mismatch (Gap #3) must be resolved in Phase 2 — it affects every downstream comparison. All four HIGH-risk gaps should be closed no later than Phase 5.

---
*Synthesized: 2026-03-23 from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Supersedes: v2.0 summary (2026-03-22) which covered implementation research*
