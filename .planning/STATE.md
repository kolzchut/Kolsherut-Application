---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Refactor Derive
status: roadmap-ready
last_updated: "2026-03-22"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** Cleaner derive pipeline using pandas, split into two operators
**Current focus:** Phase 3 — Shared Foundation

## Current Position

Phase: Phase 3 — Shared Foundation (next up)
Plan: —
Status: Roadmap ready, awaiting plan-phase
Last activity: 2026-03-22 — Requirements defined, roadmap created (5 phases, 26 requirements)

## Accumulated Context

### Roadmap Evolution

- v1.0 archived: Derive Analysis milestone complete
- v2.0 started: Refactor Derive
- v2.0 roadmap: 5 phases (3–7), 26 requirements, all mapped

### Key Context from v1.0

- DERIVE-FLOW-ANALYSIS.md documents all 5 stages, 15 persistence points
- meser/day_care operators provide pandas-based reference pattern

### Research (v2.0)

- STACK.md: No new deps — pandas, elasticsearch, pyairtable already available
- FEATURES.md: 18 table stakes to preserve, 4 improvements included
- ARCHITECTURE.md: Two-operator split, sequential DataFrame pipeline, shared infra reuse
- PITFALLS.md: 7 critical pitfalls identified (array-in-cell, AT ID mismatch, RSScoreCalc, ES mappings, autocomplete memory, swap timing, ID remapping)
- Shared infra: extract/extract_data_from_airtable.py, load/airtable.py, utilities/update.py
- AIRTABLE_BASE env var already exists for stage/prod switching

## Session Log

| Date | Session | Outcome |
|------|---------|---------|
| 2026-03-22 | Codebase mapping | 7 docs created in .planning/codebase/ |
| 2026-03-22 | v1.0 initialization | PROJECT.md, REQUIREMENTS.md, ROADMAP.md created |
| 2026-03-22 | Derive analysis | DERIVE-FLOW-ANALYSIS.md produced |
| 2026-03-22 | v2.0 start | Milestone archived, PROJECT.md evolved, requirements scoping |
