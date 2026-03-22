# Stack Research

**Domain:** Python ETL pipeline refactor (dataflows → pandas)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| pandas | 2.2.3 | All transform/join/merge/denormalization logic | Already in requirements.txt, matches meser/day_care pattern, team familiarity |
| elasticsearch | 7.13.4 | ES client + bulk API for all 6 index loads | Already pinned, `helpers.bulk()` API stable for batch indexing |
| pyairtable | 3.1.1 | Airtable reads via `load_airtable_as_dataframe` | Already in use by shared infra, returns pd.DataFrame directly |
| Python | 3.x | Runtime | Existing ETL runtime |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| openlocationcode | 1.0.1 | Pluscode encoding for locations | Location geometry processing |
| thefuzz | 0.22.1 | Fuzzy string matching (branch dedup, city bounds) | Branch deduplication at 80% threshold, autocomplete city matching |
| regex | 2024.5.15 | Hebrew-aware address parsing | Address parts extraction |
| bleach | 6.2.0 | HTML sanitization | If description fields need cleaning |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Cosmos DB Emulator | Not applicable | N/A — this is an ETL refactor |
| pytest | Test validation | Compare ES output before/after refactor |

## Installation

```bash
# No new dependencies — all already in requirements.txt
pip install -r requirements.txt
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| pandas merge/join | dataflows DF.join | Never — dataflows is being removed |
| elasticsearch.helpers.bulk() | dataflows_elasticsearch dump_to_es | Never — removing dataflows_elasticsearch dependency |
| Explicit ES mappings (Python dict) | SRMMappingGenerator (MappingGenerator subclass) | Never — tableschema_elasticsearch no longer needed |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| dataflows | Being removed — streaming framework adds complexity | pandas DataFrames in memory |
| dataflows_airtable | Coupled to dataflows pipeline | pyairtable via `load_airtable_as_dataframe()` |
| dataflows_elasticsearch | Coupled to dataflows pipeline | elasticsearch.helpers.bulk() directly |
| tableschema_elasticsearch | Only needed for auto-mapping from dataflows schemas | Explicit Python dict mappings |
| DF.checkpoint() | Being removed — 15 persistence points eliminated | Keep DataFrames in memory (sequential pipeline) |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| elasticsearch==7.13.4 | ES 7.x server | Uses `body=` parameter; 8.x deprecates this |
| pandas==2.2.3 | pyairtable 3.1.1 | `load_airtable_as_dataframe` returns pd.DataFrame |
| thefuzz==0.22.1 | python-Levenshtein | Optional C extension for speed |

---
*Researched: 2026-03-22*
