# The `publish` Operator

The plain-Python rewrite of `operators/derive`: one operator, five explicit stages, a single
Airtable pull, and a fully in-memory pipeline. No dataflows, no local datapackages, no
checkpoints. Reference for the legacy behavior: [operators/derive/README.md](../derive/README.md).

## Stages (`main.py`)

```
run_publish_pipeline()
  1. copy_from_data_import - Data-Import base -> main base (MUST run before the pull)
  2. data_build            - one pull of the six main-base tables + pure card build -> PipelineData
  3. autocomplete_generation - cards + static places.csv -> autocomplete rows
  4. cards_sync            - 8-field Cards table write-back (upsert by card_id, vanished -> INACTIVE)
  5. es_publish            - srm__cards + srm__autocomplete + srm_services, revision-swap reindex
  finally: write_stats_to_airtable() - single batched write to the Stats table
           push_collected_audit_to_repository() - one audit commit of every Airtable write (best-effort)
```

`PipelineData` (source_tables / cards / autocomplete) replaces the entire legacy `data/` folder.

## Running

- Cronicle / production: the package `operator()` (wraps the pipeline with the failure
  e-mail notifier, like every other operator).
- Manually: `python -m operators.publish [--dump-dir <dir>]`. Unlike legacy `derive`,
  `python -m` also goes through the notifier. `--dump-dir` writes the in-memory
  intermediates (source_tables / cards / autocomplete) to JSON for debugging.

## Deliberate behavior changes vs `derive`

1. Elasticsearch connection failure raises (and e-mails) instead of silently skipping indexing.
2. Stats are written once, batched, at the end of the run (was one Airtable write per stat).
3. `python -m operators.publish` sends the failure e-mail too.
4. Autocomplete queries with an unknown city are always kept with `bounds=None` (logged once per city).
5. `srm__cards`, `srm__autocomplete` and `srm_services` are published; `srm__places`,
   `srm__responses`, `srm__situations`, `srm__orgs` had no consumer and were dropped.
   `srm_services` mirrors the Airtable Services table (one document per service, from the
   preprocessed `source_tables['services']`, keyed by the service `id`).
6. Set-derived taxonomy id lists are sorted (the legacy order was hash-seed dependent).
7. All dead code from the legacy operator (README §12) was not ported.
8. The copy filters and manual fixes no longer touch the main-base `current` resource. In
   legacy `from_curation`, the unguarded dataflows steps (the branches "No Valid Organization"
   filter, the services "No Valid Organization/Branch" filter, and `apply_manual_fixes` in all
   three tables) also processed the main-base table inside `airtable_updater`. That could drop
   a current row and cause its re-fetched twin to be CREATED AS A DUPLICATE record, and could
   skip the INACTIVE marking of vanished rows without valid links. The new code applies them to
   the rows fetched from the Data-Import base only. **Staging step-8 comparison note:** expect
   exactly these two diff classes vs a legacy run - no duplicate records created, and possible
   extra INACTIVE writes.
9. Stage order: `cards_sync` runs BEFORE `es_publish` (legacy ran ES first). An ES outage
   therefore aborts after the Cards table write-back - the Cards table can briefly be one run
   ahead of the site until the rerun. Rerun-safe either way.
10. The frozen index mappings and the ES connection are validated at pipeline start, before any
    external write. An ES outage now aborts the run before the Data-Import copy (legacy
    promoted regardless of ES state).
11. Duplicate logical ids in a copy batch are MERGED into one record before upsert
    (`airtable/merge_fetched_rows/`): connection/list fields (service `organizations`/`branches`,
    branch `organization`/`location`, `situations`/`responses`/`urls`/... ) are unioned so no link
    is lost, and scalar fields keep the FIRST non-empty value. Scalars the duplicates disagree on
    (both non-empty, different) are DISPUTED: the value already stored in the main base wins when
    there is one, otherwise the first non-empty duplicate value - so a raw feed row (e.g.
    `mol_daycare`'s "עירית ערד") can never overwrite a curated twin (`meser`'s "עיריית ערד").
    Every dispute is logged. Legacy `from_curation` had no real dedup - two Data-Import rows
    sharing an id (e.g. an org written by both `meser` and `soproc`/`entities`) produced
    order-dependent last-write-wins overwrites into a single existing record, or duplicate CREATEs
    for a brand-new id; in practice the curated main-base value survived, which this dispute rule
    reproduces deterministically. `merge_fetched_row` still overwrites the existing main-base
    row's links with the (now unioned) incoming set - it is not unioned against the current
    record, since the copy re-derives every link from the Data-Import base each run.
12. Manual fixes are RE-APPLIED after the duplicate-id merge (`sync_table_rows`'s
    `transform_merged_data` hook, passed by all three copy modules): the pre-merge pass alone let
    a duplicate row clobber a fixed value while the fix was still reported `Active`. The pre-merge
    pass is kept (a `location` fix must land before `remap_branch_location`); re-application is
    idempotent, and a fix whose `current_value` no longer matches the merged value now truthfully
    reports `Obsolete`.
13. A branch with no Data-Import `location` is copied with `location=[]` (legacy and the first
    publish version produced `[None]`, which defeated the no-location guard downstream), and the
    Location id -> record id map also registers whitespace-stripped ids, matching the stripped
    lookup key in `remap_branch_location` - so a padded Location id can no longer make Airtable
    auto-create a duplicate, ungeocodable Location. Known limitation: `hash_row` deletes all
    whitespace, so a whitespace-only correction to an existing row classifies UNCHANGED and is
    written only when another field changes too.
14. Every Airtable write (both bases, all tables) is also committed to a dedicated audit
    repository, one commit per run: `runs/<UTC timestamp>/<base>/<table>/<update|create>.json`
    with the exact request payloads (`airtable/audit_collector.py` -> `airtable/audit_publisher.py`
    -> `shared/github_commit_push.py`, Git Data API - the container has no git CLI). The push runs
    in the `finally` block after the stats write (so the stats write is audited too) and is
    best-effort: a failure is logged and never fails the pipeline.

Everything else - card identity (`card_id = hasher(branch_id, service_id)`), Cards lifecycle,
autocomplete templates/scoring, ES revision swap - is preserved exactly.

## Audit repository configuration

The audit push (deliberate change #14) is configured in `conf/settings.py` via environment
variables; when `ETL_AUDIT_REPO_FULL_NAME` is unset the feature is a silent no-op.

| Environment variable | Meaning | Default |
|---|---|---|
| `ETL_AUDIT_REPO_FULL_NAME` | Target repo, `owner/name` (e.g. `kolzchut/Kolsherut-Airtable-Audit`) | unset = audit disabled |
| `ETL_AUDIT_REPO_BRANCH` | Branch the run commits land on | `main` |
| `ETL_AUDIT_REPO_TOKEN` | GitHub token with `contents:write` on the repo | falls back to `KZ_GITHUB_TOKEN` |

## The frozen ES mappings

The index mappings are frozen JSON snapshots of the mappings the legacy generator produced
(`es_publish/mappings/srm__*.json`). They are committed already frozen; the operator refuses
to publish while a mapping file is missing or empty, so a wrong mapping can never be created
silently. To re-freeze from the live cluster:

```
python -m verification.run_verification freeze_mappings
```

`srm_services.json` is the exception: it is a brand-new index with nothing on the live cluster
to freeze from, so it is hand-authored (service field types mirror the `service_*` fields in
`srm__cards.json`, plus the `revision` keyword the purge query needs). Elasticsearch dynamic
mapping covers any Services field not declared there.

## Migration verification

All one-shot migration checks live in the sibling [`verification/`](../../verification)
package (`python -m verification.run_verification <check>`): pull_parity, capture_fixture,
run_build_on_fixture, cards_diff, autocomplete_diff, es_corpus_diff, mapping_parity,
freeze_mappings, cards_sync_idempotency, sync_semantics, merge_ab. Each writes a timestamped
report under `verification/reports/`; a human reads it and decides. The legacy baseline is the
saved `data/` output of one final instrumented `derive` run with `PYTHONHASHSEED=0`.

`merge_ab` is different from the others: it does not compare against the legacy `derive`
baseline. It runs the Data-Import copy twice (production merge vs the old keep-richest
collapse), holding everything else constant, so every diff it reports is attributable to the
duplicate-row merge (change #11) alone - use it to size that change's impact in isolation.

## Cutover checklist (after staging verification)

1. Point the Cronicle job at `operators.publish` (Cronicle UI, not the repo).
2. Keep `operators/derive` one release for rollback.
3. Delete `operators/derive` - nothing imports from it anymore (`geocode` and
   `manual_data_entry` were repointed to `operators.publish.shared.*`, and the deprecated
   `presets` operator's unreachable body was stripped).
4. Delete the four orphan indexes (`srm__places`, `srm__responses`, `srm__situations`,
   `srm__orgs`) once the snapshot-process owner confirms the consumer list.
5. Delete or archive the `verification/` package.

## Post-migration cleanup candidates

- `es_publish/card_search_fields.py :: parse_date` / `airtable_last_modified` keep the legacy
  contract exactly, including the legacy landmine: a present-but-unparseable
  `service_last_modified` string makes `max()` of an empty sequence raise. Kept for golden-master
  parity; harden after cutover.
