# YAML Engine Migration Status

One generic engine (`engine/`, run as `python -m engine <spec_name>`) replaces the per-operator
ETL scripts under `operators/`. Each data source is described by one spec in `specs/`.

**An operator is marked WORKING only when its parity test passes** — the test runs the OLD
operator and the NEW spec-driven engine on the same input (network and Airtable mocked) and
asserts that what each side would load into Airtable is identical, table by table.

Run all parity tests: `python -m pytest tests/parity` (from `ETL/data/plugins/srm-etl`).

## Latest verification run

- **Date:** 2026-08-23 16:31
- **Result:** `11 passed` — all 11 operators verified
- **Equalization:** 27 of 27 table-level diff files are empty (`{}`) — the old and new code
  load identical records for every operator and every Airtable table.

## Equalization artifacts — see exactly what each side would load

Every parity test run (re)writes, per operator, into `tests/parity/results/<operator>/`
(the "Artifacts" column below):

- `<table>.old.json` — the records the OLD operator would load into that Airtable table
- `<table>.new.json` — the records the NEW spec-driven engine would load
- `<table>.diff.json` — record-by-record, field-by-field differences (`{}` when identical;
  a non-empty diff FAILS the test with a message pointing at this file)

Notes: meser file names carry the load order (`1-organizations` = local-authority CSV load,
`2-organizations` = meser orgs, then `3-branches`, `4-services`); entities also compares the
side-channel unmapped-tag registrations (`taxonomy-registrations.*`). Open any
`.old.json`/`.new.json` pair to review the actual Airtable payloads.

Artifacts base path: `tests/parity/results/`

| #  | Operator              | Spec                              | Parity test                                        | Artifacts                        | Status     |
|----|-----------------------|-----------------------------------|----------------------------------------------------|----------------------------------|------------|
| 1  | mental_health_clinics | `specs/mental_health_clinics.yaml`| `tests/parity/test_mental_health_clinics_parity.py`| `results/mental_health_clinics/` | ✅ WORKING |
| 2  | tipat                 | `specs/tipat.yaml`                | `tests/parity/test_tipat_parity.py`                | `results/tipat/`                 | ✅ WORKING |
| 3  | gilzahav              | `specs/gilzahav.yaml`             | `tests/parity/test_gilzahav_parity.py`             | `results/gilzahav/`              | ✅ WORKING |
| 4  | shil                  | `specs/shil.yaml`                 | `tests/parity/test_shil_parity.py`                 | `results/shil/`                  | ✅ WORKING |
| 5  | kolzchut_orgs         | `specs/kolzchut_orgs.yaml`        | `tests/parity/test_kolzchut_orgs_parity.py`        | `results/kolzchut_orgs/`         | ✅ WORKING |
| 6  | revaha                | `specs/revaha.yaml`               | `tests/parity/test_revaha_parity.py`               | `results/revaha/`                | ✅ WORKING |
| 7  | day_care              | `specs/day_care.yaml`             | `tests/parity/test_day_care_parity.py`             | `results/day_care/`              | ✅ WORKING |
| 8  | child_care            | `specs/child_care.yaml`           | `tests/parity/test_child_care_parity.py`           | `results/child_care/`            | ✅ WORKING |
| 9  | soproc                | `specs/soproc.yaml`               | `tests/parity/test_soproc_parity.py`               | `results/soproc/`                | ✅ WORKING |
| 10 | entities              | `specs/entities.yaml`             | `tests/parity/test_entities_parity.py`             | `results/entities/`              | ✅ WORKING |
| 11 | meser                 | `specs/meser.yaml`                | `tests/parity/test_meser_parity.py`                | `results/meser/`                 | ✅ WORKING |

Statuses: ✅ WORKING (parity test green) · 🔧 IN PROGRESS · ⛔ BLOCKED (needs a decision)

**All 11 operators are converted and parity-verified.**

## Cutover checklist (per operator, in order)

1. Parity test green (status ✅ WORKING above).
2. Repoint the operator's Cronicle job to `python -m engine <spec_name>`.
3. Delete the old `operators/<name>/` folder.
4. Keep the parity test in CI as a regression test for the shared engine.

No operator has been cut over yet — all old operators still run as before.

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
