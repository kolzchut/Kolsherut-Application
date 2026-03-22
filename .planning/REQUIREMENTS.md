# Requirements: Kol Sherut ETL — Derive Refactor

**Defined:** 2026-03-22
**Core Value:** Cleaner derive pipeline using pandas, split into two operators

## v2.0 Requirements

Requirements for the derive operator refactor. Each maps to roadmap phases.

### Framework Migration

- [ ] **MIG-01**: All derive logic uses pandas DataFrames instead of dataflows DF.Flow
- [ ] **MIG-02**: All Airtable reads use `load_airtable_as_dataframe()` instead of `load_from_airtable`
- [ ] **MIG-03**: All 15 checkpoint/dump_to_path persistence points are eliminated
- [ ] **MIG-04**: Airtable ID field standardized to `_airtable_id` (single underscore)

### ES Loading

- [ ] **ES-01**: Bulk indexing uses `elasticsearch.helpers.bulk()` directly
- [ ] **ES-02**: All 6 ES indexes have explicit Python dict mappings (replacing SRMMappingGenerator)
- [ ] **ES-03**: Revision-based atomic swap uses `es.indices.refresh()` instead of `sleep(30)`
- [ ] **ES-04**: Hebrew analyzer (ICU tokenizer + folding) preserved in explicit mappings

### Operator Split

- [ ] **SPLIT-01**: Two independent operators exist: `derive_curation` and `derive_es`
- [ ] **SPLIT-02**: Operator A (derive_curation) handles from_curation + cards-to-AT
- [ ] **SPLIT-03**: Operator B (derive_es) handles to_dp + autocomplete + to_es
- [ ] **SPLIT-04**: Both operators read `AIRTABLE_BASE` env var for stage/prod targeting

### Data Pipeline

- [ ] **DP-01**: 6 Airtable tables pulled and denormalized into card_data via pandas merges
- [ ] **DP-02**: Branch deduplication by (org, geometry, name) hash preserved
- [ ] **DP-03**: Service deduplication (implementing vs raw) preserved
- [ ] **DP-04**: Taxonomy normalization + parent expansion preserved
- [ ] **DP-05**: Auto-tagging rules applied (loaded from AT, matched per row)
- [ ] **DP-06**: Manual fixes applied (loaded from AT, field-level overrides)
- [ ] **DP-07**: RS relevance scoring (IDF-based situation pruning) preserved
- [ ] **DP-08**: Card scoring for ES search ranking preserved

### Autocomplete

- [ ] **AC-01**: 10-template autocomplete generation from card_data
- [ ] **AC-02**: Cartesian expansion with filtering (ignore situations, shallow IDs, validation)
- [ ] **AC-03**: City bounds via fuzzy geo-matching preserved
- [ ] **AC-04**: Score computation (log-count squared) preserved

### Curation

- [ ] **CUR-01**: Curation records filtered (ACTIVE, not Rejected/Suspended)
- [ ] **CUR-02**: Manual fixes applied during curation copy
- [ ] **CUR-03**: Cross-table ID remapping preserved (curation→staging AT IDs)
- [ ] **CUR-04**: Cards written back to AT Cards table (8 fields)
- [ ] **CUR-05**: AIRTABLE_BASE controls write target (stage vs prod) — safety noted

### Validation

- [ ] **VAL-01**: Automated comparison script for all 6 ES indexes
- [ ] **VAL-02**: Document-level diff between old and new pipeline output
- [ ] **VAL-03**: Both operators registered and callable by scheduler

## Future Requirements

### Testing

- **TEST-01**: Unit tests for all pure transform functions
- **TEST-02**: Integration tests with Airtable sandbox

### Cleanup

- **CLEAN-01**: Remove dead code paths (dump_to_sql_flow, relational_sql_flow) after stakeholder sign-off
- **CLEAN-02**: Remove old `derive/` directory after validation period

## Out of Scope

| Feature | Reason |
|---------|--------|
| Refactoring dead code (dump_to_sql, relational_sql) | Explicit user requirement — leave as-is |
| Frontend or backend changes | ETL-only refactor |
| Other ETL operators (geocode, deploy, meser, day_care) | Focus on derive only |
| Adding new functionality to derive | Behavior-preserving refactor |
| New dependencies | All libs already in requirements.txt |
| Removing old derive/ directory | Keep until validation period complete |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | Phase 1, 2, 3, 4 | Pending |
| MIG-02 | Phase 1 | Pending |
| MIG-03 | Phase 2, 3, 4 | Pending |
| MIG-04 | Phase 1 | Pending |
| ES-01 | Phase 1 | Pending |
| ES-02 | Phase 1 | Pending |
| ES-03 | Phase 1 | Pending |
| ES-04 | Phase 1 | Pending |
| SPLIT-01 | Phase 1 | Pending |
| SPLIT-02 | Phase 4 | Pending |
| SPLIT-03 | Phase 2, 3 | Pending |
| SPLIT-04 | Phase 1 | Pending |
| DP-01 | Phase 2 | Pending |
| DP-02 | Phase 2 | Pending |
| DP-03 | Phase 2 | Pending |
| DP-04 | Phase 2 | Pending |
| DP-05 | Phase 2 | Pending |
| DP-06 | Phase 2 | Pending |
| DP-07 | Phase 2 | Pending |
| DP-08 | Phase 2 | Pending |
| AC-01 | Phase 3 | Pending |
| AC-02 | Phase 3 | Pending |
| AC-03 | Phase 3 | Pending |
| AC-04 | Phase 3 | Pending |
| CUR-01 | Phase 4 | Pending |
| CUR-02 | Phase 4 | Pending |
| CUR-03 | Phase 4 | Pending |
| CUR-04 | Phase 4 | Pending |
| CUR-05 | Phase 4 | Pending |
| VAL-01 | Phase 5 | Pending |
| VAL-02 | Phase 5 | Pending |
| VAL-03 | Phase 5 | Pending |

**Coverage:**
- v2.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after v2.0 milestone initialization*
