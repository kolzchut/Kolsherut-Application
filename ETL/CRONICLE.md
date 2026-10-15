# Operating Cronicle

[Cronicle](https://github.com/jhuckaby/Cronicle) is the multi-server task scheduler that runs
every ETL job. This page is the operational guide: how to log in, run and monitor jobs, create
new scheduled jobs, organize them into categories, and manage users. For what the ETL actually
does and how the code is laid out, start at the [main README](README.md); for the full upstream
manual see the [Cronicle documentation](https://github.com/jhuckaby/Cronicle/tree/master/docs).

## Environments and logging in

| Environment | Address |
|-------------|---------|
| prod | https://etl.kolsherut.org.il/ |
| stage | https://etl-staging.kolsherut.org.il/ |
| dev | https://etl-dev.kolsherut.org.il/ |

Open the address in a browser and sign in with your Cronicle username and password. If you don't
have an account yet, any administrator can create one for you (see
[Creating users](#creating-users)). On a local `docker compose` run the UI is at
http://localhost:3012 and the admin credentials are the `CRONICLE_admin_user` /
`CRONICLE_admin_pass` values in [docker-compose.yml](docker-compose.yml).

## The UI at a glance

- **Home** — system stats, the **Active Jobs** table (live progress, elapsed time, abort button)
  and the **Upcoming Events** table for the next 24 hours.
- **Schedule** — all scheduled events, grouped by category, each with **Run**, **Edit**,
  **Stats**, and **History** links.
- **Completed Jobs** — paginated history of every finished job with its result
  (success/failure), start time, and duration.
- **Admin** — activity log, API keys, categories, plugins, servers, and users
  (administrator accounts only).

## The dedicated plugins: Run Operator and Run SPEC

Two custom Cronicle plugins replace every copy-pasted Shell Script on the ETL server. An event
now needs exactly one word — the operator or spec name — instead of a four-line script.

### Why they exist

Every scheduled event used to carry its own copy of the same Shell Script:

```
#!/bin/sh
cd /opt/cronicle/plugins/srm-etl
export PYTHONPATH=$PWD
python3 -m operators.deploy    # <- the only line that ever differed
```

Sixteen events meant sixteen copies, and any change to the boilerplate meant editing all of
them. The scripts came in exactly two shapes — running a module under `operators.*`, or running
`engine` with a spec name — so there is now one plugin per shape. The boilerplate lives once,
inside the plugin; each event supplies only the name.

### The two plugins

**Run Operator** — runs `python3 -m operators.<name>`. For standalone operators: `deploy`,
`geocode`, `taxonomy`, `ssg_updater`, `github_backup`, `manual_data_entry`. Its **Executable**
field holds this single line:

```
/bin/sh -c 'cd /opt/cronicle/plugins/srm-etl && export PYTHONPATH=$PWD && python3 -m "operators.$OPERATOR" && echo "{\"complete\":1}"'
```

**Run SPEC** — runs `python3 -m engine <spec>`. For data-source specs run through the engine:
`shil`, `revaha`, `meser`, `day_care`, `tipat`, and the rest. Its **Executable** field holds:

```
/bin/sh -c 'cd /opt/cronicle/plugins/srm-etl && export PYTHONPATH=$PWD && python3 -m engine "$OPERATOR" && echo "{\"complete\":1}"'
```

Both plugins define one parameter — **Operator** — a plain text field. Whatever you type there
becomes the module or spec name.

### How the command works, piece by piece

- **`/bin/sh -c '…'`** — runs the whole thing as one shell command, so the plugin needs no
  script file on disk.
- **`cd …/srm-etl && export PYTHONPATH=$PWD`** — the same boilerplate the old scripts carried:
  work from the repo root and put it on the Python path.
- **`"$OPERATOR"`** — Cronicle passes every plugin parameter to the process as an environment
  variable with the key upper-cased. The parameter's ID is `operator`, so its value arrives as
  `$OPERATOR` — which is why the field must be created with exactly that ID.
- **`&& echo "{\"complete\":1}"`** — Cronicle requires a custom plugin to print the JSON line
  `{"complete":1}` when it finishes; the built-in Shell Script plugin did this silently on your
  behalf. Without it, a job whose Python exits cleanly is still marked failed with "Process
  exited without reporting job completion."
- **`&&` (not `;`)** — the echo runs only on success. If the Python crashes, the echo is
  skipped, the non-zero exit code propagates, and Cronicle correctly reports "Child crashed
  with code 1" — real failures still fail.

### Current event mapping

All sixteen production events were converted on 2026-08-31 — nothing runs on the built-in
Shell Script plugin anymore.

| Event | Plugin | Operator |
|-------|--------|----------|
| Refresh Taxonomies | Run Operator | `taxonomy` |
| Trigger Release Of FE | Run Operator | `ssg_updater` |
| Upload to DB | Run Operator | `deploy` |
| Manual Data Entry | Run Operator | `manual_data_entry` |
| Github Backup Trigger | Run Operator | `github_backup` |
| Geocode | Run Operator | `geocode` |
| Mol_daycare | Run SPEC | `day_care` |
| Tipat Halav | Run SPEC | `tipat` |
| Kol-Zchut Organizations | Run SPEC | `kolzchut_orgs` |
| Mahlakot Revaha | Run SPEC | `revaha` |
| SHIL | Run SPEC | `shil` |
| Social Procurement Data | Run SPEC | `soproc` |
| Enrich Entities | Run SPEC | `entities` |
| Mental Health Clinic | Run SPEC | `mental_health_clinics` |
| GilZahav | Run SPEC | `gilzahav` |
| meser | Run SPEC | `meser` |

### Rebuilding a plugin from scratch

Both plugins already exist — these steps are the recipe, for reference or for another Cronicle
instance:

1. **Admin → Plugins → Add New Plugin**.
2. **Plugin Name**: `Run Operator` (or `Run SPEC`); leave **Plugin Enabled** checked.
3. **Executable**: paste the exact one-line command from [The two plugins](#the-two-plugins),
   including the outer single quotes.
4. Click **Add Parameter…** and set **Parameter ID** = `operator` (exactly, lower-case — this
   becomes `$OPERATOR`), **Label** = `Operator`, **Control Type** = Text Field. Leave Size 20
   and Default Value empty, then click **Add**.
5. Click **Create Plugin**.

> Editing a plugin's command (Admin → Plugins → click its name) affects **newly launched jobs
> only**. Jobs already running — including pending retries — keep the command they were
> spawned with.

## Running a job manually

On the **Schedule** tab, click **Run** next to the event (or open the event and use the
**Run Now** button). The job starts immediately regardless of its schedule and appears in the
Home tab's Active Jobs table. Shift-clicking **Run Now** lets you customize the job's timestamp
— useful for catch-up runs.

## Editing an existing event

1. **Schedule** tab → **Edit** next to the event (or open the event by clicking its name). Every
   event also has a direct URL — `https://<env>/#Schedule?sub=edit_event&id=<event id>` — and the
   event id is shown at the top of the edit page.
2. Change what you need. For our jobs the interesting field is almost always the **Operator**
   parameter under Plugin Parameters — the single module or spec name the job runs (see
   [The dedicated plugins](#the-dedicated-plugins-run-operator-and-run-spec)).
3. Click **Save Changes** — a green "The event was saved successfully" banner confirms it. The
   change applies from the next run (scheduled or manual); a job already running keeps its old
   parameters.
4. Verify: click **Run** on the event and follow the Job Details log, at least when the change
   touched the Operator value. Every edit is also recorded in Admin → **Activity Log** (who
   changed which event, and when) — there is no undo, so note the old value before replacing it
   if you may need to restore it.

> **If the Operator value points at code that must exist in the container** (a new spec, a new
> operator), make sure a deploy has shipped that code to the environment *before* the event's
> next run — the [dockerfile](dockerfile) copies `engine/`, `specs/`, `operators/`, and
> `transformers/` at image build time. Editing the event and deploying the image are one change;
> doing only half leaves a job that fails on its next run.

## Monitoring jobs and reading logs

- **Live jobs**: Home tab → click the job in Active Jobs → the **Job Details** page shows live
  progress, CPU/memory donuts, and a live tail of the job's log (our jobs log to stdout, so the
  whole Python log stream is there).
- **Past runs**: Schedule tab → **History** next to the event lists its completed jobs; click
  one to see its full log and error banner if it failed. **Stats** shows success rate and
  average duration/CPU/memory over the last 50 runs.
- **Failure emails**: every operator is wrapped by the error notifier
  ([`srm_tools/error_notifier.py`](data/plugins/srm-etl/srm_tools/error_notifier.py)) — on an
  exception it emails the stack trace to `EMAIL_NOTIFIER_RECIPIENT_LIST` with the subject
  `ETL Task - {ENV_NAME} : <task> Failed`, then re-raises so Cronicle also marks the job as
  failed. The **Test Email Notifier** operator (`operators/test_email_notifier`) exists to
  verify this channel — it always fails on purpose.
- **Audit trail**: Admin → **Activity Log** records every schedule edit, run, abort, and login.

### Reading job results & troubleshooting

| What you see | What it means |
|--------------|---------------|
| Job completed successfully | The Python exited 0 and the plugin reported completion. All good. |
| Child crashed with code: 1 | A real failure inside the Python — open the job log for the traceback. The engine's error notifier also emails on each failure, and a retry re-runs the whole spec and emails again. |
| Process exited without reporting job completion | The plugin command is missing the `&& echo "{\"complete\":1}"` suffix — or the job was launched before the suffix was added. Retries of such a job keep the old command until the job chain ends; fresh runs pick up the fix. |
| No module named operators.xyz | Typo in the event's **Operator** field — fix the value and save. |

## Categories (splitting events into folders)

Events on the Schedule tab are grouped into **categories** — Cronicle's folders. Production
uses three:

| Category | Contents |
|----------|----------|
| **Backup** | GitHub Backup Trigger |
| **Data Import** | All data fetchers + Geocode, Manual Data Entry, Refresh Taxonomies, Enrich Entities |
| **Production** | Upload to DB, Trigger Release Of FE |

To add a category: **Admin → Categories → Add Category**, give it a title, optionally a
highlight color for the Schedule tab, a max-concurrent-jobs limit, and default
notification/resource settings. Assign events to it from each event's edit page.

## Creating a new scheduled job

1. **Schedule** tab → **Add Event**.
2. **Event Name** — a human-readable name (this is what History/Stats/emails show).
3. **Category** — pick the right folder (usually **Data Import** for fetchers).
4. **Plugin** — choose **Run SPEC** for a data fetcher or **Run Operator** for a standalone
   operator, and type the spec/module name in the **Operator** field — just the name (`deploy`),
   never a whole command.
5. **Target** — All Servers (we run a single server per environment).
6. **Timing** — pick minutes/hours/weekdays in the visual selector, or import a crontab
   expression. The server timezone is `Asia/Jerusalem`. Spread fetchers across the weekend
   hours like the existing ones so they don't pile up.
7. Optional but recommended: a **Timeout** (so a hung fetch doesn't run forever), **Retries** if
   the source is flaky, and **Notification** emails on failure.
8. **Save**, then click **Run** once and watch the Job Details log to confirm it works.

### Converting an event that still uses a raw script

If you ever meet an event on the built-in Shell Script plugin (another instance, a restored
backup):

1. Open **Schedule** and click the event.
2. Look at what its old script ran: `python3 -m operators.<name>` → choose **Run Operator**;
   `python3 -m engine <spec>` → choose **Run SPEC** in the Plugin dropdown.
3. In the **Operator** field that appears, type only the name — `deploy`, not the whole command.
4. **Save Changes**. Timing, category, server target, retries, timeouts, notifications and
   chaining are all untouched — only the "what to run" part changes.

## Data fetchers

All data fetching services run through the **Run SPEC** plugin — one generic engine run with a
spec name, equivalent to `python3 -m engine <spec_name>`. All you need to do is create a
relevant spec file for the source in
[`data/plugins/srm-etl/specs/`](data/plugins/srm-etl/specs) and put the spec file's name
(without `.yaml`) in the event's **Operator** field. Example — the shil fetcher, driven by
[`specs/shil.yaml`](data/plugins/srm-etl/specs/shil.yaml), is an event on the Run SPEC plugin
with Operator `shil`.

The spec declares the source API, pagination, per-row transforms, and the Airtable output
tables; the full source list with a link to each spec is in [data.md](data.md).

### Example — adding a run for a new spec

Say you added `specs/new_source.yaml`:

1. Push the spec. `specs/` is part of the plugin tree, so the `sync-etl-plugins` job copies
   it to the environment's Azure File Share on its own - **no image rebuild, no cluster
   start, no pod restart**. The next job run reads the new spec. On a local compose run the
   plugins folder is mounted, so nothing extra is needed there either.
2. **Schedule → Add Event**, name it after the source, category **Data Import**, plugin
   **Run SPEC**, and type `new_source` in the **Operator** field.
3. Set the timing (fetchers typically run weekly, on the weekend, at an hour no other fetcher
   uses) and save.
4. Click **Run**, follow the log in Job Details, and confirm the rows landed in the Airtable
   Data Import base.

### Non-fetcher jobs (operators)

The pipeline and maintenance jobs are Python packages, not specs. Their events use the
**Run Operator** plugin — equivalent to `python3 -m operators.<name>` — with the package name
in the **Operator** field, where `<name>` is one of the packages under
[`operators/`](data/plugins/srm-etl/operators) — e.g. `derive` (Upload to DB), `taxonomy`
(Refresh Taxonomies), `geocode`, `manual_data_entry`, `github_backup`, `ssg_updater`
(Trigger Release Of FE).

> **Migration notes:**
> - **2026-08-24** — the spec-driven engine replaced the old per-source operators, and every
>   production fetcher event was repointed from `python -m operators.<name>` to
>   `python3 -m engine <spec_name>` — the mapping is: Enrich Entities → `entities`,
>   GilZahav → `gilzahav`, Kol-Zchut Organizations → `kolzchut_orgs`, Mahlakot Revaha → `revaha`,
>   Mental Health Clinic → `mental_health_clinics`, meser → `meser`, Mol_daycare → `day_care`,
>   SHIL → `shil`, Social Procurement Data → `soproc`, Tipat Halav → `tipat`. The `child_care`
>   spec still has no scheduled event. History in
>   [MIGRATION_STATUS.md](data/plugins/srm-etl/MIGRATION_STATUS.md).
> - **2026-08-31** — all sixteen events were moved off the built-in Shell Script plugin onto the
>   dedicated **Run Operator** / **Run SPEC** plugins (see
>   [Current event mapping](#current-event-mapping)). That same day the four events fetching
>   from data.gov.il (Mol_daycare, Mahlakot Revaha, Mental Health Clinic, meser) failed because
>   the portal's CKAN API returned 404 site-wide — verified from a regular browser, so an
>   upstream outage, unrelated to the plugins.

## Creating users

Administrators only: **Admin → Users → Add User**.

1. Choose a username (alphanumeric, periods, dashes — it cannot be changed later), full name,
   email, and an initial password.
2. Assign privileges: a **Standard** user can be limited to specific actions (create/edit/run
   events, abort jobs); an **Administrator** gets full access including the Admin tab.
3. New team members who only need to run and watch jobs should get run/abort privileges without
   edit rights.

## Everything else

Server groups, API keys for triggering jobs over REST, and advanced event options (catch-up
mode, chaining, concurrency, resource limits) are covered by the upstream
[Cronicle documentation](https://github.com/jhuckaby/Cronicle/tree/master). Our own plugins are
documented in [The dedicated plugins](#the-dedicated-plugins-run-operator-and-run-spec) above;
the built-in **Shell Script** plugin is no longer used by any event.
