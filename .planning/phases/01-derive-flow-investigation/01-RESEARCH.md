# Phase 1: Derive Flow Investigation — Research

**Researched:** 2026-03-22
**Status:** RESEARCH COMPLETE

## Summary

All derive source files (12 modules) and the dataflows package internals (v0.5.5) have been fully read and analyzed. The derive operator is a 5-stage sequential pipeline (`from_curation` → `to_dp` → `autocomplete` → `to_es` → `to_sql`) that transforms Airtable curation data into Elasticsearch indexes and Airtable card records. The `to_dp.py` module is the largest (946 lines) with 5 nested sub-flows. Across the entire derive pipeline, there are **7 distinct cache/checkpoint locations**: 3 `dump_to_path` caches in `from_curation`, 1 `checkpoint` + 5 `dump_to_path` in `to_dp`, 1 `dump_to_path` in `autocomplete`, and 1 `checkpoint` in `to_es`.

The key insight for the analysis document: **`dataflows` is a processor-chaining framework where `Flow()` builds a lazy pipeline of `DataStreamProcessor` objects that only execute when `.process()` or `.results()` is called.** Each processor wraps the upstream DataStream and produces a new DataStream — it's a decorator/wrapper pattern, not a push-based event system.

## Domain Analysis

### What is `dataflows`?

`dataflows` (v0.5.5) is a Python data processing framework built around the [Frictionless Data](https://frictionlessdata.io/) specification. It provides:

1. **`Flow`** — a pipeline builder that chains processors together
2. **Processors** — built-in data transformation steps (filter, join, rename, set_type, dump, load, checkpoint, etc.)
3. **Data Packages** — the unit of data: a descriptor (JSON schema) plus resource iterators (rows)

The framework is designed for ETL-like batch processing where you declare a pipeline of steps and then execute it.

### How Flow() Works (The Core Mechanism)

**This is the single most important thing to explain in the analysis document.**

```python
# From dataflows/base/flow.py
class Flow:
    def __init__(self, *args):
        self.chain = args  # Store all steps as a tuple

    def process(self):
        return self._chain().process()  # Build chain, then drain it

    def _chain(self, ds=None):
        for link in self._preprocess_chain():
            if isinstance(link, Flow):
                ds = link._chain(ds)          # Nested flows get flattened
            elif isinstance(link, DataStreamProcessor):
                ds = link(ds, position=...)    # Processor wraps upstream
            elif isfunction(link):
                # Auto-detect function signature:
                #   f(row)     → row_processor
                #   f(rows)    → rows_processor  
                #   f(package) → datapackage_processor
                ds = auto_wrapped(link)(ds)
            elif isinstance(link, Iterable):
                ds = iterable_loader(link)(ds) # Lists/dicts become resources
        return ds
```

**Key insight:** `_chain()` doesn't execute anything. It **wraps** each step around the previous DataStream, building a nested chain of `DataStreamProcessor` objects. Execution only happens when `.process()` is called, which calls `_process()` on the outermost processor, triggering a cascade inward.

**Execution model:**
1. The outermost processor calls `self.source._process()` to get the upstream DataStream
2. That upstream processor does the same thing, recursively
3. The innermost processor (or `None` → empty DataStream) produces the initial data
4. Each processor then wraps the resource iterators with its own logic using `LazyIterator`
5. The data is pulled through the chain only when rows are actually consumed (by `dump_to_path`, `checkpoint`, or `.process()` draining)

**This is a pull-based lazy pipeline**: data only flows when the terminal consumer reads rows. No work is done until `.process()` or `.results()` iterates through everything.

### Function Auto-Detection

When a bare function is passed to `Flow()`, dataflows inspects its signature:

| Signature | Behavior |
|-----------|----------|
| `def f(row):` | Called once per row, returns modified row |
| `def f(rows):` | Receives a generator of all rows in a resource, must yield rows |
| `def f(package):` | Receives the `PackageWrapper`, can modify schema/metadata |

This explains why derive code freely mixes `DF.*` calls with plain functions — they're all valid Flow steps.

## Technical Findings

### dataflows Core Mechanics

#### DataStream and DataStreamProcessor

Every step in a Flow is (or becomes) a `DataStreamProcessor`. Each processor:
1. Receives a `DataStream` (containing a Package descriptor + resource iterators)
2. Optionally modifies the package descriptor (`process_datapackage`)
3. Wraps the resource iterators with its own processing logic (`process_resources`)
4. Returns a new `DataStream` with the wrapped iterators

```python
class DataStreamProcessor:
    def _process(self):
        datastream = self.source._process()       # ← recursive: get upstream data
        self.datapackage = copy(datastream.dp)
        self.datapackage = self.process_datapackage(self.datapackage)
        return DataStream(
            self.datapackage,
            LazyIterator(self.get_iterator(datastream)),  # ← wraps iterators lazily
            datastream.stats + [self.stats]
        )
```

The `LazyIterator` is critical — it stores a *function that creates an iterator*, not the iterator itself. The function is only called when someone starts iterating. This is what makes the pipeline lazy.

#### DF.checkpoint (NDJSON Serialization)

`checkpoint` is a special `Flow` subclass that intercepts the chain-building process:

```python
class checkpoint(Flow):
    def _preprocess_chain(self):
        if os.path.exists(self.filename):
            # Cache HIT: replace entire upstream chain with file reader
            return unstream(self.filename),
        else:
            # Cache MISS: append stream-to-file writer after upstream chain
            return chain(self.chain, (stream(self.filename), ...))
    
    def handle_flow_checkpoint(self, parent_chain):
        # ABSORB all prior steps into this checkpoint
        self.chain = chain(self.chain, parent_chain)
        return [self]
```

**Critical behavior:** When a checkpoint is placed inside a `Flow()`, it "absorbs" all steps before it in the parent Flow via `handle_flow_checkpoint`. This means:
- **Cache miss:** All upstream steps execute, rows are serialized to `.checkpoints/<name>/stream.ndjson`, then passed downstream
- **Cache hit:** All upstream steps are **skipped entirely**, rows are deserialized from the NDJSON file

**Serialization format:** NDJSON (Newline-Delimited JSON). The `stream` processor writes each row as a JSON line. The `unstream` processor reads them back. The first line is the package descriptor.

**Cache invalidation:** Manual only. The derive code explicitly deletes checkpoint directories with `shutil.rmtree()` before running. There is no automatic invalidation based on data changes.

#### DF.dump_to_path (Disk Persistence)

`dump_to_path` writes all resources to disk as CSV files + a `datapackage.json` descriptor. Unlike `checkpoint`:
- It always writes (no cache-hit shortcut)
- Output format is CSV (not NDJSON)
- Creates a standard Frictionless Data Package on disk
- The data can be loaded back with `DF.load('path/datapackage.json')`

In derive, `dump_to_path` serves as inter-stage communication: Stage 1 dumps to disk → Stage 2 loads from disk.

#### DF.load

Loads a previously dumped data package from disk into the flow as new resources. Takes a `datapackage.json` path and optionally a `resources` list to select specific resources.

#### DF.join

SQL-like join between two resources in the flow. Consumes the source resource entirely into memory (via KVFile for large datasets), then looks up matching rows for the target resource.

```
DF.join('source_resource', ['key_field'], 'target_resource', ['key_field'], fields={...})
```

Fields dict specifies which source fields to pull onto target rows, with optional aggregation (count, sum, set, array, first, etc.).

#### DF.join_with_self

Self-join: groups rows by key within a single resource, applying aggregations. Used for deduplication and counting.

#### DF.set_type

Modifies the schema type of a field and optionally applies a transform function to every value. Commonly used in derive for type coercion and data cleaning.

#### DF.filter_rows

Passes only rows matching a predicate function. Optionally scoped to specific resources.

#### DF.select_fields / DF.delete_fields

Schema-level field selection/deletion. Removes columns from both the data and the descriptor.

#### DF.update_resource / DF.update_package

Modifies resource or package metadata (name, path, title, etc.).

#### DF.validate

Validates all rows against the current schema. Raises on type mismatches.

#### DF.sort_rows

Sorts resource rows by a key expression.

#### DF.finalizer

Registers a callback that runs after all resources have been fully consumed. Used in `es_utils.py` to delete old ES documents after new ones are loaded.

### Derive Execution Flow

#### Entry Point: `__main__.py`

```python
import operators.derive
operators.derive.deriveData()
```

Simple — just calls `deriveData()` from `__init__.py`.

#### Orchestrator: `__init__.py`

```python
def deriveData(*_):
    from_curation.operator()   # Stage 1: Copy data from curation Airtable base
    to_dp.operator()           # Stage 2: Transform into card data packages
    autocomplete.operator()    # Stage 3: Generate autocomplete suggestions
    to_es.operator()           # Stage 4: Load into Elasticsearch
    to_sql.operator()          # Stage 5: Upload cards to Airtable
```

Each stage runs synchronously, sequentially. The `invoke_on` wrapper catches exceptions and sends email notifications on failure.

#### Stage 1: `from_curation.py` — Copy Data from Curation Base

**Purpose:** Copy Organizations, Branches, and Services from the Airtable curation base to the production Airtable base, applying manual fixes and filtering.

**Flow pattern:** For each of 3 tables (Organizations, Branches, Services):
1. Load from curation Airtable base
2. `DF.dump_to_path` → local cache (e.g., `.checkpoints/from-curation-Organizations/`)
3. Filter rows without a `decision` field, set decision to "New"
4. Write back to curation base (updates the `decision` field)
5. Load from the local cache (not directly from Airtable again)
6. Apply filters: Active status, not Rejected/Suspended, has services
7. Apply manual fixes from `ManualFixes` class
8. Write to production Airtable base via `airtable_updater`

**Cache locations (3):**
- `from-curation-Organizations/` — all Organization records dumped as data package
- `from-curation-Branches/` — all Branch records dumped as data package
- `from-curation-Services/` — all Service records dumped as data package

These caches are explicitly deleted with `shutil.rmtree()` at the start of each table processing.

#### Stage 2: `to_dp.py` — Core Data Transformation (946 lines)

**Purpose:** Transform the raw Airtable data into a denormalized "card data" format suitable for Elasticsearch indexing.

**Entry:**
```python
def operator(*_):
    shutil.rmtree(f'.checkpoints/{CHECKPOINT}', ...)  # Delete 'to_dp' checkpoint
    shutil.rmtree(f'.checkpoints/srm_raw_airtable_buffer', ...)  # Delete raw buffer

    # Also clean all intermediate dump_to_path outputs:
    for subdir in ('srm_data', 'flat_branches', 'flat_services', 'flat_table', 'card_data'):
        shutil.rmtree(f'{settings.DATA_DUMP_DIR}/{subdir}', ...)

    branch_mapping = dict()
    srm_data_pull_flow().process()      # Sub-flow 1
    flat_branches_flow(branch_mapping).process()   # Sub-flow 2
    flat_services_flow(branch_mapping).process()   # Sub-flow 3
    flat_table_flow().process()         # Sub-flow 4
    card_data_flow().process()          # Sub-flow 5
```

**Sub-flow 1: `srm_data_pull_flow()`** — Pull all curated data from Airtable

Loads 6 Airtable tables (Responses, Situations, Organizations, Locations, Branches, Services) into the flow, applies a `checkpoint('srm_raw_airtable_buffer')` to cache the raw Airtable data, then preprocesses each table via `helpers.preprocess_*()` functions, and dumps to `data/srm_data/`.

```
Airtable (6 tables) → checkpoint('srm_raw_airtable_buffer') → preprocess_* → dump_to_path('data/srm_data')
```

**Sub-flow 2: `flat_branches_flow(branch_mapping)`** — Denormalize branches

Loads branches, locations, organizations from `data/srm_data/`. Joins location data onto branches, joins organization data onto branches. Merges duplicate branches (same org + geometry + name). Outputs a flat branch record with all org fields inlined.

```
load(srm_data) → join(locations→branches) → join(organizations→branches) → merge_duplicates → dump_to_path('data/flat_branches')
```

**Sub-flow 3: `flat_services_flow(branch_mapping)`** — Denormalize services

Loads flat_branches and services. Joins organization branches onto services, merges direct + org branches, unwinds into one row per service-branch pair. Deduplicates services that implement other services.

```
load(flat_branches + srm_data/services) → unwind(orgs) → join(branches→services) → merge branches → unwind(branch_key) → dump_to_path('data/flat_services')
```

**Sub-flow 4: `flat_table_flow()`** — Join services with branches

Joins flat_branches with flat_services to produce a fully denormalized table with one row per (service, branch) pair. Deduplicates.

```
load(flat_branches + flat_services) → join(branches→services) → dedup → dump_to_path('data/flat_table')
```

**Sub-flow 5: `card_data_flow()`** — Build card data

The most complex sub-flow. Loads flat_table, maps taxonomy IDs, applies auto-tagging, computes RS scores, adds parent taxonomy IDs, generates possible autocomplete values, computes location-based fields, address parts, org name parts, etc.

```
load(flat_table) → add card_id → merge_duplicate_services → map taxonomy IDs → auto_tagging
    → checkpoint('to_dp')  [SPLITS HERE]
    → add situations/responses objects → RS score → add parent IDs → add autocomplete
    → add address_parts → add org_name_parts → dump_to_path('data/card_data')
```

Key design: The `checkpoint('to_dp')` in the middle of `card_data_flow()` caches the intermediate result AFTER taxonomy mapping and auto-tagging, but BEFORE the expensive RS score calculation and field enrichment. The second half of the flow loads from this checkpoint.

**The `RSScoreCalc` class** is special — its `__init__` method runs a *separate* `DF.Flow` that reads from the `to_dp` checkpoint to compute per-response/situation frequencies, then provides a scoring function used in the main flow.

### Checkpoint/Cache Locations

| # | Location | Module | Type | What It Caches | Invalidation |
|---|----------|--------|------|---------------|--------------|
| 1 | `from-curation-Organizations/` | `from_curation.py` | `dump_to_path` | Raw Organization records from curation Airtable base | Explicit `shutil.rmtree()` per-table before each copy |
| 2 | `from-curation-Branches/` | `from_curation.py` | `dump_to_path` | Raw Branch records from curation Airtable base | Explicit `shutil.rmtree()` per-table before each copy |
| 3 | `from-curation-Services/` | `from_curation.py` | `dump_to_path` | Raw Service records from curation Airtable base | Explicit `shutil.rmtree()` per-table before each copy |
| 4 | `.checkpoints/srm_raw_airtable_buffer/` | `to_dp.py` (in `srm_data_pull_flow`) | `checkpoint` (NDJSON) | All 6 Airtable tables (Responses, Situations, Organizations, Locations, Branches, Services) raw | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 5 | `data/srm_data/` | `to_dp.py` (in `srm_data_pull_flow`) | `dump_to_path` | Preprocessed versions of all 6 tables | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 6 | `data/flat_branches/` | `to_dp.py` (in `flat_branches_flow`) | `dump_to_path` | Denormalized branch records with org + location joined | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 7 | `data/flat_services/` | `to_dp.py` (in `flat_services_flow`) | `dump_to_path` | Denormalized service records with branch keys | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 8 | `data/flat_table/` | `to_dp.py` (in `flat_table_flow`) | `dump_to_path` | Fully joined service+branch table (one row per pair) | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 9 | `.checkpoints/to_dp/` | `to_dp.py` (in `card_data_flow`) | `checkpoint` (NDJSON) | Card data after taxonomy mapping + auto-tagging, before RS score | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 10 | `data/card_data/` | `to_dp.py` (in `card_data_flow`) | `dump_to_path` | Final card data with all enrichments | Explicit `shutil.rmtree()` in `to_dp.operator()` |
| 11 | `data/autocomplete/` | `autocomplete.py` | `dump_to_path` | Generated autocomplete suggestions | Implicit (overwritten each run) |
| 12 | `.checkpoints/to_es/data_api_es_flow/` | `to_es.py` (in `data_api_es_flow`) | `checkpoint` | Cards after ES scoring, before ES load | Explicit `shutil.rmtree()` in `to_es.operator()` |
| 13 | `data/place_data/` | `to_es.py` | `dump_to_path` | Location bounds for places | Explicit `shutil.rmtree()` in `to_es.operator()` |
| 14 | `data/response_data/` | `to_es.py` | `dump_to_path` | Response taxonomy with card counts | Explicit `shutil.rmtree()` in `to_es.operator()` |
| 15 | `data/situation_data/` | `to_es.py` | `dump_to_path` | Situation taxonomy with card counts | Explicit `shutil.rmtree()` in `to_es.operator()` |

**Total: 3 NDJSON checkpoints + 12 dump_to_path caches = 15 persistence points.**

The checkpoint vs dump_to_path distinction matters:
- **`checkpoint`** (NDJSON): All-or-nothing cache shortcut. On cache hit, the entire upstream pipeline is skipped. On miss, data passes through AND gets written. The derive code always deletes checkpoints before running, so they effectively **never hit** in the current codebase — they serve as debugging/restart aids.
- **`dump_to_path`** (CSV + datapackage.json): Always writes. Serves as the inter-sub-flow communication mechanism — sub-flow N dumps, sub-flow N+1 loads.

### Sub-module Roles

| Module | Lines | Role |
|--------|-------|------|
| `__init__.py` | 30 | **Orchestrator** — Calls all 5 stage operators sequentially with logging |
| `__main__.py` | 3 | **CLI entry point** — Simply calls `deriveData()` |
| `from_curation.py` | 201 | **Stage 1: Data Import** — Copies Organizations/Branches/Services from curation Airtable base to production base, applying filters (active, not rejected) and manual fixes |
| `to_dp.py` | 946 | **Stage 2: Core Transformation** — 5 sub-flows that progressively denormalize data from 6 Airtable tables into a single flat card_data table. Handles merging, deduplication, taxonomy mapping, auto-tagging, RS scoring, address parsing |
| `autocomplete.py` | 217 | **Stage 3: Autocomplete Generation** — Produces search autocomplete suggestions by combining response names, situation names, org names, and cities using template patterns |
| `to_es.py` | ~300 | **Stage 4: ES Loading** — Loads data into 6 ES indexes: cards, places, responses, situations, organizations, autocomplete. Applies scoring and field typing |
| `to_sql.py` | ~140 | **Stage 5: Card Upload** — Writes card data back to Airtable Cards table (currently only uploads a small field subset) |
| `helpers.py` | 389 | **Shared Utilities** — Preprocessing flows for each table type (responses, situations, services, organizations, branches, locations); validation functions; address/org name parsing; taxonomy parent expansion |
| `autotagging.py` | ~80 | **Auto-tagging** — Loads rules from Airtable, applies keyword-based tagging: if org name/purpose/service name contains a query string, add corresponding situation/response IDs |
| `es_schemas.py` | ~55 | **ES Schema Constants** — Defines `es:*` type hints used by `dataflows_elasticsearch` to generate ES mappings (keyword, text+hebrew analyzer, nested objects, etc.) |
| `es_utils.py` | ~95 | **ES Connection + Loading** — Creates ES client, custom `SRMMappingGenerator` that adds Hebrew analyzer fields, `dump_to_es_and_delete` that loads data then deletes old revisions |
| `manual_fixes.py` | ~170 | **Manual Fixes** — Loads correction rules from Airtable, applies field-level overrides to records during curation copy. Tracks fix application status (Active/Obsolete) |

### External Dependencies

| Dependency | What It Provides |
|------------|-----------------|
| `conf.settings` | All configuration: Airtable base IDs, table names, API keys, ES host/port, data dump directory, external API URLs. Loaded from environment variables via `dotenv`. |
| `srm_tools.logger` | Python logging wrapper |
| `srm_tools.processors` | `fetch_mapper` / `update_mapper` — helper processors for Airtable bulk update patterns |
| `srm_tools.stats.Stats` | Load/update stats records in Airtable; `filter_with_stat` filters rows and records rejected count in Airtable Stats table |
| `srm_tools.stats.Report` | Collects rejected records for specific filters into a report |
| `srm_tools.update_table.airtable_updater` | Bulk update flow for Airtable: loads existing records, diffs with new data via hash, writes only changed records |
| `srm_tools.hash.hasher` | SHA-1 based short hash for generating deterministic IDs |
| `srm_tools.unwind.unwind` | Array unwinding processor (one-to-many row expansion) similar to MongoDB's `$unwind` |
| `srm_tools.data_cleaning.clean_org_name` | Organization name normalization |
| `srm_tools.error_notifier.invoke_on` | Try/except wrapper that sends email notification on failure |
| `dataflows_airtable` | `load_from_airtable` — Airtable source processor; `dump_to_airtable` — Airtable sink processor; `AIRTABLE_ID_FIELD` constant |
| `dataflows_elasticsearch` | `dump_to_es` — Elasticsearch bulk index processor |
| `dataflows_ckan` | `dump_to_ckan` — CKAN open data portal sink (referenced but not actively used in derive) |

## Validation Architecture

To validate the analysis document is complete and accurate:

1. **Completeness check:** Every `DF.*` call in every derive file should be explained in the document. Count them: there are approximately 120+ distinct `DF.*` calls across the 12 files. Group by processor type — not every instance needs individual coverage, but every *type* of `DF.*` call and its role in that context should be documented.

2. **Flow diagram cross-validation:** The Mermaid diagrams should trace the data lineage from Airtable input to ES output. Verify that every `dump_to_path` output maps to a corresponding `DF.load` input in a downstream sub-flow.

3. **Checkpoint inventory:** Cross-reference the checkpoint/cache table against actual `shutil.rmtree()` calls in `operator()` functions — ensure all are accounted for.

4. **Functional test:** After reading the analysis document, a developer should be able to answer: "If I add a new field to the Services table in Airtable, which files and sub-flows would need modification?" If the document enables answering this, it's complete.

## Approach Recommendations

### Document Structure (matches D-03: top-down approach)

Recommended structure for the analysis markdown:

1. **Overview** — What derive does in one paragraph + high-level Mermaid diagram of the 5 stages
2. **How dataflows Works** — Inline explanation (per D-03: "explain concepts as they appear")
   - Flow(), processors, lazy evaluation — ~2 paragraphs with code snippet
   - checkpoint vs dump_to_path — comparison table
   - Function auto-detection (row/rows/package parameter names)
3. **Stage 1: from_curation** — Walk through the code with inline explanations
4. **Stage 2: to_dp** — The big one. Break into 5 sub-flow sub-sections
5. **Stage 3: autocomplete** — Template generation, deduplication, scoring
6. **Stage 4: to_es** — 6 ES indexes, scoring, the revision/delete pattern
7. **Stage 5: to_sql** — Airtable card upload
8. **Checkpoint/Cache Map** — Summary table of all persistence points
9. **Key Helper Functions** — Essential helpers grouped by purpose

### Diagram Choices (per D-04)

- **Mermaid `graph TD`** for the top-level 5-stage pipeline and each sub-flow's data lineage — renders in GitHub and VS Code
- **Mermaid `sequenceDiagram`** for the `dump_to_es_and_delete` load-then-purge pattern
- **ASCII** for inline step-by-step within a sub-flow where Mermaid gets too wide (e.g., the 20+ steps in `card_data_flow`)

### Estimated Size

Based on the complexity found:
- `to_dp.py` alone has ~120 `DF.*` calls across 5 sub-flows with dense logic
- Estimated final document: 800-1200 lines of markdown
- May benefit from splitting into sections with a table of contents

## Risks & Concerns

1. **Dead code in `to_sql.py`:** The original `dump_to_sql_flow()` function is commented out. Only `cards_to_at_flow()` (Airtable upload) is active. The module name `to_sql` is misleading — it actually writes to Airtable now.

2. **Checkpoint behavior is counterintuitive:** The `handle_flow_checkpoint` method makes `checkpoint` "absorb" all preceding steps in the parent Flow. This means a checkpoint in the middle of a Flow captures everything before it as its "upstream," not just the immediately preceding step. This is crucial to document and will confuse readers if not explicitly explained.

3. **Checkpoints are always deleted before use:** In both `to_dp.operator()` and `to_es.operator()`, checkpoint directories are explicitly removed. This means checkpoints never actually serve as caches during normal operation — they only provide restart capability if the operator crashes mid-run and is restarted without the cleanup.

4. **RS score computation has a side-channel:** `RSScoreCalc.__init__` runs a separate `DF.Flow` reading from the `to_dp` checkpoint to compute statistics. This flow-within-a-flow pattern is unusual and must be highlighted.

5. **`from_curation` uses `dump_to_path` as cache, not `checkpoint`:** Unlike the other stages, from_curation uses dump_to_path with `DF.load` to avoid re-fetching from Airtable within the same function. This is a different caching pattern than `checkpoint`.

6. **`sys.setrecursionlimit(5000)`** in `to_dp.py` — indicates the pipeline chain can get very deep with nested Flows. This is worth mentioning as a practical consideration.

7. **The `merge_duplicate_branches` and `merge_duplicate_services` functions use a consuming-generator pattern:** They buffer all rows in memory, dedup, then yield — breaking the streaming model. This is by design but worth documenting.

8. **`autocomplete.py`'s `unwind_templates()` is a Cartesian product generator:** Each card row expands into many autocomplete entries (combinations of templates × responses × situations × orgs × cities). This is the most memory/compute-intensive operation per row.

## Key Decisions for Planner

1. **Clone dataflows source?** Decision D-01 said to clone. Based on research, the installed package source at `site-packages/dataflows/` was sufficient to understand the internals. Cloning is optional but could be useful if the analysis document wants to link to specific source files. **Recommend: skip the clone, reference the GitHub repo instead.**

2. **Scope of DF.* explanations (D-05):** Every `DF.*` call gets coverage, but the ~15 unique processor types can be explained once with a reference table. Individual call sites get context-specific one-liners (e.g., "filters out inactive services" not a re-explanation of `filter_rows`).

3. **Document splitting:** The document may exceed 1000 lines. Consider whether to keep it as one file (easier to search) or split by stage (easier to navigate). **Recommend: single file with TOC and internal anchor links.**

4. **Diagram creation approach:** All Mermaid diagrams should be defined inline in the markdown. No external tools needed. Test rendering in VS Code Markdown Preview.

5. **Implementation estimate:** The analysis document itself is the deliverable (ANLYS-07). Producing it requires walking through each function and documenting what each step does. Given the complexity of `to_dp.py` (946 lines, 5 sub-flows, ~120 DF.* calls), this is probably 2-3 plan files with one focusing on `to_dp.py` alone.

6. **Testing approach:** No code tests needed (investigation spike). Validation is "can a developer read this and understand derive?" Consider including a "reading guide" section that tells the reader how to follow along in the source code.

## RESEARCH COMPLETE
