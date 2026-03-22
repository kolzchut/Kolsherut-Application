# Derive Refactor — Migration Guide

## Overview

The monolithic `derive` operator has been split into two independent operators:

| Operator | Package | Scheduler Label | Purpose |
|----------|---------|-----------------|---------|
| **Operator A** | `operators/derive_curation/` | `Derive Curation (Operator A)` | Copy curated records from curation AT → staging AT |
| **Operator B** | `operators/derive_es/` | `Derive ES (Operator B)` | Denormalize AT data → load 6 ES indexes |

Both use **pandas DataFrames** instead of `dataflows`, and call **elasticsearch-py** directly instead of `dataflows-elasticsearch`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Operator A — derive_curation                   │
│                                                 │
│  Curation AT ──► filter/fix ──► Staging AT      │
│  (from_curation.py)                             │
└─────────────────────────────────────────────────┘
         │ staging AT tables now have curated data
         ▼
┌─────────────────────────────────────────────────┐
│  Operator B — derive_es                         │
│                                                 │
│  Staging AT ──► to_dp() ──► card_data           │
│                    │                            │
│                    ├──► autocomplete ──► ES      │
│                    └──► to_es (6 indexes) ──►ES │
│                                                 │
│  Modules:                                       │
│    to_dp.py       — denormalization pipeline     │
│    autocomplete.py — suggestion expansion        │
│    to_es.py       — ES bulk loading              │
│    es_utils.py    — atomic swap utilities         │
│    es_mappings.py — explicit index mappings       │
│    helpers.py     — pure transform functions      │
│    validate.py    — validation & comparison       │
└─────────────────────────────────────────────────┘
```

## Running the Operators

### Operator A — Curation

```python
from operators.derive_curation import operator
operator()
```

Or in the scheduler: register as `Derive Curation (Operator A)`.

**WARNING**: This operator **writes** to Airtable. The `AIRTABLE_BASE` env var determines the target base. Ensure it points to **staging**, not production, during testing.

### Operator B — ES Pipeline

```python
from operators.derive_es import operator
operator()
```

Or in the scheduler: register as `Derive ES (Operator B)`.

### Execution Order

Run **Operator A first** (curation → staging AT), then **Operator B** (staging AT → ES). This matches the old `derive` operator's internal order.

## Validation

A built-in validation script checks all 6 ES indexes:

```bash
# All indexes
python -m operators.derive_es.validate

# Single index
python -m operators.derive_es.validate srm__cards
```

The script checks:
- Index exists and has documents
- Mapped fields match expected schema
- Sample documents are non-empty

For **side-by-side comparison** (old pipeline vs new), use the Python API:

```python
from operators.derive_es.validate import compare_indexes
report = compare_indexes('srm__cards_old_alias', 'srm__cards')
print(report)
```

## ES Indexes

All 6 indexes use revision-based atomic swap (no downtime during reindex):

| Index | Content | ID Field |
|-------|---------|----------|
| `srm__cards` | Service cards (denormalized) | `card_id` |
| `srm__autocomplete` | Search suggestions | auto-generated |
| `srm__responses` | Response taxonomy counts | `id` |
| `srm__situations` | Situation taxonomy counts | `id` |
| `srm__orgs` | Organization counts | `id` |
| `srm__places` | Geographic place counts | `key` |

## Key Differences from Old Pipeline

| Aspect | Old (`derive/`) | New (`derive_es/` + `derive_curation/`) |
|--------|----------------|------------------------------------------|
| Framework | dataflows (DF.Flow) | pandas DataFrames |
| ES loading | dataflows-elasticsearch | elasticsearch.helpers.bulk() |
| Mappings | SRMMappingGenerator | Explicit Python dicts |
| Atomic swap | `time.sleep(30)` | `es.indices.refresh()` |
| Checkpoints | 15 dump_to_path calls | None (single-pass) |
| AT reads | `load_from_airtable` | `load_airtable_as_dataframe()` |
| AT ID field | `__airtable_id` (double) | `_airtable_id` (single underscore) |
| Structure | 1 monolithic operator | 2 independent operators |

## Dependencies

All dependencies are already in `requirements.txt`:

- `pandas>=2.2.3`
- `elasticsearch>=7.13.4,<8`
- `pyairtable>=3.1.1`
- `thefuzz` (for fuzzy matching)

No new packages were added.

## Rollback

The old `derive/` operator is **preserved** and continues to work. To rollback:

1. Re-register `derive` in the scheduler instead of `derive_curation` + `derive_es`
2. No data migration needed — both operators write to the same ES indexes and AT tables

## Files

```
operators/derive_es/
├── __init__.py        # Operator B entry point + invoke_on
├── to_dp.py           # Denormalization pipeline (1112 lines)
├── autocomplete.py    # 10-template suggestion expansion (259 lines)
├── to_es.py           # Load 6 ES indexes (306 lines)
├── es_utils.py        # Bulk utilities + atomic swap (191 lines)
├── es_mappings.py     # Explicit mappings for all 6 indexes (303 lines)
├── helpers.py         # Pure transform functions (299 lines)
└── validate.py        # Validation & comparison script

operators/derive_curation/
├── __init__.py        # Operator A entry point + invoke_on
└── from_curation.py   # Curation pipeline (343 lines)
```

Total: ~2900 lines of new code across 9 files.
