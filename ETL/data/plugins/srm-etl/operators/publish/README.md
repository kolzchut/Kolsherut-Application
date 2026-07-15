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
  5. es_publish            - srm__cards + srm__autocomplete, revision-swap reindex
  finally: write_stats_to_airtable() - single batched write to the Stats table
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
5. Only `srm__cards` and `srm__autocomplete` are published; `srm__places`, `srm__responses`,
   `srm__situations`, `srm__orgs` had no consumer and were dropped.
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

Everything else - card identity (`card_id = hasher(branch_id, service_id)`), the
Data-Import copy semantics, Cards lifecycle, autocomplete templates/scoring, ES revision
swap - is preserved exactly.

## Before the first run: freeze the ES mappings

The index mappings are frozen JSON snapshots of the mappings the legacy generator produced
(`es_publish/mappings/srm__*.json`). They are committed EMPTY and the operator refuses to
publish until they are frozen from the live cluster:

```
python -m verification.run_verification freeze_mappings
```

## Migration verification

All one-shot migration checks live in the sibling [`verification/`](../../verification)
package (`python -m verification.run_verification <check>`): pull_parity, capture_fixture,
run_build_on_fixture, cards_diff, autocomplete_diff, es_corpus_diff, mapping_parity,
freeze_mappings, cards_sync_idempotency, sync_semantics. Each writes a timestamped report
under `verification/reports/`; a human reads it and decides. The legacy baseline is the
saved `data/` output of one final instrumented `derive` run with `PYTHONHASHSEED=0`.

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
