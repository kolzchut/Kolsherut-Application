# Phase 1: Derive Flow Investigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-derive-flow-investigation
**Areas discussed:** Source access strategy, Document depth & format, External dependency scope, Checkpoint deep-dive scope

---

## Source Access Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| pip install --target | Run pip install dataflows --target=_analysis_temp/ — clean copy, no venv issues | |
| Git clone repo | Git clone the dataflows repo into _analysis_temp/ — gets tests and docs too | ✓ |
| Read from venv directly | Can already read from ETL/.venv/ fine, no extraction needed | |

**User's choice:** Git clone repo
**Notes:** None

### Clone Scope

| Option | Description | Selected |
|--------|-------------|----------|
| dataflows only | Just dataflows (the core package) | ✓ |
| dataflows + extensions | dataflows + dataflows-airtable + dataflows-elasticsearch | |
| All derive dependencies | Everything from requirements.txt that derive imports | |

**User's choice:** dataflows only

---

## Document Depth & Format

### Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-up | Start with dataflows internals, then derive flow | |
| Top-down | Start with derive execution order, explain dataflows inline | ✓ |
| Two separate documents | One for dataflows internals, one for derive flow | |

**User's choice:** Top-down with inline explanations

### Diagrams

| Option | Description | Selected |
|--------|-------------|----------|
| Mermaid diagrams | Visual Mermaid flowcharts | |
| ASCII diagrams | ASCII box diagrams | |
| Text only | Just text descriptions | |

**User's choice:** Free text — "give me the one that will look better for this job"
**Resolution:** Mermaid for high-level pipeline, ASCII for inline step details

### Detail Level

| Option | Description | Selected |
|--------|-------------|----------|
| Every processor step | Show exactly what each row processor does | |
| Sub-flow level | Each sub-flow with purpose, key transforms, data in/out | |
| Stage level | Just the 5 main stages | |

**User's choice:** Free text — "every DF process I want explanation"
**Resolution:** Every DF.* call explained, but not field-by-field row analysis

---

## External Dependency Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Surface-level | Note what each external call does in one line | ✓ |
| Deep | Trace into srm_tools source code | |
| Skip | Ignore external calls entirely | |

**User's choice:** Surface-level: name + purpose only

---

## Checkpoint Deep-Dive Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full checkpoint internals | NDJSON format, step absorption, read vs write, atomic rename | |
| Locations + what they cache | Where checkpoints are and what data they cache | ✓ |

**User's choice:** Locations + what they cache only

---

## Agent's Discretion

- Diagram style (Mermaid vs ASCII) per section — use whichever looks better
- Organization of to_dp.py's 5 nested sub-flows

## Deferred Ideas

None — discussion stayed within phase scope.
