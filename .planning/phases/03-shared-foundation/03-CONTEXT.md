# Phase 3: Shared Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Create all shared infrastructure needed by both new operators — ES bulk utilities with revision-based atomic swap, explicit mapping dicts for all 6 indexes, ported pure helpers, two operator directory scaffolds (derive_curation/ and derive_es/), and AT ID standardization to `_airtable_id`.

</domain>

<decisions>
## Implementation Decisions

### Agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure phase.

Key guidance from research:
- Replace `SRMMappingGenerator` with explicit Python dict mappings (translate from es_schemas.py constants)
- Replace `dump_to_es_and_delete` with `bulk_index_dataframe()` using `elasticsearch.helpers.bulk()` + `es.indices.refresh()` instead of `sleep(30)`
- Standardize all AT ID references to `_airtable_id` (single underscore)
- Scaffold `derive_curation/` and `derive_es/` with `__init__.py` entry points
- Port all pure helpers from current `derive/helpers.py` (transform_phone_numbers, transform_urls, update_taxonomy_with_parents, address_parts, org_name_parts, card_score, etc.)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extract/extract_data_from_airtable.py` — `load_airtable_as_dataframe()` returns pd.DataFrame
- `load/airtable.py` — `update_if_exists_if_not_create()`, `update_airtable_records()`, `create_airtable_records()`
- `utilities/update.py` — `prepare_airtable_dataframe()`, `filter_valid_rows()`
- `srm_tools/hash.py` — `hasher()`
- `srm_tools/logger.py` — configured logger
- `srm_tools/error_notifier.py` — `invoke_on()` error wrapping
- `conf/` — settings (ES_HOST, ES_PORT, ES_HTTP_AUTH, AIRTABLE_BASE, etc.)
- `operators/derive/es_utils.py` — `es_instance()` singleton (keep as-is)
- `operators/derive/helpers.py` — pure transform functions to port
- `operators/derive/es_schemas.py` — ES mapping type constants to translate

### Established Patterns
- meser/day_care operators: `load_airtable_as_dataframe()` → pandas transforms → `update_if_exists_if_not_create()` 
- ES client: singleton via `es_instance()` from settings
- Revision swap: UUID stamp → bulk index → wait → delete old

### Integration Points
- New operators register in `operators/` alongside existing derive/, meser/, day_care/
- Both operators import from `extract/`, `load/`, `utilities/`, `srm_tools/`, `conf/`
- ES mappings translate from `es_schemas.py`: TAXONOMY_ITEM_SCHEMA, URL_SCHEMA, KEYWORD_STRING, NON_INDEXED_STRING, LAST_MODIFIED_DATE

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
