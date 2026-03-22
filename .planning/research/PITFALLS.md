# Pitfalls Research

**Domain:** Streaming-to-batch ETL refactor (dataflows → pandas)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Array-in-Cell Column Handling

**What goes wrong:**
pandas merge/join breaks silently when columns contain Python lists (array-valued cells from Airtable). `pd.isna()` raises `ValueError` on lists. `df.merge()` on list-valued columns produces wrong results or errors.

**Why it happens:**
Airtable stores link fields as arrays (e.g., `branches: ["recXXX", "recYYY"]`). When loaded into pandas, these become list-in-cell values. Developers forget to explode before joining and reaggregate after.

**How to avoid:**
- Always `df.explode('array_col')` before any merge on that column
- After merge, reaggregate: `df.groupby('key').agg({'array_col': lambda x: list(set(chain.from_iterable(x)))})`
- Use `isinstance(v, list)` checks before `pd.isna()` checks
- Cast `numpy.int64` to `int()` before JSON serialization (ES bulk API)

**Warning signs:**
- Merge results have fewer rows than expected
- `ValueError` from `pd.isna()` on unexpected types
- ES bulk API rejects documents with numpy types

**Phase to address:** Phase 1 (shared foundation — establish patterns) and Phase 2 (to_dp implementation)

---

### Pitfall 2: Airtable ID Field Name Mismatch

**What goes wrong:**
The current `dataflows_airtable` uses `AIRTABLE_ID_FIELD = "__airtable_id"` (double underscore). The shared `load_airtable_as_dataframe()` uses `_airtable_id` (single underscore). Code that references one may break with the other.

**Why it happens:**
Two different Airtable access patterns were built independently — the dataflows plugin and the shared pandas utility. They chose different sentinel column names.

**How to avoid:**
- Standardize on `_airtable_id` (the pandas version) since we're removing dataflows
- Search-and-replace all references to `__airtable_id` in the new operators
- Document the standardized name in the operator module docstrings

**Warning signs:**
- KeyError on `__airtable_id` after switching to `load_airtable_as_dataframe`
- ID remapping in from_curation silently producing empty mappings

**Phase to address:** Phase 1 (shared foundation)

---

### Pitfall 3: RSScoreCalc Extraction Complexity

**What goes wrong:**
`RSScoreCalc` is deeply coupled to dataflows — it uses `DF.checkpoint()`, `DF.select_fields()`, and streaming generators. Naive extraction loses the two-pass behavior (first pass counts occurrences, second pass scores and prunes).

**Why it happens:**
The scoring algorithm needs global statistics (IDF = inverse document frequency) which requires seeing all rows before scoring any row. In dataflows this was done via checkpoint (materialize all rows, then iterate again). In pandas this is natural (DataFrame is already materialized).

**How to avoid:**
- Implement as two pandas operations:
  1. First pass: `df.explode('situation_ids').groupby('situation_id').size()` → get counts
  2. Second pass: Score each row using the count dict, prune situations below threshold
- The math is fully documented in the existing code — extract the formulas, not the plumbing

**Warning signs:**
- Scores differ between old and new implementation
- Situation pruning removes too many or too few items

**Phase to address:** Phase 2 (to_dp — card_data_flow)

---

### Pitfall 4: ES Mapping Completeness

**What goes wrong:**
The current `SRMMappingGenerator` auto-generates ES mappings from dataflows field schemas. When switching to explicit Python dict mappings, it's easy to miss fields or get types wrong. Missing the Hebrew analyzer on text fields breaks Hebrew search.

**Why it happens:**
Auto-generation worked "by convention" — any field with a certain dataflows schema type got the right ES mapping. Manual dicts require listing every field explicitly.

**How to avoid:**
- Use `es_schemas.py` as the translation source — every constant (`TAXONOMY_ITEM_SCHEMA`, `URL_SCHEMA`, `KEYWORD_STRING`, `NON_INDEXED_STRING`, `LAST_MODIFIED_DATE`) maps to an ES mapping type
- Check every field in the current ES indexes against the new explicit mappings
- Validate: query ES for current index mappings (`GET /srm__cards/_mapping`) and compare

**Warning signs:**
- Hebrew search stops returning results
- Fields that should be filterable return no hits
- API errors about mapping conflicts

**Phase to address:** Phase 1 (shared foundation — create explicit mapping dicts)

---

### Pitfall 5: Autocomplete Cartesian Explosion

**What goes wrong:**
The autocomplete generator creates a cartesian product of responses × situations × org_names × city_names per card. With large card sets, this can produce millions of intermediate rows before deduplication.

**Why it happens:**
In dataflows, this was a streaming generator yielding one suggestion at a time. In pandas, a naive `pd.merge(how='cross')` materializes the full cross product in memory.

**How to avoid:**
- Process cards in chunks (e.g., 1000 cards at a time)
- Or use a generator-to-DataFrame pattern: generate suggestions via Python generator, then batch into DataFrames for deduplication
- The join_with_self dedup (aggregate by `query`) is the natural bottleneck — do it incrementally

**Warning signs:**
- Memory usage spikes during autocomplete generation
- Process gets OOM-killed

**Phase to address:** Phase 3 (autocomplete implementation)

---

### Pitfall 6: Revision-Based Swap Timing

**What goes wrong:**
The current code does `time.sleep(30)` between bulk index and delete_by_query. If ES hasn't refreshed, the delete query misses the new docs (deleting everything) or includes them (deleting nothing useful).

**Why it happens:**
ES near-real-time search has a 1s refresh interval by default, but bulk operations may take longer to become visible.

**How to avoid:**
- Replace `time.sleep(30)` with explicit `es.indices.refresh(index=index_name)` to force a refresh
- Then immediately run `delete_by_query` for old revision
- This is both faster and more reliable

**Warning signs:**
- Index is empty after a run (all docs deleted)
- Old docs remain after a run (delete didn't match)

**Phase to address:** Phase 1 (ES utilities refactoring)

---

### Pitfall 7: from_curation Cross-Table ID Remapping

**What goes wrong:**
`from_curation` copies records from curation AT to staging AT, but link fields (org→branches→services) reference curation record IDs. These must be remapped to staging record IDs. If the mapping is incomplete, services lose their branch/org links.

**Why it happens:**
The current code uses `collect_ids()` + `filter_by_items()` to build and apply the mapping. This is tightly coupled to dataflows streaming. The pandas version needs to build the mapping as a dict and apply it via `df[col].map()`.

**How to avoid:**
- Build the ID mapping as a Python dict: `{curation_airtable_id: staging_airtable_id}`
- After writing each table (orgs → branches → services), collect the mapping from AT write responses
- Apply mappings to link fields before writing the next table
- Validate: every link field value should be in the mapping; log warnings for unmapped IDs

**Warning signs:**
- Branches have `null` organization after curation copy
- Services have empty `branches` arrays
- AT write creates duplicate records instead of updating

**Phase to address:** Phase 4 (Operator A — from_curation)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep old `derive/` directory | No risk of breaking other references | Dead code confusion | Always (explicit user requirement) |
| In-memory only (no intermediate persistence) | Simpler, faster | Must re-run fully on failure | Acceptable for <10min pipeline |
| Hardcoded ES mapping dicts | Explicit, debuggable | Manual updates when schema changes | Acceptable — schema changes are rare |

## Integration Risks

### Risk 1: Shared Infra API Differences
The shared `airtable_updater()` from `srm_tools/update_table.py` was built for dataflows streaming. Verify it can accept a pandas DataFrame or list of dicts directly.

**Mitigation:** Read `airtable_updater()` source, adapt input format if needed.

### Risk 2: Cronicle Scheduling
Currently Cronicle calls a single derive operator. After split, it needs to call two operators in sequence.

**Mitigation:** Register two operator entries or create a wrapper that calls both.

### Risk 3: Environment Variable Consistency
Both operators need `AIRTABLE_BASE`. Verify this env var is available in all execution contexts (local dev, stage, prod).

**Mitigation:** Already confirmed — env var exists in all environments.

---
*Researched: 2026-03-22*
