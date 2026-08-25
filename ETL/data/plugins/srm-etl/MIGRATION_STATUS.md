# YAML Engine Migration Status

One generic engine (`engine/`, run as `python -m engine <spec_name>`) replaces the per-operator
ETL scripts that used to live under `operators/`. Each data source is described by one spec in
`specs/`.

All 11 datasets (mental_health_clinics, tipat, gilzahav, shil, kolzchut_orgs, revaha, day_care,
child_care, soproc, entities, meser) were parity-verified — the old operator and the new
spec-driven engine were run on the same input (network and Airtable mocked) and produced
identical Airtable loads, table by table — then their old `operators/<name>/` folders and the
`tests/parity/` comparison suite were deleted from the codebase.

**⛔ This code is NOT yet live in production.** Two things still have to happen together before
merging to the branch Cronicle actually deploys from:

1. **Repoint every Cronicle job** currently calling `python -m operators.<name>` (or, for
   `meser`, `python operators/meser/__init__.py`) to `python -m engine <spec_name>` instead.
   `child_care` and `day_care` have no existing Cronicle job at all — they'll need one created.
2. **Rebuild the deployed image** — the `dockerfile` now copies `engine/`, `specs/`, and
   `transformers/` in addition to the previously-copied directories, so the new engine is
   actually present in the container.

Until both are done, do not delete/replace the Cronicle jobs or deploy this branch, or the
scheduled runs for all 9 currently-live datasets (everything except child_care/day_care) will
fail outright.

## Live-run fixes (2026-08-25)

The parity suite mocked Airtable, so the first live run of every spec against the staging base
exposed loader regressions that the mocks could not see. All fixed and re-verified live:

- `load/airtable.py` now passes `typecast=True` to `batch_update`/`batch_create`, exactly like the
  old `dump_to_airtable(..., typecast=True)`. Without it Airtable rejected every link field written
  by business id (`organization: ['500106406']`) with 422 INVALID_RECORD_ID. Note that typecast also
  lets Airtable create select options and linked records for unknown values — specs must reference
  ids that already exist.
- Float NaN never reaches Airtable anymore: `engine/outputs.py` maps NaN → None before load, the
  loader filters are NaN-aware (`load/airtable_values.py`), `engine/spec_files.py` reads `dtype: str`
  CSVs with `keep_default_na=False`, and `transformers/guidestar_branches.py` no longer lets a NaN
  `short_name` become the branch name (`"nan - <city>"`).
- Batch failures are collected per output and raised once at the end of the spec run
  (`raise_if_batches_failed`), so a failed load exits non-zero and emails instead of reporting success.
- `engine/__main__.py` configures INFO logging when nothing else did, so standalone runs show
  "Running spec / Loading output (N rows) / Finished spec".
- `manage_status: true` restored on gilzahav, shil, revaha, tipat (branch + service, not the
  national row) and mental_health_clinics — their old flows used `airtable_updater`'s default.

## Old-code quirks preserved for parity (change only intentionally)

- **revaha**: every branch gets all 5 service ids (the old code mutated its SERVICES list
  before building branches), so the otzma-noshmim per-department flags have no effect.
  See the comment in `specs/revaha.yaml` for how to honor the flags for real.
- **day_care**: organization `kind` is always 'חברה פרטית' (the old `setup_kind` checked a
  column that had already been renamed away).
- **day_care**: the old fetch read only the FIRST data.gov.il page; the new spec paginates
  (`paginate: link_next`) — a deliberate improvement.
- **tipat / day_care**: the old service flows status-checked the wrong Airtable table;
  the engine's `manage_status` checks the output's own table instead.
- **mental_health_clinics**: cannot be verified live while the dataset is unpublished (HTTP 403).
- **meser**: the old fetch read only the FIRST data.gov.il page; the new spec paginates — a
  deliberate improvement. The old pluscode computation was dead code (never loaded) and was
  not ported.
- **soproc**: the old mid-run validation emails (`verifyDataExistance`) were NOT carried over —
  they never affected loaded data; failures still email via the engine's `invoke_on` wrapper.
  The Click cache scrape was ported into `engine/fetchers/click_cache.py` (backup JSON lives
  in `specs/soproc/`).
- **entities**: the old Stats/Report side-channels (Airtable stats writes, unknown-id report)
  became log warnings. Unmapped Guidestar tags are still registered into the staging taxonomy
  table (`transformers/guidestar_taxonomy.py::register_unmapped_taxonomy`). The Guidestar
  domain logic lives in `transformers/guidestar_*.py` as registered ops.
