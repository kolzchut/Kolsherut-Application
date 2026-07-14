# The `deploy` Operator — Full Reverse-Engineering Reference

> Target audience: developers who need to understand this operator **exactly** in order to rewrite it.
> Everything below was derived from reading the code in `operators/deploy/`, the shared tooling in
> `srm_tools/`, and the configuration in `conf/settings.py`.

> **Rewrite guidance:** the operator imports `update_mapper` (`srm_tools/processors.py`) and
> `airtable_updater` (`srm_tools/update_table.py`) but **uses neither** — it implements its own,
> much simpler diff-and-push. These imports are dead and must not be carried over (see §7).

---

## 1. What it is

`deploy` is a **one-way sync of hand-curated fields** from the *alternate* Airtable base
(`ETL_AIRTABLE_ALTERNATE_BASE`) into the *main* Airtable base (`ETL_AIRTABLE_BASE`) — the base
every other operator (most importantly `derive`) reads from. Content editors work on Presets,
taxonomy synonyms, and manual location geo-tagging in the alternate base; running `deploy`
"deploys" those edits into the main base.

Four tables are synced (see §5): `Presets`, `Situations`, `Responses`, `Locations`.
Only the configured fields are copied — nothing else on the target rows is touched, and rows
missing from the alternate base are **never deleted or deactivated** (§7).

---

## 2. Entry points and orchestration

```
operators/deploy/__init__.py
    run()          # the real sync: iterates DEPLOY_CONFIG, one flow per table
    operator()     # wraps run with invoke_on(...) → failure e-mail + re-raise

operators/deploy/__main__.py
    calls run() directly  →  `python -m operators.deploy` runs WITHOUT the e-mail wrapper
```

Like the other operators, it is deployed as a job in the **Cronicle** scheduler container
(plugin code in `/opt/cronicle/plugins/srm-etl`).

### Failure handling

`operator()` → `invoke_on(run, 'Deploy')` (`srm_tools/error_notifier.py`): on any exception it
e-mails a stack trace to `EMAIL_NOTIFIER_RECIPIENT_LIST` with subject
`ETL Task - {ENV_NAME} : Deploy Failed`, then re-raises.

---

## 3. Configuration

### Environment / settings (`conf/settings.py`)

| Variable | Role in `deploy` |
|----------|------------------|
| `ETL_AIRTABLE_ALTERNATE_BASE` → `settings.AIRTABLE_ALTERNATE_BASE` | **Source** base (read only) — `deploy` is its only consumer in the plugin |
| `ETL_AIRTABLE_BASE` → `settings.AIRTABLE_BASE` | **Target** base (read + written) |
| `DATAFLOWS_AIRTABLE_APIKEY` → `AIRTABLE_API_KEY` | Airtable token (both bases) |
| `ENV_NAME`, `EMAIL_NOTIFIER_*` | Failure e-mail only |

Fixed values: `AIRTABLE_VIEW = 'Grid view'` (both loads), table-name constants
(`Presets`, `Situations`, `Responses`, `Locations`).

### `DeploySpec` (the `DEPLOY_CONFIG` entries)

| Field | Meaning |
|-------|---------|
| `table` | Table name — must exist in **both** bases |
| `id_field` | Logical key used to match rows across bases (always `'id'` today) |
| `copy_fields` | Fields copied source → target. Each entry may be `'src:dst'` to rename on write (`select_fields` uses the part before `':'`, `DF.rename_fields` applies the mapping) — **no current spec uses this** |
| `add_missing` | When `True`, source rows with no match in the target are **created** there |

---

## 4. The sync algorithm (`run()`)

Per `DeploySpec`, one dataflows flow:

1. **Snapshot the source** — `load_from_airtable(ALTERNATE_BASE, table, 'Grid view')`, select
   `id_field` + copy fields, materialize in memory (`.results()`), and index into a dict
   `source = {row[id_field]: row}`.
2. **Stream the target** — `load_from_airtable(BASE, table, 'Grid view')`, select `id_field` +
   the Airtable record-id field (`AIRTABLE_ID_FIELD`) + copy fields.
3. **`update_from_source`** — for each target row, `source.pop(id)`:
   * match found and **any copied field differs** → merge the source values into the row and
     yield it (rows already equal are dropped → minimal Airtable writes);
   * match found but identical → dropped;
   * no match → dropped (row left untouched in Airtable).
   After the stream, if `add_missing`: every un-popped source row is yielded as-is — it carries
   no `AIRTABLE_ID_FIELD`, so the dump **creates** it in the target table.
4. `DF.rename_fields(...)` if any `'src:dst'` entries exist (currently never), else the step is
   `None` and dataflows skips it silently.
5. `DF.printer()` — every row about to be written is printed to stdout.
6. `dump_to_airtable` into the main base with `typecast: True` — updates rows by Airtable record
   id, creates rows that lack one.

---

## 5. Deployed tables (`DEPLOY_CONFIG`)

| Table | `id_field` | Copied fields | `add_missing` | Purpose |
|-------|-----------|---------------|---------------|---------|
| `Presets` | `id` | `title`, `preset`, `example`, `emergency`, `alternative_text` | ✔ | Curated homepage/search presets |
| `Situations` | `id` | `synonyms` | ✔ | Taxonomy synonyms for search |
| `Responses` | `id` | `synonyms` | ✔ | Taxonomy synonyms for search |
| `Locations` | `id` | `status`, `provider`, `accuracy`, `alternate_address`, `resolved_lat`, `resolved_lon`, `resolved_address`, `resolved_city`, `fixed_lat`, `fixed_lon` | ✘ | Manual location geo-tagging fixes (updates only — never creates locations) |

---

## 6. Complete side-effects inventory

* **Airtable writes** — main base only: upserts into `Presets`, `Situations`, `Responses`
  (update + create) and `Locations` (update only). The alternate base is never written.
* **stdout** — `DF.printer()` dumps every written row; `logger` start/per-table/finish lines.
* **E-mail** — failure notification (only when run through `operator()`, not `__main__`).
* No filesystem artifacts, no Elasticsearch, no checkpoints.

---

## 7. Known quirks & dead code (inputs for the rewrite)

1. **Dead imports** — `update_mapper` and `airtable_updater` are imported and never used;
   `deploy` deliberately bypasses the shared `airtable_updater` machinery (no `source`/`status`
   management, no hash comparison — it diffs field values directly).
2. **No deletion semantics** — target rows absent from the alternate base survive untouched;
   there is no INACTIVE flow like `airtable_updater` has. Deleting a Preset in the alternate
   base does *not* remove it from the main base.
3. **Duplicate ids in the target** — `source.pop(id)` means only the *first* target row with a
   given id is updated; later duplicates find `None` and are skipped silently.
4. **`'src:dst'` rename support is vestigial** — the mechanism (`split(':')` in `run()`) works
   but no `DEPLOY_CONFIG` entry uses it.
5. **Two inconsistent direct-run paths** — `python -m operators.deploy` (`__main__.py`) calls
   `run()` with no e-mail wrapper, while `python operators/deploy/__init__.py` hits the
   `if __name__ == '__main__'` block which calls `operator(None, None, None)` *with* it.
6. **Whole-source in memory** — the alternate-base table is fully materialized before the
   target stream starts; fine at current table sizes, worth noting for a rewrite.
