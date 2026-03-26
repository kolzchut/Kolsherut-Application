# Architecture Research

**Domain:** ETL Pipeline Comparison & Validation
**Researched:** 2026-03-23
**Confidence:** HIGH

## Old→New Module Mapping

### derive → derive_curation

| Old File / Function | LOC | New Location | Notes |
|---------------------|-----|-------------|-------|
| `from_curation.py` → `copy_from_curation_base()` | 201 | `from_curation/pipeline.py` → `copy_from_curation_base()` | Entry point; same public signature |
| `from_curation.py` → mark undecided (DF.Flow L80–91) | 12 | `from_curation/filtering/mark_undecided.py` → `mark_undecided()` | Old: `DF.filter_rows` + `DF.set_type` + `dump_to_airtable`. New: pandas filter + `pyairtable.batch_update` |
| `from_curation.py` → org filtering (L94–110: stats.filter_with_stat ×3) | 17 | `from_curation/filtering/record_filter.py` → `filter_curation()` | Old: 3 chained `stats.filter_with_stat` calls. New: `_is_active()` + `_is_not_rejected()` + `_apply_linked_filter()` |
| `from_curation.py` → `filter_by_items()` (L18–31) | 14 | `from_curation/mapping/reference_remapper.py` → `remap_references()` | Old: streaming generator mutating row lists. New: pandas `apply()` with `_remap_list()` |
| `from_curation.py` → `collect_ids()` (L34–42) | 9 | `from_curation/mapping/id_mapping.py` → `collect_curation_ids()` | Old: streaming generator building dict. New: pandas comprehension over iterrows |
| `from_curation.py` → org id→AT_ID lookup (L116–122) | 7 | `from_curation/mapping/id_mapping.py` → `build_staging_id_mapping()` + `build_curation_to_staging_remap()` | Old: inline `DF.Flow` → `conversion` dict. New: explicit 2-step mapping functions |
| `from_curation.py` → location AT_ID lookup (L124–130) | 7 | `from_curation/pipeline.py` L60 → `build_staging_id_mapping(staging_base, LOCATION_TABLE)` | Same pattern as org lookup, extracted to shared function |
| `from_curation.py` → `airtable_updater()` calls (×3) | ~50 | `from_curation/upsert/upsert_organizations.py`, `upsert_branches.py`, `upsert_services.py` | Old: `airtable_updater()` + `fetch_mapper()` + `update_mapper()`. New: `update_if_exists_if_not_create()` from `load/airtable.py` |
| `manual_fixes.py` → `ManualFixes` class | 153 | `from_curation/filtering/manual_fixes.py` → `apply_manual_fixes()` | Old: class with lazy load, `apply_manual_fixes()` generator, `finalize()`. New: flat function, loads fixes dict, applies with `df.at[]` |
| `to_sql.py` → `cards_to_at_flow()` (L51–127) | 77 | **NOT PORTED YET** — not in derive_curation | Old: writes 8 card fields back to AT Cards table. This belongs in derive_es after `to_dp` produces card_data. |
| `to_sql.py` → `dump_to_sql_flow()` (L28–49) | 22 | **DEAD CODE** — commented as unused | Old code dumps to SQL DB. Not called in operator(). |
| `from_curation/vars.py` → `TABLE_FIELDS`, `EXTRA_FIELDS`, `BATCH_SIZE` | 33 | N/A (new file, no old equivalent) | Extracted from inline dicts in old `from_curation.py` L55–72 |

### derive → derive_es

| Old File / Function | LOC | New Location | Notes |
|---------------------|-----|-------------|-------|
| `to_dp.py` → `operator()` (full file) | 946 | `to_dp.py` → `to_dp()` (1113 lines) | Old: 5 dataflows sub-flows with checkpoints. New: pandas functions, returns `pd.DataFrame` |
| `to_dp.py` → `load_all_tables()` equiv. (inline DF.load ×6) | ~60 | `to_dp.py` → `load_all_tables()` | Old: `load_from_airtable()` scattered across 5 sub-flows. New: single function loading 6 tables |
| `to_dp.py` → filtering (filter_dummy, filter_active, set_pkey) | ~30 | `to_dp.py` → `_filter_dummy()`, `_filter_active()`, `_set_key()` | Old: `DF.filter_rows()` + `helpers.filter_dummy_data()` + `helpers.filter_active_data()`. New: pandas boolean mask |
| `to_dp.py` → denormalization / flat_table joins | ~400 | `to_dp.py` → `flat_branches()`, `flat_services()`, `flat_table()` | Old: `DF.join()` chains. New: `pd.merge()` |
| `to_dp.py` → card scoring | ~30 | `helpers.py` → `card_score()` | Old: inline in `to_dp.py`. New: extracted to shared helpers |
| `to_dp.py` → taxonomy parent expansion | ~40 | `helpers.py` → `update_taxonomy_with_parents()` | Same algorithm, ported from class method to plain function |
| `to_dp.py` → `safe_reorder_responses_by_category()` | 20 | `to_dp.py` → (look for equivalent) | Old: reorders responses by matching category; needs audit |
| `to_dp.py` → `safe_get_response_categories()` | 15 | `to_dp.py` → (look for equivalent) | Old: extracts category slugs from response IDs |
| `to_dp.py` → `merge_array_fields()` | 12 | `to_dp.py` → (look for equivalent) | Old: dedup + sort merged arrays |
| `to_dp.py` → `count_meser_records()` | 15 | `to_dp.py` → (logging equivalent) | Old: streaming counter. New: likely a simple `len(df[mask])` |
| `autotagging.py` → `apply_auto_tagging()` | 72 | **NEEDS AUDIT** — check if ported | Old: loads rules from AT, applies regex-like matching. Must verify presence in new `to_dp.py` |
| `autocomplete.py` → `operator()` | 217 | `autocomplete/generate.py` → `generate_autocomplete()` | Complete decomposition into subpackage |
| `autocomplete.py` → `TEMPLATES` (10 templates) | 11 | `autocomplete/vars.py` → `TEMPLATES` | Identical list |
| `autocomplete.py` → `IGNORE_SITUATIONS`, `STOP_WORDS` | 8 | `autocomplete/vars.py` → `IGNORE_SITUATIONS`, `STOP_WORDS` | `STOP_WORDS` now `frozenset`, `IGNORE_SITUATIONS` now `frozenset` |
| `autocomplete.py` → `unwind_templates()` | ~80 | `autocomplete/expansion/card_expander.py` → `expand_card()` | Old: streaming generator over rows. New: per-card function returning row list |
| `autocomplete.py` → validation logic (situation depth, org_id regex, city regex) | ~20 | `autocomplete/expansion/validation.py` → `is_valid_combination()` | Old: inline in `unwind_templates()`. New: extracted validation function |
| `autocomplete.py` → `prepare_locations()` | ~15 | `autocomplete/locations/download.py` → `prepare_locations()` | Same logic: download zip, parse with dataflows |
| `autocomplete.py` → dedup by query + scoring | ~30 | `autocomplete/scoring/deduplication.py` + `score_calculator.py` | Old: `DF.join_with_self` + inline scoring. New: pandas groupby + dedicated functions |
| `to_es.py` → `operator()` | 319 | `to_es.py` → `load_all_indexes()` | Old: 6 separate `*_flow()` functions each calling `dump_to_es_and_delete()`. New: 6 `load_*()` functions each calling `atomic_swap_index()` |
| `to_es.py` → `data_api_es_flow()` | ~40 | `to_es.py` → `load_cards()` | Old: DF schema annotations + `dump_to_es_and_delete()`. New: pandas + `atomic_swap_index()` |
| `to_es.py` → `card_score()` | 30 | `helpers.py` → `card_score()` | Extracted to shared location |
| `to_es.py` → `load_locations_to_es_flow()` | ~30 | `to_es.py` → `load_places()` + `PREDEFINED_PLACES` | Same logic, same predefined regions |
| `to_es.py` → `load_responses_to_es_flow()` | ~30 | `to_es.py` → `load_responses()` | Old: `DF.join_with_self` for counting. New: `pd.Series.value_counts()` + `pd.merge()` |
| `to_es.py` → `load_situations_to_es_flow()` | ~30 | `to_es.py` → `load_situations()` | Mirror of responses pattern |
| `to_es.py` → `load_organizations_to_es_flow()` | ~20 | `to_es.py` → `load_organizations()` | Old: `DF.join_with_self` + `DF.sort_rows`. New: `groupby().size()` + `sort_values()` |
| `to_es.py` → `load_autocomplete_to_es_flow()` | ~15 | `to_es.py` → `load_autocomplete()` | Old: loads from disk dump. New: receives DataFrame directly |

### Shared / Utility Mapping

| Old File / Function | New Location | Change Type |
|---------------------|-------------|-------------|
| `helpers.py` → `transform_urls()` (L24–29) | `derive_es/helpers.py` → `transform_urls()` | Direct port — identical logic |
| `helpers.py` → `transform_phone_numbers()` (L32–55) | `derive_es/helpers.py` → `transform_phone_numbers()` | Direct port — identical logic |
| `helpers.py` → `calc_point_id()` (L58–59) | `derive_es/helpers.py` → `calc_point_id()` | Direct port |
| `helpers.py` → `calculate_branch_short_name()` (L62–66) | `derive_es/helpers.py` → `calculate_branch_short_name()` | Direct port |
| `helpers.py` → `validate_geometry()` (L69–75) | `derive_es/helpers.py` → `validate_geometry()` | Direct port — same bounds check |
| `helpers.py` → `validate_address()` (L78–81) | `derive_es/helpers.py` → `validate_address()` | Direct port |
| `helpers.py` → `filter_dummy_data()` (L84–85) | `derive_es/to_dp.py` → `_filter_dummy()` | Inlined into preprocessing |
| `helpers.py` → `filter_active_data()` (L88–92) | `derive_es/to_dp.py` → `_filter_active()` | Inlined into preprocessing |
| `helpers.py` → `set_staging_pkey()` (L94–95) | `derive_es/to_dp.py` → `_set_key()` | Inlined; renames `_airtable_id` → `key` |
| `helpers.py` → `update_taxonomy_with_parents()` (L97+) | `derive_es/helpers.py` → `update_taxonomy_with_parents()` | Direct port |
| `helpers.py` → `Stats` class usage | Removed in new code | Old used `srm_tools.stats.Stats` for filter-with-stat logging; new uses plain pandas filtering |
| `es_schemas.py` → all schema dicts | `derive_es/es_mappings.py` → explicit ES mapping dicts | **Major change:** Old used `dataflows_elasticsearch` auto-mapping driven by schema annotations. New uses hand-written ES mapping dicts. Requires careful comparison. |
| `es_utils.py` → `es_instance()` | `derive_es/es_utils.py` → `es_instance()` | Refactored to singleton pattern |
| `es_utils.py` → `dump_to_es_and_delete()` | `derive_es/es_utils.py` → `atomic_swap_index()` | Old: `dump_to_es()` (dataflows) + `DF.finalizer(deleter)` + `time.sleep(30)`. New: `bulk_index_dataframe()` + `es.indices.refresh()` + `delete_old_revision()` |
| `es_utils.py` → `SRMMappingGenerator` | `derive_es/es_mappings.py` → hand-written mapping dicts | Old: dynamic type conversion generating mappings. New: explicit Python dicts per index. **Critical audit target.** |
| `__init__.py` → `deriveData()` orchestrator | Split: `derive_curation/__init__.py` + `derive_es/__init__.py` | Old: sequential 5-stage call. New: two independent operators |

### Unmapped / Potentially Missing

| Old Code | Status | Action Required |
|----------|--------|-----------------|
| `to_sql.py` → `cards_to_at_flow()` | **Not ported to either new operator** | Must verify: is card→AT writeback needed? If yes, add to derive_es after to_dp. |
| `autotagging.py` → `apply_auto_tagging()` | **Must verify presence in new to_dp.py** | Search for auto-tagging logic in derive_es/to_dp.py |
| `manual_fixes.py` → `finalize()` (write fix status back to AT) | **Must verify in new code** | Old writes fix usage stats back. Check if new `apply_manual_fixes()` does same. |
| `helpers.py` → `address_parts()`, `org_name_parts()`, `remove_whitespaces()`, `most_common_category()` | Listed in new helpers.py imports | Verify they exist and match old logic |
| Old `from_curation.py` → `CHECKPOINT` disk persistence | Removed by design | Confirm no side effects from removal |
| Old `to_dp.py` → `CHECKPOINT` + `DF.dump_to_path()` (5 sub-flows) | Removed by design | Confirm to_es.py no longer reads from disk dumps |
| Old `to_es.py` → stale data cleanup (`shutil.rmtree` for place_data, etc.) | Not needed in new code | Confirm no leftover disk paths referenced |

## Comparison Architecture

### Audit Structure

Each comparison unit produces a finding stored in `.planning/phases/NNN/findings/`:

```
.planning/phases/NNN/
├── PLAN.md
├── findings/
│   ├── from_curation.md       # Operator A: curation pipeline
│   ├── manual_fixes.md        # Operator A: fix application
│   ├── to_dp.md               # Operator B: denormalization
│   ├── autocomplete.md        # Operator B: suggestion generation
│   ├── to_es.md               # Operator B: ES index loading
│   ├── helpers.md             # Shared: pure transform functions
│   ├── es_mappings.md         # Shared: ES schema/mapping comparison
│   └── integration.md         # Cross-module: orchestration + data flow
```

### Finding Template

Each finding file follows this structure:

```markdown
## Module: <name>
**Old:** derive/<file>.py (<LOC> lines)
**New:** derive_<x>/<path> (<LOC> lines)
**Verdict:** MATCH / GAP / DIVERGENCE

### Logic Paths Compared
- [ ] Path 1: <description> — MATCH/GAP
- [ ] Path 2: <description> — MATCH/GAP

### Gaps Found
| # | Description | Severity | Location |
|---|-------------|----------|----------|

### Notes
<free text>
```

### Comparison Method Per Module

| Module | Method | What to Compare |
|--------|--------|-----------------|
| from_curation | Side-by-side code review | Filter conditions, field lists, processing order, AT write targets |
| manual_fixes | Function-level diff | Fix application logic, field matching, `current_value == '*'` wildcard, finalize writeback |
| to_dp | Stage-by-stage trace | Load → preprocess → join → denormalize → computed fields. Match intermediate shapes. |
| autocomplete | Template-by-template | 10 templates × expansion logic × dedup × scoring. Match output schema. |
| to_es | Index-by-index | 6 indexes × field mappings × scoring × atomic swap behavior |
| helpers | Function-by-function | Each pure function: input/output contract, edge cases |
| es_mappings | Field-by-field | Old auto-generated mapping vs new hand-written mapping for all 6 indexes |

## Recommended Comparison Order

Dependencies flow downward — compare upstream modules first to build confidence before tackling downstream consumers.

```
Phase 1: Foundation (no dependencies)
  ├── 1a. helpers.py comparison          (pure functions, no side effects)
  ├── 1b. es_mappings comparison         (static config, no runtime deps)
  └── 1c. es_utils comparison            (ES client + atomic swap pattern)

Phase 2: Operator A (depends on: helpers for AIRTABLE_ID_FIELD)
  ├── 2a. filtering (record_filter + mark_undecided + manual_fixes)
  ├── 2b. mapping (id_mapping + reference_remapper)
  └── 2c. upsert (orgs → branches → services) + pipeline.py orchestration

Phase 3: Operator B / Denormalization (depends on: helpers)
  └── 3a. to_dp.py — full stage-by-stage comparison
         (largest module, highest risk, most business logic)

Phase 4: Operator B / Autocomplete (depends on: to_dp output)
  ├── 4a. vars.py — constants match
  ├── 4b. expansion/ — template expansion logic
  ├── 4c. locations/ — bounds resolution
  └── 4d. scoring/ — dedup + score calculation

Phase 5: Operator B / ES Loading (depends on: to_dp + autocomplete + es_mappings)
  └── 5a. to_es.py — all 6 index load functions

Phase 6: Cross-cutting (depends on: all above)
  ├── 6a. Orchestration — old __init__.py vs new __init__.py × 2
  ├── 6b. cards_to_at — verify to_sql.py port status
  └── 6c. autotagging — verify port status
```

### Rationale for Order

1. **Helpers first:** Every other module imports from helpers. If helpers diverge, all downstream comparisons are unreliable.
2. **ES mappings early:** The mapping comparison is pure config — no runtime complexity — but mapping mismatches cause silent data loss in ES. Early detection prevents wasted effort.
3. **Operator A before B:** Operator A writes to staging AT. If its output differs, Operator B reads different input and all comparisons downstream are confounded.
4. **to_dp before autocomplete/to_es:** to_dp produces `card_data` — the input for both autocomplete and to_es. Must be verified first.
5. **Cross-cutting last:** Orchestration and missing-module checks only matter once per-module correctness is established.

## Data Flow Validation Points

### Validation Point Architecture

```
                    Curation AT
                        │
          ┌─────────────┼──────────────┐
          │ OLD         │          NEW │
          ▼             ▼              ▼
   from_curation    from_curation    derive_curation
   (dataflows)      (dataflows)      (pandas)
          │                            │
          ▼                            ▼
    VP1: Staging AT ◄──── DIFF ────► VP1: Staging AT
          │                            │
          ▼                            ▼
      to_dp              to_dp
   (dataflows)          (pandas)
          │                            │
          ▼                            ▼
    VP2: card_data ◄──── DIFF ────► VP2: card_data
          │                            │
          ├──► autocomplete            ├──► autocomplete
          │    (dataflows)             │    (pandas)
          │         │                  │         │
          │         ▼                  │         ▼
          │   VP3: ac_data ◄─ DIFF ─► │   VP3: ac_data
          │                            │
          ▼                            ▼
      to_es                to_es
   (dataflows)            (pandas)
          │                            │
          ▼                            ▼
    VP4: ES indexes ◄──── DIFF ────► VP4: ES indexes
```

### Validation Points Detail

| VP | What | How to Capture (Old) | How to Capture (New) | Diff Method |
|----|------|---------------------|---------------------|-------------|
| VP1 | Staging AT state after Operator A | Read staging AT tables via `load_airtable_as_dataframe()` after old `from_curation.operator()` | Same read after new `derive_curation.operator()` | Compare DataFrames: row count, column names, field values by `id` key |
| VP2 | card_data after denormalization | Intercept: add `DF.dump_to_path('old_card_data')` after old `to_dp.operator()` | Return value of `to_dp()` → `card_data.to_parquet('new_card_data.parquet')` | Load both, compare by `card_id`: row count, column names, per-field diff |
| VP3 | autocomplete suggestions | Intercept: add dump after old `autocomplete.operator()` and load from `autocomplete/datapackage.json` | Return value of `generate_autocomplete()` | Compare by `id` or `query`: row count, score values, bounds |
| VP4 | ES index contents (all 6) | Query each index via ES API: doc count + sample docs | Same query | Per-index: doc count match, field list match, sample doc diff |

### VP4: Per-Index Validation Checklist

| ES Index | Key Fields to Diff | ID Field | Expected Source |
|----------|-------------------|----------|-----------------|
| `srm__cards` | `card_id`, `score`, `situations`, `responses`, `branch_geometry`, `airtable_last_modified` | `card_id` | card_data + scoring |
| `srm__autocomplete` | `query`, `score`, `bounds`, `response`, `situation`, `org_id` | `id` | autocomplete generation |
| `srm__responses` | `id`, `name`, `count`, `score` | `id` | card_data response_ids aggregation |
| `srm__situations` | `id`, `name`, `count`, `score` | `id` | card_data situation_ids aggregation |
| `srm__orgs` | `id`, `name`, `kind`, `count`, `score` | `id` | card_data org aggregation |
| `srm__places` | `key`, `query`, `bounds`, `score` | `key` | location bounds source file |

### Runtime Test Script Architecture

The existing `derive_es/validate.py` already provides a foundation for VP4. Extend it:

```python
# validate.py already has:
# - _doc_count(es, index)
# - _sample_docs(es, index, size)
# - _field_names(es, index)
# - _compare_docs(doc_a, doc_b)
# - validate_index(es, index)

# Extend with:
# 1. Full-scan comparison (not just samples)
# 2. VP2 support: card_data DataFrame comparison
# 3. VP3 support: autocomplete DataFrame comparison
# 4. Summary report with pass/fail per VP
```

## Integration Points to Verify

| Integration | Old Code Path | New Code Path | Risk |
|-------------|--------------|---------------|------|
| AT read (curation base) | `dataflows_airtable.load_from_airtable()` | `extract.load_airtable_as_dataframe()` | **MEDIUM** — different AT client libs may return different column types (e.g., list vs string) |
| AT write (staging base) | `srm_tools.update_table.airtable_updater()` + `fetch_mapper` + `update_mapper` | `load.airtable.update_if_exists_if_not_create()` | **HIGH** — completely different write mechanism. Must verify same records created/updated. |
| AT ID field name | `dataflows_airtable.AIRTABLE_ID_FIELD` = `"__airtable_id"` (double underscore) | `derive_es.helpers.AIRTABLE_ID_FIELD` = `"_airtable_id"` (single underscore) | **HIGH** — ID field name mismatch could break all cross-table references. Verify `load_airtable_as_dataframe()` returns which convention. |
| Manual fixes load | `load_from_airtable()` (dataflows) | `load_airtable_as_dataframe()` (pandas) | **MEDIUM** — same data, different format. Verify fix dict keys match. |
| ES client config | `elasticsearch.Elasticsearch(host, port, auth)` | Same, but singleton vs per-call | **LOW** — same constructor args |
| ES bulk indexing | `dump_to_es()` (dataflows_elasticsearch) → `SRMMappingGenerator` | `elasticsearch.helpers.bulk()` → hand-written mappings | **HIGH** — auto-generated vs hand-written mappings must be field-identical |
| ES atomic swap | `DF.finalizer(deleter)` with `time.sleep(30)` | `es.indices.refresh()` + immediate `delete_by_query()` | **MEDIUM** — timing difference; refresh should be equivalent but verify |
| Taxonomy parent expansion | `helpers.update_taxonomy_with_parents()` | Same function, ported | **LOW** — pure function, easy to unit test |

## Known Architectural Differences

| Aspect | Old (dataflows) | New (pandas) | Impact on Comparison |
|--------|----------------|-------------|---------------------|
| Processing model | Lazy streaming, row-by-row | Eager in-memory, batch | Different error propagation — old may skip bad rows silently |
| Disk persistence | 15 checkpoints (`DF.dump_to_path`, `DF.checkpoint`) | None | Old to_es reads from disk; new receives DataFrames directly. Order of operations matters. |
| Error handling | `DF.Flow` catches some errors, continues | Pandas raises immediately | New may fail on data old would skip |
| AT field types | `dataflows_airtable` normalizes types | `load_airtable_as_dataframe` returns raw | Type mismatches (str vs list, None vs []) are likely |
| Stats/logging | `srm_tools.stats.Stats.filter_with_stat()` — logs filter counts | Plain pandas — no automatic stat logging | Add explicit logging to match old observability |
| Resource naming | `DF.update_resource('name')` for ES mapping hints | Explicit mapping dicts | No functional difference, but schema annotation path is gone |

---
*Researched: 2026-03-23 — v3.0 Derive Comparison & Validation milestone*
