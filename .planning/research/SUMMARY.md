# Project Research Summary

**Project:** Kol Sherut ETL — Derive Refactor
**Domain:** Python ETL pipeline refactor (dataflows → pandas)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

The derive operator refactor is a well-scoped brownfield migration from the `dataflows` streaming framework to pandas-based batch processing. All required libraries are already in `requirements.txt` — no new dependencies needed. The core challenge is extracting business logic from 12 dataflows-coupled files into two independent pandas-based operators while preserving identical ES index output.

The recommended approach follows the meser/day_care operator pattern already established in the codebase: load Airtable tables as DataFrames, transform via pandas merge/join/apply, write results via shared infra (`update_if_exists_if_not_create`, `elasticsearch.helpers.bulk`). The architecture splits into Operator A (AT Writer: from_curation + to_sql) and Operator B (ES Pipeline: to_dp + autocomplete + to_es).

Key risks center on array-in-cell handling during pandas merges, ES mapping completeness when switching from auto-generated to explicit mappings, and memory management during autocomplete cartesian expansion. All risks are mitigatable with known patterns.

## Key Findings

### Recommended Stack

No new dependencies required. The existing `requirements.txt` already contains everything needed.

**Core technologies:**
- **pandas 2.2.3**: All denormalization logic — replace `DF.join/DF.Flow` with `pd.merge/pd.concat`
- **elasticsearch 7.13.4**: Direct `helpers.bulk()` for all 6 ES index loads — replace `dataflows_elasticsearch`
- **pyairtable 3.1.1**: Via existing `load_airtable_as_dataframe()` — replace `load_from_airtable`

**What to drop** (from derive operator imports, not from requirements.txt):
- `dataflows`, `dataflows_airtable`, `dataflows_elasticsearch`, `tableschema_elasticsearch`

### Expected Features

**Must preserve (18 table stakes):**
- 6-table Airtable pull + 4-stage denormalization → card_data
- Branch/service deduplication (fuzzy matching, hash-based)
- Taxonomy normalization + parent expansion
- Auto-tagging + manual fixes
- RS relevance scoring (IDF-based situation pruning)
- 10-template autocomplete with city bounds
- 6 ES index loads with revision-based atomic swap
- Curation copy pipeline (from_curation) with ID remapping
- Cards-to-AT write (8 fields)

**Improvements included:**
- Explicit ES mappings (more maintainable)
- Zero checkpoint overhead (faster execution)
- Independent operator execution

### Architecture Approach

Two new operator directories alongside the preserved old `derive/` directory. Operator A (`derive_curation/`) handles the curation→staging AT copy. Operator B (`derive_es/`) runs the full ES pipeline: to_dp → autocomplete → to_es → cards_to_at. Both share existing infrastructure modules.

**Major components:**
1. **Operator A** — filter, fix, remap IDs, write to staging AT (3 tables)
2. **Operator B** — pull 6 AT tables, denormalize, autocomplete, load 6 ES indexes, write cards to AT
3. **Shared infra** — `extract/`, `load/`, `utilities/`, `srm_tools/` (unchanged)
4. **Refactored ES utils** — `bulk_index_dataframe()` + `delete_old_revision()` replacing `dump_to_es_and_delete()`

### Critical Pitfalls

1. **Array-in-cell handling** — Explode before merge, reaggregate after. Use `isinstance(v, list)` before `pd.isna()`. Cast numpy types before ES serialization.
2. **Airtable ID field mismatch** — Standardize on `_airtable_id` (single underscore), search-replace `__airtable_id`.
3. **RSScoreCalc extraction** — Two-pass pandas pattern: explode→groupby→count first, then score/prune per row.
4. **ES mapping completeness** — Translate every `es_schemas.py` constant to explicit mapping dict. Validate against current index mappings.
5. **Autocomplete memory** — Process in chunks or use generator→DataFrame pattern to avoid cartesian explosion.

## Implications for Roadmap

### Phase 1: Shared Foundation
**Rationale:** Establish common patterns before building either operator
**Delivers:** ES bulk utilities, explicit mapping dicts, ported pure helpers, operator directory scaffolding
**Addresses:** ES mapping completeness, AT ID standardization, revision-based swap timing
**Avoids:** Pitfalls 2 (ID mismatch), 4 (mapping completeness), 6 (swap timing)

### Phase 2: Operator B — Data Pipeline (to_dp)
**Rationale:** Biggest and most complex piece — 946 lines, 5 sub-flows, core of the system
**Delivers:** Complete denormalization from 6 AT tables to card_data DataFrame
**Addresses:** All transform features, RS scoring, taxonomy, auto-tagging, manual fixes
**Avoids:** Pitfalls 1 (array-in-cell), 3 (RSScoreCalc extraction)

### Phase 3: Operator B — Autocomplete & ES Loading
**Rationale:** Depends on card_data from Phase 2; autocomplete + ES loading are tightly coupled
**Delivers:** Autocomplete generation + all 6 ES index loads
**Addresses:** 10-template generation, city bounds, 6 atomic swap loads
**Avoids:** Pitfall 5 (cartesian explosion)

### Phase 4: Operator A — Curation & Cards
**Rationale:** Independent from Operator B; complex AT logic with ID remapping
**Delivers:** from_curation pipeline + cards-to-AT write
**Addresses:** Curation copy, manual fixes, ID remapping, cards write
**Avoids:** Pitfall 7 (cross-table ID remapping)

### Phase 5: Validation & Cleanup
**Rationale:** End-to-end verification before shipping
**Delivers:** Behavior comparison, operator registration, documentation
**Addresses:** Confidence that ES output is identical
**Avoids:** Shipping broken pipeline to production

---
*Synthesized: 2026-03-22*
