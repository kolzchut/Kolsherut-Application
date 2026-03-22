# Roadmap: Kol Sherut ETL — Derive Refactor

**Created:** 2026-03-22
**Milestone:** v2.0
**Phases:** 5 (Phase 3–7)
**Status:** Active

## Overview

Rebuild the derive operator from `dataflows` streaming to pandas batch processing, split into two independent operators (Operator A: AT Writer, Operator B: ES Pipeline), eliminate all 15 caching/checkpoint points, and validate identical ES output. Builds on the v1.0 analysis (DERIVE-FLOW-ANALYSIS.md) and follows the meser/day_care pandas pattern already in the codebase.

## Phases

**Phase Numbering:**
- Continues from v1.0 (Phases 1–2 archived)
- Integer phases (3, 4, 5, 6, 7): Planned milestone work
- Decimal phases (e.g., 5.1): Urgent insertions if needed

- [ ] **Phase 3: Shared Foundation** - ES utilities, explicit mappings, pure helpers, operator scaffolding
- [ ] **Phase 4: Operator B — Data Pipeline** - Rewrite to_dp denormalization in pandas
- [ ] **Phase 5: Operator B — Autocomplete & ES** - Autocomplete generation + 6 ES index loads
- [ ] **Phase 6: Operator A — Curation & Cards** - Rewrite from_curation + cards-to-AT in pandas
- [ ] **Phase 7: Validation & Deployment** - Automated ES comparison + operator registration

## Phase Details

### Phase 3: Shared Foundation
**Goal**: Create all shared infrastructure needed by both operators — ES bulk utilities, explicit mapping dicts, ported pure helpers, two operator directory scaffolds, AT ID standardization
**Depends on**: Nothing (first v2.0 phase)
**Requirements**: MIG-01, MIG-02, MIG-04, ES-01, ES-02, ES-03, ES-04, SPLIT-01, SPLIT-04
**Success Criteria** (what must be TRUE):
  1. `derive_curation/` and `derive_es/` directories exist with `__init__.py` entry points
  2. `bulk_index_dataframe()` function can index a test DataFrame to ES with revision-based atomic swap
  3. All 6 ES index mapping dicts defined and match current production mappings
  4. All pure helpers importable from new location (taxonomy, phone, URL, address, scoring)
  5. `_airtable_id` standardized in all new code
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 3 to break down)

### Phase 4: Operator B — Data Pipeline (to_dp)
**Goal**: Rewrite the complete to_dp denormalization pipeline in pandas — pull 6 AT tables, 4-stage join, branch/service dedup, taxonomy, auto-tagging, manual fixes, RS scoring → card_data DataFrame
**Depends on**: Phase 3
**Requirements**: MIG-01, MIG-03, SPLIT-03, DP-01, DP-02, DP-03, DP-04, DP-05, DP-06, DP-07, DP-08
**Success Criteria** (what must be TRUE):
  1. `to_dp()` function returns a pandas DataFrame with all card_data columns
  2. Branch deduplication produces same branch count as current pipeline
  3. Taxonomy normalization and parent expansion produce identical ID sets
  4. RS scoring produces same situation ordering per card (spot-check 100 cards)
  5. No dataflows imports in any Phase 4 code
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 4 to break down)

### Phase 5: Operator B — Autocomplete & ES Loading
**Goal**: Rewrite autocomplete generation (10 templates, cartesian expansion, city bounds, scoring) and all 6 ES index loads using the Phase 3 bulk utilities
**Depends on**: Phase 4
**Requirements**: MIG-03, SPLIT-03, AC-01, AC-02, AC-03, AC-04
**Success Criteria** (what must be TRUE):
  1. Autocomplete generates same number of suggestions (±5%) as current pipeline
  2. All 6 ES indexes loaded via `bulk_index_dataframe()` with atomic swap
  3. Cards-to-AT writes 8 fields to AIRTABLE_CARDS_TABLE
  4. `derive_es/operator()` runs end-to-end: to_dp → autocomplete → to_es → cards_to_at
  5. Memory usage stays under 4GB during autocomplete cartesian expansion
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 5 to break down)

### Phase 6: Operator A — Curation & Cards
**Goal**: Rewrite from_curation pipeline in pandas — filter curated records, apply manual fixes, remap cross-table IDs, write orgs→branches→services to staging AT
**Depends on**: Phase 3 (shared helpers + AT utilities)
**Requirements**: MIG-01, MIG-03, SPLIT-02, CUR-01, CUR-02, CUR-03, CUR-04, CUR-05
**Success Criteria** (what must be TRUE):
  1. `derive_curation/operator()` filters and copies records from curation to staging AT
  2. Manual fixes applied and status written back
  3. Cross-table ID remapping correct (orgs→branches→services chain)
  4. Cards-to-AT writes 8 card fields from card_data
  5. AIRTABLE_BASE env var determines write target (verified on stage)
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 6 to break down)

### Phase 7: Validation & Deployment
**Goal**: Automated comparison of all 6 ES indexes between old and new pipeline, register both operators with scheduler, document the migration
**Depends on**: Phase 5, Phase 6
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. Comparison script reports field-level diff for all 6 indexes
  2. Zero unexpected differences between old and new pipeline output
  3. Both operators registered in Cronicle/scheduler
  4. README or migration doc explains the two-operator setup
**Plans**: TBD

Plans:
- [ ] TBD (run /gsd-plan-phase 7 to break down)

## Progress

**Execution Order:**
Phase 3 → 4 → 5 → 6 → 7 (Phase 6 can start after Phase 3 if Phase 4/5 are in progress)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Shared Foundation | 0/TBD | Not started | - |
| 4. Operator B — Data Pipeline | 0/TBD | Not started | - |
| 5. Operator B — Autocomplete & ES | 0/TBD | Not started | - |
| 6. Operator A — Curation & Cards | 0/TBD | Not started | - |
| 7. Validation & Deployment | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-03-22*
