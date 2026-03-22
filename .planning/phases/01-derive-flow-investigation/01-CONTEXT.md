# Phase 1: Derive Flow Investigation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deeply analyze the `dataflows` Python package and the `derive` operator in the Kol Sherut ETL pipeline. Produce a comprehensive markdown document explaining the exact execution flow, detailing how every `DF.*` process works, where checkpoints/caching happen, and how the 5 sequential stages transform data from Airtable curation to Elasticsearch indexes. This is an investigative spike — no code changes.

</domain>

<decisions>
## Implementation Decisions

### Source Access Strategy
- **D-01:** Git clone the dataflows repository into `_analysis_temp/` folder so all source is directly readable without venv/.gitignore issues
- **D-02:** Clone only the core `dataflows` package — extensions (dataflows-airtable, dataflows-elasticsearch) are thin wrappers and don't need cloning

### Document Structure & Format
- **D-03:** Top-down approach — start from the derive execution flow, explain dataflows concepts inline as they appear (not a separate section)
- **D-04:** Use Mermaid diagrams for high-level pipeline flow (renders in GitHub/VS Code), ASCII for inline step details where Mermaid gets too verbose
- **D-05:** Every `DF.*` process call gets an explanation of what it does and why — not field-by-field, but every dataflows operation is covered

### External Dependency Scope
- **D-06:** Surface-level treatment of externals — note what each `srm_tools`, `conf.settings`, and Airtable call does in one line, but don't trace into their source code

### Checkpoint Documentation
- **D-07:** Document where checkpoints are placed and what data they cache — locations and cached content only, skip serialization format internals (NDJSON mechanics)

### Agent's Discretion
- Diagram style choice (Mermaid vs ASCII) per section — use whichever renders better for that specific content
- How to organize the 5 nested sub-flows in `to_dp.py` — as sections, collapsible blocks, or sequential headings

</decisions>

<specifics>
## Specific Ideas

- User's primary blocker is the `dataflows` package — they can read Python but the Flow/checkpoint/processor chaining is opaque
- The document should make a developer who's never seen `dataflows` understand what every line in derive is doing
- User said: "I want to understand exactly how this operator works, but I can't read it because of the dataflows package"

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Derive Operator Source
- `ETL/data/plugins/srm-etl/operators/derive/__init__.py` — Orchestrator, runs 5 stages in order
- `ETL/data/plugins/srm-etl/operators/derive/__main__.py` — CLI entry point
- `ETL/data/plugins/srm-etl/operators/derive/to_dp.py` — Core data transformation (946 lines, 5 sub-flows, 2 checkpoints)
- `ETL/data/plugins/srm-etl/operators/derive/to_es.py` — Elasticsearch loading (6 indexes, 1 checkpoint)
- `ETL/data/plugins/srm-etl/operators/derive/from_curation.py` — Airtable curation copy (dump_to_path cache)
- `ETL/data/plugins/srm-etl/operators/derive/autocomplete.py` — Autocomplete generation
- `ETL/data/plugins/srm-etl/operators/derive/to_sql.py` — Airtable card upload
- `ETL/data/plugins/srm-etl/operators/derive/helpers.py` — Shared preprocessing flows (389 lines)
- `ETL/data/plugins/srm-etl/operators/derive/autotagging.py` — Auto-tagging rules from Airtable
- `ETL/data/plugins/srm-etl/operators/derive/es_schemas.py` — ES field schema constants
- `ETL/data/plugins/srm-etl/operators/derive/es_utils.py` — ES connection + custom mapping generator
- `ETL/data/plugins/srm-etl/operators/derive/manual_fixes.py` — Manual fix application from Airtable

### Codebase Maps
- `.planning/codebase/STACK.md` — ETL stack details (Python, dataflows, dependencies)
- `.planning/codebase/ARCHITECTURE.md` — ETL architecture and data flow diagram
- `.planning/codebase/INTEGRATIONS.md` — External service integrations

### Dataflows Source (to be cloned)
- `_analysis_temp/dataflows/` — Core dataflows package source (to be git-cloned)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Codebase mapping in `.planning/codebase/` — already documents ETL stack and architecture at a high level
- Python venv already created at `ETL/.venv/` with all requirements installed

### Established Patterns
- Derive uses 5 sequential stages: `from_curation` → `to_dp` → `autocomplete` → `to_es` → `to_sql`
- `to_dp.py` is the core with 5 nested sub-flows: `srm_data_pull` → `flat_branches` → `flat_services` → `flat_table` → `card_data`
- 4 checkpoint/cache patterns found across the pipeline
- Heavy use of `DF.Flow`, `DF.checkpoint`, `DF.join`, `DF.load`, `DF.dump_to_path`

### Integration Points
- `conf.settings` provides all configuration (Airtable bases, ES connection, paths)
- `srm_tools.*` provides shared processors, stats, logging, hashing
- `dataflows_airtable` and `dataflows_elasticsearch` are the I/O extensions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-derive-flow-investigation*
*Context gathered: 2026-03-22*
