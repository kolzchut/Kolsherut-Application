# Architecture Research

**Domain:** ETL derive operator — two-operator split architecture
**Researched:** 2026-03-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Curation Airtable Base                       │
│  (Organizations, Branches, Services, Manual Fixes)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   OPERATOR A    │
                    │  (AT Writer)    │
                    │                 │
                    │ from_curation:  │
                    │  filter+fix+    │
                    │  remap IDs+     │
                    │  write staging  │
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Staging Airtable Base                        │
│  (Organizations, Branches, Services, Locations,                  │
│   Situations, Responses, Cards)                                  │
│  AIRTABLE_BASE env var → stage or prod                           │
└──────┬──────────────────────────────────┬───────────────────────┘
       │                                  │
       │                         ┌────────▼────────┐
       │                         │   OPERATOR B    │
       │                         │  (ES Pipeline)  │
       │                         │                 │
       │                         │ to_dp:          │
       │                         │  pull 6 tables  │
       │                         │  denormalize    │
       │                         │  → card_data    │
       │                         │                 │
       │                         │ autocomplete:   │
       │                         │  10 templates   │
       │                         │  → suggestions  │
       │                         │                 │
       │                         │ to_es:          │
       │                         │  6 ES indexes   │
       │                         │  atomic swap    │
       │                         └────────┬────────┘
       │                                  │
       │                    ┌─────────────▼──────────────┐
       │                    │      Elasticsearch         │
       │                    │  srm__cards                │
       │                    │  srm__autocomplete         │
       │                    │  srm__responses            │
       │                    │  srm__situations           │
       │                    │  srm__places               │
       │                    │  srm__orgs                 │
       │                    └────────────────────────────┘
       │
       │ (to_sql writes 8 card fields back)
       │ NOTE: to_sql runs AFTER to_dp in Operator B,
       │       writes card_data fields back to AT Cards table
       └─────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Operator A (`derive_curation/`) | Copy curated data to staging AT with filtering + fixes + ID remapping | Single `operator()` function, uses `load_airtable_as_dataframe` + `update_if_exists_if_not_create` |
| Operator B (`derive_es/`) | Pull from AT → denormalize → autocomplete → load ES + write cards to AT | Sequential pipeline: `to_dp()` → `autocomplete()` → `to_es()` → `cards_to_at()` |
| Shared infra | AT read/write, ES client, logging, hashing | Existing modules in `extract/`, `load/`, `utilities/`, `srm_tools/` |
| Pure helpers | Transform functions (taxonomy, phone, URL, address, scoring) | Extracted from current `helpers.py`, portable as-is |
| ES utilities | Bulk indexing with revision-based atomic swap | Refactored `es_utils.py` — drop `dataflows_elasticsearch`, use `elasticsearch.helpers.bulk()` |

## Recommended Project Structure

```
operators/
├── derive_curation/           # Operator A — AT writer
│   ├── __init__.py            # operator() entry point
│   ├── curation_pipeline.py   # from_curation logic (filter, fix, remap, write)
│   └── manual_fixes.py        # ManualFixes class (refactored, no dataflows)
│
├── derive_es/                 # Operator B — ES pipeline
│   ├── __init__.py            # operator() entry point
│   ├── to_dp.py               # Denormalization pipeline (pandas merges)
│   ├── autocomplete.py        # Autocomplete suggestion generation
│   ├── to_es.py               # 6 ES index loads
│   ├── cards_to_at.py         # Write 8 card fields to AT Cards table
│   ├── es_utils.py            # Bulk indexing + atomic swap (refactored)
│   ├── es_schemas.py          # Explicit ES mapping dicts
│   ├── autotagging.py         # Auto-tagging rules (refactored, no dataflows)
│   ├── helpers.py             # Pure transform functions
│   └── scoring.py             # RSScoreCalc (extracted from dataflows coupling)
│
├── derive/                    # OLD — kept as-is (dead code policy)
│   └── ... (12 existing files untouched)
```

### Structure Rationale

- **derive_curation/:** Isolated AT writer — can run independently, clear single responsibility
- **derive_es/:** Complete ES pipeline — pulls from AT, transforms, loads ES. Self-contained.
- **derive/ (old):** Preserved per dead code policy — no refactoring of existing unused code
- **Shared helpers stay in place:** `extract/`, `load/`, `utilities/` already work with pandas

## Architectural Patterns

### Pattern 1: Sequential DataFrame Pipeline

**What:** Each stage produces a DataFrame, passed in-memory to the next stage.
**When to use:** All of Operator B's pipeline (to_dp → autocomplete → to_es).
**Trade-offs:** Simple, debuggable, but uses more memory than streaming. Acceptable for this data volume (<100k rows).

```python
def operator():
    # Stage 1: Pull + denormalize
    card_data = to_dp()  # Returns pd.DataFrame
    
    # Stage 2: Generate autocomplete
    autocomplete_data = generate_autocomplete(card_data)  # Returns pd.DataFrame
    
    # Stage 3: Load ES
    load_all_es_indexes(card_data, autocomplete_data)
    
    # Stage 4: Write cards back to AT
    cards_to_airtable(card_data)
```

### Pattern 2: Revision-Based Atomic Swap

**What:** Every bulk index operation stamps docs with a UUID `revision`. After indexing, delete all docs with a different revision.
**When to use:** All 6 ES index loads.
**Trade-offs:** Ensures consistency (no partial updates visible to users), but requires a 30s wait for ES refresh.

```python
revision = uuid.uuid4().hex
bulk_index(es, index_name, df, revision)
es.indices.refresh(index=index_name)  # Force refresh instead of sleep(30)
delete_by_query(es, index_name, revision)  # Delete old revision
```

### Pattern 3: Shared Infrastructure Reuse

**What:** Both operators import from shared modules rather than duplicating logic.
**When to use:** AT reads/writes, ES client, logging, hashing.
**Trade-offs:** Tight coupling with shared modules, but these are stable and well-tested.

## Integration Points

### Operator A → Staging Airtable

| Action | Shared Module | Function |
|--------|---------------|----------|
| Read curation AT | `extract/extract_data_from_airtable.py` | `load_airtable_as_dataframe()` |
| Write staging AT | `load/airtable.py` | `update_if_exists_if_not_create()` |
| Prepare write data | `utilities/update.py` | `prepare_airtable_dataframe()` |

### Operator B → ES + Airtable

| Action | Shared Module | Function |
|--------|---------------|----------|
| Read staging AT | `extract/extract_data_from_airtable.py` | `load_airtable_as_dataframe()` |
| Bulk index ES | `derive_es/es_utils.py` | `bulk_index_dataframe()` (new) |
| Atomic swap | `derive_es/es_utils.py` | `delete_old_revision()` (new) |
| Write cards to AT | `load/airtable.py` | `update_if_exists_if_not_create()` |

### Scheduling (Cronicle)

Current: Single derive operator called by Cronicle.
After: Two operators registered, called sequentially (A then B) or independently.

## Data Flow Changes

| Before (dataflows) | After (pandas) |
|---------------------|----------------|
| Lazy pull-based streaming | Eager in-memory DataFrames |
| 15 disk persistence points | 0 disk persistence (memory only) |
| `DF.Flow()` chains | Sequential function calls |
| `DF.join()` with resources | `pd.merge()` / `pd.concat()` |
| `DF.checkpoint()` | Removed entirely |
| `dump_to_path()` | Removed entirely |
| `dump_to_es()` (dataflows_elasticsearch) | `elasticsearch.helpers.bulk()` |
| `load_from_airtable` (dataflows_airtable) | `load_airtable_as_dataframe()` |

## Suggested Build Order

1. **Shared foundation** — Port pure helpers, create ES bulk utilities, explicit mappings
2. **Operator B / to_dp** — Core denormalization (biggest, most complex piece)
3. **Operator B / autocomplete + to_es** — Depends on card_data from to_dp
4. **Operator A / from_curation + to_sql** — Independent but touches many AT tables
5. **End-to-end validation** — Compare ES output before/after

---
*Researched: 2026-03-22*
