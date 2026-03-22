# Derive Operator — Complete Flow Analysis

> **Purpose:** Comprehensive analysis of the `derive` ETL operator in the Kol Sherut pipeline.
> This document explains how the `dataflows` framework works and walks through every stage
> of the derive operator, documenting each processing step, checkpoint, and data transformation.
>
> **Reading guide:** Start with [How dataflows Works](#how-dataflows-works) if you're unfamiliar
> with the framework, then read each stage sequentially. The [Checkpoint & Cache Map](#checkpoint--cache-map)
> at the end provides a quick-reference table of all persistence points.

## Table of Contents

- [How dataflows Works](#how-dataflows-works)
  - [Flow() and Processor Chaining](#flow-and-processor-chaining)
  - [Lazy Evaluation and Pull-Based Execution](#lazy-evaluation-and-pull-based-execution)
  - [Function Auto-Detection](#function-auto-detection)
  - [checkpoint vs dump_to_path](#checkpoint-vs-dump_to_path)
  - [Other Key Processors](#other-key-processors)
- [Derive Overview](#derive-overview)
  - [Entry Point and Orchestration](#entry-point-and-orchestration)
  - [High-Level Pipeline Diagram](#high-level-pipeline-diagram)
- [Stage 1: from_curation — Data Import](#stage-1-from_curation--data-import)
- [Stage 2: to_dp — Core Data Transformation](#stage-2-to_dp--core-data-transformation)
  - [Sub-flow 1: srm_data_pull](#sub-flow-1-srm_data_pull)
  - [Sub-flow 2: flat_branches](#sub-flow-2-flat_branches)
  - [Sub-flow 3: flat_services](#sub-flow-3-flat_services)
  - [Sub-flow 4: flat_table](#sub-flow-4-flat_table)
  - [Sub-flow 5: card_data](#sub-flow-5-card_data)
  - [RSScoreCalc — Side-Channel Flow](#rsscorecalc--side-channel-flow)
- [Stage 3: autocomplete — Autocomplete Generation](#stage-3-autocomplete--autocomplete-generation)
- [Stage 4: to_es — Elasticsearch Loading](#stage-4-to_es--elasticsearch-loading)
- [Stage 5: to_sql — Airtable Card Upload](#stage-5-to_sql--airtable-card-upload)
- [Helper Modules](#helper-modules)
  - [helpers.py — Shared Preprocessing Flows](#helperspy--shared-preprocessing-flows)
  - [autotagging.py — Auto-tagging Rules](#autotaggingpy--auto-tagging-rules)
  - [es_schemas.py — ES Field Schema Constants](#es_schemaspy--es-field-schema-constants)
  - [es_utils.py — ES Connection and Loading](#es_utilspy--es-connection-and-loading)
  - [manual_fixes.py — Manual Fix Application](#manual_fixespy--manual-fix-application)
- [Checkpoint & Cache Map](#checkpoint--cache-map)
- [External Dependencies Reference](#external-dependencies-reference)

---

## How dataflows Works

`dataflows` (v0.5.5) is a Python data processing framework built on the Frictionless Data specification. It provides three core abstractions: **Flow** (pipeline builder), **DataStreamProcessor** (individual processing step), and **DataStream** (descriptor + resource iterators). The derive operator builds complex ETL pipelines using this framework.

### Flow() and Processor Chaining

`Flow(*args)` stores its steps as a tuple in `self.chain`. Calling `.process()` triggers `_chain()`, which wraps each step around the previous `DataStream` in sequence. Each `DataStreamProcessor` receives an upstream DataStream and produces a new one. Nested `Flow` objects are flattened during chaining.

Here is the actual source pattern from `flow.py`:

```python
class Flow:
    def __init__(self, *args):
        self.chain = args           # Store all steps as a tuple

    def process(self):
        return self._chain().process()   # Build chain, then drain it

    def _chain(self, ds=None):
        for position, link in enumerate(self._preprocess_chain(), start=1):
            if isinstance(link, Flow):
                ds = link._chain(ds)               # Nested flows get flattened
            elif isinstance(link, DataStreamProcessor):
                ds = link(ds, position=position)    # Processor wraps upstream
            elif isfunction(link):
                # Auto-detect function signature (see next section)
                ds = auto_wrapped(link)(ds, position=position)
            elif isinstance(link, Iterable):
                ds = iterable_loader(link)(ds, position=position)
        return ds
```

```mermaid
graph LR
    A["Flow(step1, step2, step3)"] --> B["step3(step2(step1(None)))"]
    B --> C[".process() drains outermost"]
```

This is a **decorator/wrapper pattern**, not a push-based event system. Each step wraps the previous stream — `.process()` iterates the outermost, triggering a cascade inward through all processors.

### Lazy Evaluation and Pull-Based Execution

The `LazyIterator` class is the key to lazy evaluation. It stores a *function that creates an iterator*, not the iterator itself. The function is only called when someone starts iterating:

```python
class LazyIterator:
    def __init__(self, get_iterator):
        self.get_iterator = get_iterator

    def __iter__(self):
        return self.get_iterator()
```

The pull model works as follows: the terminal consumer (`.process()`, `dump_to_path`, `checkpoint`) starts iterating → pulls data from the outer processor → which pulls from its upstream → all the way to the innermost source. **No work is done until a terminal consumer reads rows.**

"Draining" means `.process()` iterates through all rows silently, triggering the full chain. This is why derive can define large pipelines cheaply — definition is O(1), execution is deferred.

Execution sequence:

1. `.process()` calls outermost processor's `_process()`
2. `_process()` calls `self.source._process()` → gets upstream DataStream
3. Recursion continues to innermost (or `None` → empty DataStream)
4. Each processor wraps resource iterators with its logic via `LazyIterator`
5. Outermost starts iterating → pulls rows through the entire chain
6. Data flows row-by-row through all processors in a single pass

### Function Auto-Detection

When a bare Python function is passed to `Flow()`, dataflows inspects its first parameter **name** (not type annotation) to determine behavior:

| Parameter Name | Behavior | Example |
|---------------|----------|---------|
| `row` | Called once per row, should return modified row or `None` to filter | `def add_field(row): row['x'] = 1` |
| `rows` | Receives a generator of all rows in a resource, must yield rows | `def dedup(rows): seen = set(); ...` |
| `package` | Receives the `PackageWrapper`, can modify schema/metadata | `def add_resource(package): ...` |

This is why derive code freely mixes `DF.*` processor calls with plain functions — they are all valid Flow steps. The auto-detection is based on the first parameter's **name**, not its type annotation. Any other parameter name triggers an assertion error.

### checkpoint vs dump_to_path

**checkpoint (NDJSON serialization):**

`checkpoint` is a `Flow` subclass that intercepts chain-building via `_preprocess_chain()`:

1. **Cache HIT**: replaces the entire upstream chain with `unstream(filename)` — reads an NDJSON file, skips all upstream processing
2. **Cache MISS**: appends `stream(filename)` after the upstream chain — data passes through AND gets serialized to `.checkpoints/<name>/stream.ndjson`

**Critical "absorb" behavior** — `handle_flow_checkpoint()`:

```python
def handle_flow_checkpoint(self, parent_chain):
    self.chain = itertools.chain(self.chain, parent_chain)
    return [self]
```

When a checkpoint is placed inside a `Flow()`, it absorbs ALL preceding steps into its own chain. This means the checkpoint captures everything before it as upstream, not just the immediately preceding step.

Cache invalidation is **manual only** — the derive code uses `shutil.rmtree()` to delete checkpoint directories before running. In the current codebase, checkpoints are always deleted before use, so they effectively never cache-hit during normal operation. They serve as debugging/restart aids only.

**dump_to_path (disk persistence):**

1. Writes all resources to disk as CSV files + `datapackage.json` descriptor
2. Always writes (no cache-hit shortcut)
3. Output is a standard Frictionless Data Package
4. Can be loaded back with `DF.load('path/datapackage.json')`
5. In derive, serves as **inter-sub-flow communication**: sub-flow N dumps → sub-flow N+1 loads

**Comparison:**

| Aspect | `checkpoint` | `dump_to_path` |
|--------|-------------|----------------|
| Format | NDJSON (stream.ndjson) | CSV + datapackage.json |
| Cache behavior | Skips upstream on hit | Always writes |
| Absorbs upstream? | Yes (`handle_flow_checkpoint`) | No |
| Use in derive | 3 locations, always pre-deleted | 12 locations, inter-stage comms |
| Invalidation | Manual `shutil.rmtree()` | Overwritten each run |

### Other Key Processors

Reference table of all `DF.*` processor types used in the derive pipeline:

| Processor | What It Does |
|-----------|-------------|
| `DF.load(path)` | Loads a previously-dumped data package from disk into the flow as new resources |
| `DF.dump_to_path(path)` | Writes all resources to disk as CSV files + datapackage.json |
| `DF.checkpoint(name)` | NDJSON cache — skips upstream on cache hit, writes through on miss |
| `DF.join(source, source_key, target, target_key, fields)` | SQL-like join: consumes source resource into memory, looks up matches for target rows |
| `DF.join_with_self(resource, key, fields)` | Self-join: groups rows by key within a single resource, applying aggregations |
| `DF.set_type(field, type, transform)` | Modifies field schema type and optionally applies a per-value transform function |
| `DF.filter_rows(condition, resources)` | Passes only rows where the predicate function returns True |
| `DF.select_fields(fields)` | Keeps only the listed fields, removes all others from data and schema |
| `DF.delete_fields(fields)` | Removes listed fields from data and schema |
| `DF.update_resource(name, **props)` | Modifies resource metadata (name, path, title) |
| `DF.update_package(**props)` | Modifies package metadata |
| `DF.validate()` | Validates all rows against current schema, raises on type mismatch |
| `DF.sort_rows(key)` | Sorts resource rows by a key expression |
| `DF.add_field(name, type, default)` | Adds a new field to the schema and optionally sets a default/computed value |
| `DF.finalizer(callback)` | Registers a callback that runs after all resources are fully consumed |

For `DF.join`, the `fields` dict specifies which source fields to pull onto target rows, with optional aggregation: `count`, `sum`, `set`, `array`, `first`, etc.

For `DF.finalizer`, this is used in `es_utils.py` to delete old ES documents after new ones are loaded.

---

## Derive Overview

The derive operator transforms data from an Airtable curation base into Elasticsearch indexes and Airtable card records. It runs 5 sequential stages: `from_curation` → `to_dp` → `autocomplete` → `to_es` → `to_sql`. Each stage is a separate Python module that builds and executes one or more dataflows `Flow()` pipelines. No stage runs in parallel — each must complete before the next begins.

### Entry Point and Orchestration

**`__main__.py`** (3 lines — the CLI entry point):

```python
import operators.derive
operators.derive.deriveData()
```

**`__init__.py`** — the `deriveData()` orchestrator:

```python
def deriveData(*_):
    logger.info('Starting Derive Data Flow')
    from_curation.operator()    # Stage 1: Copy data from curation Airtable base
    to_dp.operator()            # Stage 2: Transform into card data packages
    autocomplete.operator()     # Stage 3: Generate autocomplete suggestions
    to_es.operator()            # Stage 4: Load into Elasticsearch
    to_sql.operator()           # Stage 5: Upload cards to Airtable
    logger.info('Finished Derive Data Flow')

def operator(*_):
    invoke_on(deriveData, 'Upload to DB (Derive)')
```

The `invoke_on` wrapper (from `srm_tools.error_notifier`) is a try/except that sends an email notification on failure. Each `*.operator()` call builds and fully executes one or more `Flow().process()` pipelines before returning.

Note: `sys.setrecursionlimit(5000)` is set in `to_dp.py` because deeply nested Flow chains can exceed Python's default recursion limit of 1000.

### High-Level Pipeline Diagram

<!-- TODO: Fill in Plan 05 -->

---

## Stage 1: from_curation — Data Import

Copies Organizations, Branches, and Services records from the Airtable curation base to the production Airtable base. Applies manual fixes and filters (active, not rejected/suspended, has services).

```mermaid
graph TD
    A[Airtable Curation Base] -->|load_from_airtable| B[dump_to_path cache]
    B -->|DF.load| C["Filter: set decision='New' for empty"]
    C -->|dump_to_airtable| D[Write back decision to curation]
    B -->|DF.load| E[Filter: Active, not Rejected]
    E --> F[Apply ManualFixes]
    F -->|airtable_updater| G[Production Airtable Base]
```

**Step-by-step walkthrough** — the same pattern repeats for each of 3 tables (Organizations, Branches, Services):

1. **`shutil.rmtree()`** deletes previous cache for this table (e.g., `from-curation-Organizations/`)
2. **`load_from_airtable(curation_base, table)`** pulls all records from the curation Airtable base
3. **`DF.select_fields()`** keeps only the needed columns (data fields + decision + status + id)
4. **`DF.dump_to_path(CHECKPOINT + table)`** caches all records to disk as a data package
5. **`DF.filter_rows()`** selects rows without a `decision` field
6. **`DF.set_type('decision', transform=...)`** sets decision to "New" for empty values
7. **`dump_to_airtable()`** writes the "New" decision back to the curation base
8. **`DF.load(CHECKPOINT + table)`** reloads from the local cache (not from Airtable again — key optimization)
9. **`stats.filter_with_stat()`** applies filters: `status == 'ACTIVE'`, decision not in `['Rejected', 'Suspended']`, entity has services
10. **`manual_fixes.apply_manual_fixes()`** — the `ManualFixes` class loads correction rules from an Airtable table and applies field-level overrides to matching records
11. **`airtable_updater()`** writes to the production Airtable base using hash-based diff (writes only changed records)

Between table updates, `from_curation` also builds conversion dicts (`updated_orgs`, `updated_branches`) to map old record IDs to production IDs, which are used to fix cross-table references (e.g., branch → organization links).

**Cache locations (3 `dump_to_path` caches):**
- `.checkpoints/from-curation-Organizations/`
- `.checkpoints/from-curation-Branches/`
- `.checkpoints/from-curation-Services/`

**Key DF.* calls in from_curation.py:**

| Call | Context |
|------|---------|
| `load_from_airtable(curation_base, table)` | Pull all records from curation |
| `DF.select_fields(fields)` | Keep only needed columns |
| `DF.dump_to_path(CHECKPOINT + table)` | Cache to disk |
| `DF.filter_rows(lambda r: not r.get('decision'))` | Find records without a decision |
| `DF.set_type('decision', transform=...)` | Set "New" decision |
| `dump_to_airtable(...)` | Write decisions back to curation |
| `DF.load(CHECKPOINT + table + '/datapackage.json')` | Reload from cache |
| `DF.update_resource(-1, name=...)` | Rename resource for updater |
| `stats.filter_with_stat(...)` | Filter + record rejection stats |
| `manual_fixes.apply_manual_fixes()` | Apply manual corrections |
| `DF.delete_fields(['source', 'status'])` | Remove internal fields |
| `fetch_mapper(fields=...)` / `update_mapper()` | Prepare for airtable_updater |

---

## Stage 2: to_dp — Core Data Transformation

The largest and most complex derive module at 946 lines. Transforms raw Airtable data into a denormalized "card data" format suitable for Elasticsearch indexing. Contains 5 sequential sub-flows.

**`operator()` entry point** — cleanup then execute:

```python
def operator():
    shutil.rmtree('.checkpoints/to_dp', ...)           # Delete checkpoint
    shutil.rmtree('.checkpoints/srm_raw_airtable_buffer', ...)  # Delete raw buffer
    for subdir in ('srm_data', 'flat_branches', 'flat_services', 'flat_table', 'card_data'):
        shutil.rmtree(f'{DATA_DUMP_DIR}/{subdir}', ...)  # Clean all intermediate dirs

    branch_mapping = dict()
    srm_data_pull_flow().process()              # Sub-flow 1
    flat_branches_flow(branch_mapping).process() # Sub-flow 2
    flat_services_flow(branch_mapping).process() # Sub-flow 3
    flat_table_flow().process()                  # Sub-flow 4
    card_data_flow().process()                   # Sub-flow 5 (no .process() — runs internally)
```

The 5 sub-flows:

| # | Sub-flow | Purpose |
|---|----------|---------|
| 1 | `srm_data_pull_flow()` | Pull and preprocess all Airtable tables |
| 2 | `flat_branches_flow(branch_mapping)` | Denormalize branches with org+location data |
| 3 | `flat_services_flow(branch_mapping)` | Denormalize services with branch data |
| 4 | `flat_table_flow()` | Join into final flat service-branch pairs |
| 5 | `card_data_flow()` | Enrich with taxonomy, scoring, autocomplete, address parsing |

```mermaid
graph LR
    S1[srm_data_pull] -->|"data/srm_data/"| S2[flat_branches]
    S1 -->|"data/srm_data/"| S3[flat_services]
    S2 -->|"data/flat_branches/"| S3
    S2 -->|"data/flat_branches/"| S4[flat_table]
    S3 -->|"data/flat_services/"| S4
    S4 -->|"data/flat_table/"| S5[card_data]
    S5 -->|"data/card_data/"| OUT[Output]
```

The `branch_mapping` dict is shared by reference between sub-flows 2 and 3 — flat_branches populates it with old→new branch key mappings after deduplication, and flat_services reads it to redirect merged branch IDs.

### Sub-flow 1: srm_data_pull

Pulls curated data from the production Airtable base and preprocesses all 6 tables:

1. **`load_from_airtable()`** × 6 — loads Responses, Situations, Organizations, Locations, Branches, Services from the production Airtable base
2. **`DF.update_package(name='SRM Data')`** — set package name
3. **`DF.checkpoint('srm_raw_airtable_buffer')`** — caches all 6 raw Airtable tables as NDJSON (absorbs the 6 loads above)
4. **`helpers.preprocess_responses(validate=True)`** — apply response-specific cleaning and field extraction
5. **`helpers.preprocess_situations(validate=True)`** — apply situation-specific cleaning
6. **`helpers.preprocess_services(validate=True)`** — apply service-specific cleaning, normalize fields
7. **`helpers.preprocess_organizations(validate=True)`** — clean org records, normalize via `clean_org_name`
8. **`helpers.preprocess_branches(validate=True)`** — clean branch records, extract location references
9. **`helpers.preprocess_locations(validate=True)`** — clean location records, extract geocoding data
10. **`DF.dump_to_path('data/srm_data')`** — writes all 6 preprocessed tables to disk

Each `helpers.preprocess_*()` returns a list of DF.* steps that are unpacked into the parent Flow.

### Sub-flow 2: flat_branches

Produces a denormalized view of branch records with organization and location data inlined:

1. **`DF.load('data/srm_data/datapackage.json', resources=['branches', 'locations', 'organizations'])`** — load 3 tables from srm_data
2. **`DF.update_resource(['branches'], name='flat_branches')`** — rename for processing
3. **`DF.rename_fields({'address': 'orig_address'})`** — preserve original address
4. **`stats.filter_with_stat(...)`** — filter branches without locations
5. **`DF.add_field('location_key', ...)`** — extract location reference
6. **`DF.join('locations', ['key'], 'flat_branches', ['location_key'], ...)`** — join location data (geometry, address, city) onto branches
7. **`DF.set_type('address', transform=select_address)`** — pick best address from available fields
8. **`DF.add_field('organization_key', ...)`** — extract org reference
9. **`stats.filter_with_stat(...)`** — filter branches without valid organizations
10. **`DF.join('organizations', ['key'], 'flat_branches', ['organization_key'], ...)`** — join all org fields onto branches (inner join)
11. **`DF.rename_fields({...})`** — prefix all fields with `branch_` or `organization_`
12. **`DF.select_fields([...])`** — keep only needed columns
13. **`DF.validate()`** — validate against schema
14. **`merge_duplicate_branches(branch_mapping)`** — **buffers all rows in memory**, deduplicates branches by (org_id + geometry + name) using hash keys. Populates `branch_mapping` dict with old→new key mappings. Uses the consuming-generator pattern (breaks streaming, but necessary for dedup).
15. **`DF.dump_to_path('data/flat_branches')`** — write denormalized branches to disk

> **Memory note:** `merge_duplicate_branches` must buffer all rows before yielding, breaking the streaming model. This is by design — deduplication requires seeing all rows before deciding which to keep.

### Sub-flow 3: flat_services

Produces a denormalized view of service records with branch data:

1. **`DF.load('data/flat_branches/datapackage.json', resources=['flat_branches'])`** — load denormalized branches
2. **`DF.load('data/srm_data/datapackage.json', resources=['services'])`** — load services
3. **`collect_branches`** — custom function that builds a branch_map and tracks national vs non-national branches
4. **`unwind('organizations', 'organization_key')`** — one-to-many expansion: a service with multiple orgs becomes multiple rows
5. **`DF.join('flat_branches', ['organization_key'], 'flat_services', ['organization_key'], ...)`** — join organization branches onto services (aggregate: `set`)
6. **`DF.set_type('branches', transform=...)`** — apply `branch_mapping` to redirect merged branch IDs
7. **`DF.set_type('organization_branches', transform=filter_soproc_branches)`** — filter soproc service branches (keep national-only if >5 branches)
8. **`DF.add_field('merge_branches', ...)`** — merge direct branches + org branches into one array
9. **`unwind('merge_branches', 'branch_key')`** — final expansion to one row per (service, branch) pair
10. **`DF.rename_fields({...})`** — prefix service fields with `service_`
11. **`DF.select_fields([...])`** — keep only needed columns
12. **`DF.validate()`** — validate against schema
13. **`DF.dump_to_path('data/flat_services')`** — write to disk

### Sub-flow 4: flat_table

The simplest sub-flow — its purpose is to produce the final joined table with one fully denormalized row per (service, branch) pair:

1. **`DF.load('data/flat_branches/datapackage.json')`** — load flat branches
2. **`DF.load('data/flat_services/datapackage.json')`** — load flat services
3. **`DF.join('flat_branches', ['branch_key'], 'flat_table', ['branch_key'], ...)`** — join all branch/org fields onto services (inner join)
4. **`DF.add_field('branch_short_name', ...)`** — compute branch short name
5. **`DF.filter_rows(unique_service_branch)`** — deduplicate by (service_id, branch_id)
6. **`DF.set_primary_key(['service_id', 'branch_id'])`** — set composite primary key
7. **`DF.select_fields([...])`** — keep all needed columns (~35 fields)
8. **`DF.validate()`** — validate
9. **`DF.dump_to_path('data/flat_table')`** — write final joined table

### Sub-flow 5: card_data

The most complex sub-flow. Enriches the flat table with taxonomy mapping, auto-tagging, relevance scoring, parent taxonomy IDs, autocomplete values, address parsing, and org name parsing.

**card_data_flow() has a two-part execution:**

**Part 1 (runs as Flow().process()):**
```
card_data_flow() steps — Part 1:
─────────────────────────────────
 1. DF.load('data/flat_table/datapackage.json')
 2. Update resource name to 'card_data'
 3. Generate card_id (hash of branch_id + service_id)
 4. merge_duplicate_services — sort by implements, dedup orgs that implement others
 5. Add situation_ids — merge service/branch/org situations
 6. Normalize taxonomy IDs — fix comma-concat, canonicalize roots
 7. Map taxonomy IDs — resolve Airtable keys to canonical taxonomy IDs
 8. Fix situations — remove redundant gender/language tags, add Arabic for Arab/Bedouin
 9. Add response_ids — merge service responses
10. Map response IDs — resolve Airtable keys to canonical taxonomy IDs
11. apply_auto_tagging() — keyword-based tagging rules from Airtable
12. Filter: no responses → reject via stats
    ── checkpoint('to_dp') SPLITS HERE ──
```

**Part 2 (runs as a returned Flow):**
```
card_data_flow() steps — Part 2:
─────────────────────────────────
13. DF.checkpoint(CHECKPOINT) — read from the checkpoint written in Part 1
14. Add situations as structured objects (with name, synonyms from lookup)
15. Add responses as structured objects (with name, synonyms from lookup)
16. RSScoreCalc.process() — compute relevance scores (side-channel flow)
17. Add parent taxonomy IDs for situations and responses
18. Delete raw taxonomy fields, add parent situation/response objects
19. Set ES-specific field types (keyword, etc.)
20. Add response_categories and response_category
21. Filter: no response category → reject
22. Reorder responses by category
23. Filter: invalid location (unless national service)
24. Add possible_autocomplete values
25. Add location fields: point_id, national_service_details, coords, collapse_key
26. Parse address_parts for ES faceting
27. Clean and parse org_name_parts
28. Add organization_resolved_name
29. Set ES keyword types on ID fields
30. count_meser_records() — stats logging
31. DF.validate()
32. DF.dump_to_path('data/card_data')
```

The `checkpoint('to_dp')` in Part 1 absorbs steps 1-12 and serializes to NDJSON. Part 2 starts by reading from this checkpoint. Note that during normal operation the checkpoint is always pre-deleted, so both parts always execute — the checkpoint serves as the data bridge between the two Flow executions.

### RSScoreCalc — Side-Channel Flow

This is a **flow-within-a-flow** pattern — unusual and important to highlight.

`RSScoreCalc.__init__()` runs a *separate* `DF.Flow` that reads from the `to_dp` checkpoint:

```python
class RSScoreCalc:
    def __init__(self):
        per_response = DF.Flow(
            DF.checkpoint(CHECKPOINT),                    # Read from to_dp checkpoint
            DF.select_fields(['situation_ids', 'response_ids']),
            unwind('situation_ids', 'situation_id'),
            unwind('response_ids', 'response_id'),
            DF.join_with_self('card_data', ['situation_id', 'response_id'],
                dict(..., frequency=dict(aggregate='count'))),  # Count per (situation, response)
            ...                                           # Group by response, collect situation counts
        ).results()[0][0]
```

This side flow computes **per-response and per-situation frequencies** — how many cards exist for each taxonomy combination. These frequencies are then used to assign relevance scores (RS scores) to each card via `self.scores[(situation_id, response_id)] = log(total / freq)`.

The side flow MUST run after the `to_dp` checkpoint has been written — this is why the checkpoint exists in the middle of `card_data_flow()`. The timeline:

```mermaid
graph TD
    A["card_data_flow Part 1 (steps 1-12)"] -->|"writes"| B[".checkpoints/to_dp/"]
    B -->|"reads"| C["RSScoreCalc.__init__() side flow"]
    C -->|"provides scorer"| D["card_data_flow Part 2 (steps 13-32)"]
    B -->|"reads via checkpoint"| D
```

The scorer assigns higher scores to cards with more unique taxonomy combinations (rarer = more relevant). Cards with low scores get their outermost situations removed until they fit within `MAX_SCORE = 30`.

---

## Stage 3: autocomplete — Autocomplete Generation

Generates search autocomplete suggestions by combining response names, situation names, organization names, and cities using 10 template patterns. Produces a deduplicated, scored list.

**Templates** (Hebrew-language patterns):

```python
TEMPLATES = [
    '{response}',
    '{situation}',
    '{response} עבור {situation}',
    '{org_name}',
    '{response} של {org_name}',
    '{org_id}',
    '{response} ב{city_name}',
    'שירותים עבור {situation} ב{city_name}',
    '{response} עבור {situation} ב{city_name}',
    '{response} של {org_name} ב{city_name}',
]
```

**Flow walkthrough** of `autocomplete_flow()`:

1. **`DF.load('data/card_data/datapackage.json')`** — load enriched card data from Stage 2
2. **`DF.add_field(...)` × 14** — add all autocomplete output fields (query, response, situation, org, city, etc.)
3. **`unwind_templates()`** — **Cartesian product generator**: each card row expands into many autocomplete entries — combinations of 10 templates × responses × situations × orgs × cities. This is the most memory/compute-intensive operation per row. Filters out entries for ignored situations, invalid org IDs, and non-Hebrew city names. Marks entries as `low` (less relevant) when the taxonomy ID is from a parent rather than a direct match.
4. **`DF.sort_rows(['importance'])`** — sort by template importance (earlier templates = higher importance)
5. **`DF.join_with_self('autocomplete', ['query'], ...)`** — deduplicate: group by query string, count occurrences as `score`, keep first-seen values for all other fields
6. **`get_bounds()`** — fuzzy-match city names against a location dataset to get geo bounding boxes
7. **`DF.set_type('score', transform=lambda v: (log(v) + 1)**2)`** — logarithmic scoring by frequency
8. **`DF.set_type('score', transform=...)`** — override score to 0.5 for `low` entries
9. **`DF.set_type(...)` × several** — apply ES type hints: `es:autocomplete`, `es:hebrew`, `es:keyword`
10. **`DF.add_field('id', ...)`** — generate ID from alphanumeric chars in query
11. **`DF.dump_to_path('data/autocomplete')`** — write to disk

**Cache location:** `data/autocomplete/` — implicitly overwritten each run (no explicit `shutil.rmtree()`).

The autocomplete output is later loaded by `to_es.py` (Stage 4) for indexing into the Elasticsearch autocomplete index.

---

## Stage 4: to_es — Elasticsearch Loading

<!-- TODO: Fill in Plan 04 -->

---

## Stage 5: to_sql — Airtable Card Upload

<!-- TODO: Fill in Plan 04 -->

---

## Helper Modules

### helpers.py — Shared Preprocessing Flows

<!-- TODO: Fill in Plan 04 -->

### autotagging.py — Auto-tagging Rules

<!-- TODO: Fill in Plan 04 -->

### es_schemas.py — ES Field Schema Constants

<!-- TODO: Fill in Plan 04 -->

### es_utils.py — ES Connection and Loading

<!-- TODO: Fill in Plan 04 -->

### manual_fixes.py — Manual Fix Application

<!-- TODO: Fill in Plan 04 -->

---

## Checkpoint & Cache Map

<!-- TODO: Fill in Plan 05 -->

---

## External Dependencies Reference

<!-- TODO: Fill in Plan 04 -->
