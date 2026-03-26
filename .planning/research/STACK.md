# Stack Research

**Domain:** ETL Pipeline Comparison & Validation
**Researched:** 2026-03-23
**Confidence:** HIGH

## Context

Comparing refactored `derive` operator (dataflows-based, 12 files, ~2500 LOC) against two new pandas-based operators: `derive_curation` (15 files) and `derive_es` (20+ files). Existing stack: Python 3.x, pandas 2.2.3, elasticsearch 7.13.4, pyairtable 3.1.1, dataflows 0.5.5. A `validate.py` already exists in `derive_es/` covering doc-count, field-mapping, and pairwise alias comparison for ES indexes.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| **datacompy** | 0.14+ | DataFrame comparison with join-key matching, detailed mismatch reports | Purpose-built for DF diffing; reports matching/mismatching rows and columns with tolerances; handles type coercion; generates human-readable reports. Far superior to manual `pd.merge` diffing. |
| **deepdiff** | 8.x | Deep comparison of nested Python objects (ES documents, dicts) | Handles nested dicts/lists from ES `_source`; structural diff with path reporting; configurable ignoring of keys/order; JSON-serializable output. Upgrade path for `validate.py`'s `_compare_docs`. |
| **pytest** | 8.x | Test harness for validation suite | Already standard; parametrize over 6 ES indexes; fixtures for ES client and DataFrame snapshots; `--tb=short` for CI-friendly output. |
| **pandas.testing** | (bundled) | Exact DataFrame assertion | `assert_frame_equal` with `check_like=True` (ignore column/row order), `check_dtype=False`, `atol`/`rtol` for numeric tolerance. Zero-install, use alongside datacompy. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| **ast** (stdlib) | — | Parse Python files into ASTs for structural comparison | Module-level code audit: extract function signatures, class structures, identify logic blocks that moved between old→new files. |
| **difflib** (stdlib) | — | Textual diff of function bodies, generate unified diffs | Side-by-side code comparison when tracing where old logic landed in new files. `difflib.unified_diff` + `difflib.SequenceMatcher.ratio()` for similarity scoring. |
| **json** (stdlib) | — | Normalize ES documents for deterministic comparison | Already used in `validate.py`'s `_compare_docs`. Serialize with `sort_keys=True, default=str` before comparing. |
| **hashlib** (stdlib) | — | Content-hash ES documents for fast equality check | Hash each doc's canonical JSON → compare hash sets across old/new indexes. O(n) instead of O(n²) for full-index comparison. |
| **pytest-sugar** | 1.0+ | Better test progress output | Optional. Cleaner progress bars during validation runs with many parametrized cases. |
| **tabulate** | 0.9+ | Format comparison reports as tables | Already a common transitive dep. Print validation summaries in markdown/grid format for gap reports. |

### Development Tools

| Tool | Purpose | Notes |
|---|---|---|
| **ES alias-based side-by-side** | Run old and new pipelines into separate aliases on same cluster | Pattern: `srm__cards_old` vs `srm__cards_new`. The existing `compare_indexes()` in `validate.py` already supports this. Extend to scroll full index, not just sample. |
| **`elasticsearch.helpers.scan()`** | Full-index document iteration | The existing `validate.py` only samples 5–10 docs. For production validation, use scroll API to compare all docs. Already available via elasticsearch 7.13.4. |
| **pytest `--co`** (collect-only) | Dry-run test discovery | Verify all 6 indexes × N checks are collected before running. |
| **VS Code Python Test Explorer** | Visual test runner | Run individual index validation tests interactively during debugging. |

---

## Approach Details

### 1. Module-Level Code Comparison (Old → New)

**Goal:** Trace every logic block in old `derive/` to its new location in `derive_curation/` or `derive_es/`.

**Technique: AST-based function inventory**
```python
import ast, pathlib

def extract_signatures(py_file: pathlib.Path) -> dict:
    """Return {func_name: (args, lineno)} for all functions/methods."""
    tree = ast.parse(py_file.read_text())
    sigs = {}
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            args = [a.arg for a in node.args.args]
            sigs[node.name] = (args, node.lineno)
    return sigs
```

**Technique: Similarity scoring for function bodies**
```python
import difflib, ast

def function_source(filepath, func_name):
    """Extract source of a function from a file."""
    source = open(filepath).read()
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == func_name:
            return ast.get_source_segment(source, node)
    return None

def similarity(old_file, new_file, func_name):
    old_src = function_source(old_file, func_name)
    new_src = function_source(new_file, func_name)
    if old_src and new_src:
        return difflib.SequenceMatcher(None, old_src, new_src).ratio()
    return 0.0
```

**File-level mapping (from PROJECT.md):**

| Old File | New Location | Comparison Scope |
|---|---|---|
| `derive/from_curation.py` | `derive_curation/from_curation/` (split across pipeline.py, filtering/, mapping/, upsert/) | Verify all filter/remap/upsert logic preserved |
| `derive/to_sql.py` | `derive_curation/from_curation/upsert/` | Dataflows `Flow()` → pandas `update_if_exists_if_not_create` |
| `derive/to_dp.py` | `derive_es/to_dp.py` | Dataflows resource → pandas DataFrame construction |
| `derive/autocomplete.py` | `derive_es/autocomplete/` (multi-file module) | Single file → module split |
| `derive/to_es.py` | `derive_es/to_es.py` | Dataflows-elasticsearch → direct `elasticsearch.helpers.bulk` |
| `derive/helpers.py` | `derive_es/helpers.py` | Should be mostly identical |
| `derive/es_utils.py` | `derive_es/es_utils.py` | ES client factory |
| `derive/es_schemas.py` | `derive_es/es_mappings.py` | Renamed, verify mappings identical |
| `derive/manual_fixes.py` | `derive_curation/from_curation/filtering/manual_fixes.py` | Business logic preservation |
| `derive/autotagging.py` | Both operators or shared location | Verify no logic dropped |

### 2. Runtime Validation (Pipeline Diffing)

**Goal:** Run both pipelines against same Airtable data, compare ES output across all 6 indexes.

**Existing capability:** `validate.py` has `compare_indexes(old_alias, new_alias)` — but limited to sample of 10 docs.

**Enhancement: Full-index comparison using scroll + hashing**
```python
from elasticsearch.helpers import scan
import hashlib, json

def index_hashes(es, index: str) -> dict[str, str]:
    """Return {doc_id: content_hash} for every doc in index."""
    hashes = {}
    for hit in scan(es, index=index, query={"query": {"match_all": {}}}):
        canonical = json.dumps(hit["_source"], sort_keys=True, default=str)
        hashes[hit["_id"]] = hashlib.sha256(canonical.encode()).hexdigest()
    return hashes

def diff_indexes(es, old_index, new_index):
    old_h = index_hashes(es, old_index)
    new_h = index_hashes(es, new_index)
    only_old = set(old_h) - set(new_h)
    only_new = set(new_h) - set(old_h)
    changed = {k for k in set(old_h) & set(new_h) if old_h[k] != new_h[k]}
    return {"only_old": only_old, "only_new": only_new, "changed": changed}
```

**ES query patterns for validation:**

| Check | ES Query Pattern | Purpose |
|---|---|---|
| Doc count match | `GET /{index}/_count` | Verify same number of docs |
| Full hash comparison | `scan()` + SHA256 per doc | Identify any doc-level differences |
| Field coverage | `GET /{index}/_mapping` | Verify identical field sets |
| Missing IDs | `terms` query on `_id` field | Find docs in one but not other |
| Field-level diff | `GET /{index}/_doc/{id}` + `deepdiff` | Drill into specific differing docs |
| Aggregation parity | `terms` agg on key fields | Verify distribution matches (e.g., status counts) |

### 3. DataFrame Comparison

**Goal:** Compare intermediate DataFrames at key pipeline stages (post-filter, post-remap, pre-ES-write).

**Primary tool: datacompy**
```python
import datacompy

compare = datacompy.Compare(
    df_old, df_new,
    join_columns=["id"],          # or composite key
    abs_tol=0,
    rel_tol=0,
    df1_name="old_derive",
    df2_name="new_derive_es",
)
print(compare.report())
# Shows: rows only in df1, rows only in df2, column mismatches,
# matching rows with differing values (by column)
```

**Secondary tool: pandas.testing for exact assertions in pytest**
```python
import pandas as pd
from pandas.testing import assert_frame_equal

def test_cards_dataframe_matches():
    df_old = build_cards_old_pipeline()
    df_new = build_cards_new_pipeline()
    assert_frame_equal(
        df_old.sort_values("id").reset_index(drop=True),
        df_new.sort_values("id").reset_index(drop=True),
        check_like=True,    # ignore column order
        check_dtype=False,   # allow int64 vs Int64 etc.
    )
```

**Checkpoint comparison pattern** (capture DataFrames at stage boundaries):
```python
# In validation harness — not in production code
CHECKPOINTS = {}

def capture(name, df):
    """Save a DataFrame checkpoint for later comparison."""
    CHECKPOINTS[name] = df.copy()

# Old pipeline: capture(f"old_{stage}", df) at each stage
# New pipeline: capture(f"new_{stage}", df) at each stage
# Then: datacompy.Compare(CHECKPOINTS["old_filter"], CHECKPOINTS["new_filter"], ...)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| **datacompy** | Manual `pd.merge(how='outer', indicator=True)` | Tiny one-off checks; datacompy is overkill for 2-column DataFrames |
| **deepdiff** | `json.dumps` + string compare (current `_compare_docs`) | When you only need "same/different" without structural path reporting |
| **pytest** parametrize | Standalone scripts per index | If validation must run outside test framework (e.g., from Cronicle) — but prefer pytest |
| **ast** module | **rope** / **jedi** for refactoring analysis | If you need IDE-level rename tracking or cross-file reference resolution |
| **difflib** | **unidiff** library | If you need to parse/generate actual git-format patches |
| **hashlib** full-index comparison | ES `_search_after` + per-doc deepdiff | When you need the actual diff content, not just "differs" flag |
| **tabulate** | **rich.table** | If you want colored, interactive console output for reports |

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| **great_expectations** | Massive dependency, designed for data quality rules not A/B pipeline comparison. Overkill for this scope. | datacompy + pytest assertions |
| **dbt** | SQL-focused, wrong paradigm for pandas→ES pipeline comparison | Direct DataFrame comparison |
| **pandas `df.equals()`** | No diagnostic output — just True/False. Useless for debugging mismatches. | `datacompy.Compare()` or `assert_frame_equal` |
| **ES `_msearch`** | Batching queries adds complexity without value for validation | Simple `_count` / `scan()` per index |
| **diffoscope** | System-level binary diff tool, not structured data | deepdiff for Python objects |
| **dataflows test utilities** | Old framework — defeats purpose of validating the move away from it | Raw pandas + pytest |
| **monkey-patching old pipeline** | Fragile, hard to maintain, risks altering old behavior | Run old pipeline unmodified, capture output |
| **SQLite snapshot export** | Extra serialization step, loses ES-specific types (geo_point, nested) | Compare directly in ES or as DataFrames |

---

## Integration Notes

### With Existing `validate.py`
The existing `validate.py` in `derive_es/` already provides:
- `validate_index()` — doc count, field mapping, sample check
- `compare_indexes()` — pairwise alias comparison (limited sample)
- CLI entry point: `python -m operators.derive_es.validate`

**Recommended enhancements:**
1. Add `deepdiff` for the `_compare_docs` function (replaces JSON string comparison)
2. Add `elasticsearch.helpers.scan` for full-index iteration (replace 10-doc sample)
3. Add hash-based fast-path before doc-level diff
4. Wire into pytest so validation is part of test suite

### With Existing Requirements
- `pandas`, `elasticsearch` — already installed
- `datacompy` — **new dep**, `pip install datacompy` (pure Python, no binary deps)
- `deepdiff` — **new dep**, `pip install deepdiff` (pure Python)
- `pytest` — likely already dev-installed; if not, `pip install pytest`
- `ast`, `difflib`, `hashlib`, `json` — stdlib, no install needed

### Installation (One Command)
```bash
pip install datacompy deepdiff pytest pytest-sugar tabulate
```

### Zero-New-Dep Alternative
If no new dependencies are acceptable, everything can be done with:
- `pandas.testing.assert_frame_equal` (DataFrame comparison)
- `json.dumps` + `hashlib` (ES document comparison — already in validate.py)
- `ast` + `difflib` (code comparison)
- `unittest` (test harness)

This sacrifices diagnostic quality (no join-key-aware DF reports, no structural path diffs) but adds zero packages.

---
*Researched: 2026-03-23 — v3.0 Derive Comparison & Validation milestone*
