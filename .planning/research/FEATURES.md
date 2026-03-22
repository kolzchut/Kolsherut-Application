# Feature Research

**Domain:** ETL derive operator refactor (dataflows → pandas, split operators)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Must Preserve — Existing Behavior)

Features that currently work and must produce identical output after refactor.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 6-table Airtable pull | Core data source for all card generation | LOW | Replace `load_from_airtable` with `load_airtable_as_dataframe` |
| 4-stage denormalization (branches→services→flat→cards) | Produces the card_data table that feeds everything | HIGH | 4 sequential pandas merge/join operations with array explode/reaggregate |
| Branch deduplication by (org, geometry, name) hash | Prevents duplicate branches in search results | MEDIUM | Fuzzy matching at 80% threshold via thefuzz |
| Service deduplication (implementing vs raw) | Merges implementing services with their raw source | MEDIUM | Sort + filter pattern, extractable from dataflows |
| Taxonomy normalization (situations + responses) | Maps IDs to canonical forms, expands parents | LOW | Pure functions: `normalize_taxonomy_ids`, `update_taxonomy_with_parents` |
| Auto-tagging (rule-based situation/response tagging) | Enriches cards with taxonomy tags based on text matching | LOW | Rule-loading from AT + pure row-by-row matching |
| Manual fixes system | Applies field-level overrides from Airtable fixes table | MEDIUM | Rule-loading from AT + field matching logic |
| RS relevance scoring (IDF-based pruning) | Ranks situations by information value, prunes low-scoring | HIGH | `RSScoreCalc` class is dataflows-coupled, math is extractable |
| Card scoring for ES search ranking | Determines search result ordering | LOW | `card_score()` is pure function |
| 10-template autocomplete generation | Provides search suggestions in Hebrew | HIGH | Cartesian product expansion + deduplication + scoring |
| Autocomplete city bounds (fuzzy geo-matching) | Adds geographic bounds to location-based suggestions | MEDIUM | HTTP download + fuzzy match via thefuzz |
| 6 ES index loads with revision-based atomic swap | Atomic index replacement ensures consistency | MEDIUM | Replace `dump_to_es_and_delete` with `elasticsearch.helpers.bulk()` + delete_by_query |
| Hebrew analyzer (ICU tokenizer + folding) | Proper Hebrew text search in ES | LOW | Explicit mapping dict replaces `SRMMappingGenerator` |
| Israel bounding box geometry validation | Ensures coordinates are within Israel | LOW | Pure function: `validate_geometry()` |
| Phone number normalization | Formats Israeli phone numbers consistently | LOW | Pure function: `transform_phone_numbers()` |
| Address parsing (city/street split) | Structured address for display | LOW | Pure function: `address_parts()` with fuzzy matching |
| Org name cleaning (removes legal suffixes) | Clean display names | LOW | Pure function: `clean_org_name()` |
| Curation copy pipeline (from_curation) | Copies curated records to staging with filtering, fixes, ID remapping | HIGH | Multiple tables, filter chains, cross-table ID remapping |
| Cards to Airtable (to_sql) | Writes 8 card fields back to AT Cards table | LOW | Simple `airtable_updater()` call with 8 fields |

### Differentiators (Could Improve During Refactor)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explicit ES mappings | More maintainable than auto-generated mappings | LOW | Define once as Python dicts from es_schemas.py constants |
| No checkpoint overhead | Faster pipeline execution (eliminates 15 disk persistence points) | LOW | Just keep DataFrames in memory |
| Independent operator execution | Can run AT writer or ES pipeline separately | LOW | Two separate `__init__.py` entry points |
| Env-based AT targeting | Single `AIRTABLE_BASE` var switches stage/prod | LOW | Already exists |

### Anti-Features (Avoid During Refactor)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Intermediate disk caching | "What if pipeline fails midway?" | 15 persistence points add complexity, stale data risk | Re-run from start (pipeline is <10min) |
| SQL database loading | dump_to_sql_flow exists but is dead code | Adds complexity, not used by any consumer | Leave dead code untouched |
| Relational SQL flow | relational_sql_flow exists but is dead code | Same as above | Leave dead code untouched |

## Feature Dependencies

```
load_airtable_as_dataframe (shared)
    └──feeds──> Operator A (from_curation reads AT, writes AT)
    └──feeds──> Operator B (to_dp reads 6 AT tables)

card_data (produced by to_dp)
    └──feeds──> autocomplete (generates suggestions from cards)
    └──feeds──> to_es/srm__cards (loads card index)
    └──feeds──> to_es/srm__responses (counts per response)
    └──feeds──> to_es/srm__situations (counts per situation)
    └──feeds──> to_es/srm__orgs (counts per org)
    └──feeds──> to_sql (writes 8 fields back to AT)

autocomplete (produced by autocomplete.py)
    └──feeds──> to_es/srm__autocomplete (loads autocomplete index)

Operator A (from_curation) ──independent──> Operator B (to_dp+autocomplete+to_es)
    Note: Operator B reads from AT that Operator A has populated
```

### Dependency Notes

- **Operator A must run before Operator B:** A populates the staging AT base that B reads from
- **to_dp must complete before autocomplete:** Autocomplete generates from card_data
- **to_dp + autocomplete must complete before to_es:** ES loading needs both card_data and autocomplete data
- **to_sql depends on to_dp:** Writes card fields that to_dp produced

## MVP Definition (This Milestone)

### Launch With (v2.0)

- [x] All 18 table stakes features preserved with identical output
- [x] 4 differentiators implemented (explicit mappings, no checkpoints, split operators, env-based)
- [x] 3 anti-features avoided (no caching, no SQL, no relational)

### Future Consideration (v3+)

- [ ] Add unit tests for transform functions
- [ ] Add integration tests comparing ES output before/after
- [ ] Remove dead code paths (dump_to_sql, relational_sql) if stakeholders agree

---
*Researched: 2026-03-22*
