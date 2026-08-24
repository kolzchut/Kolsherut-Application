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

## Running a job manually

On the **Schedule** tab, click **Run** next to the event (or open the event and use the
**Run Now** button). The job starts immediately regardless of its schedule and appears in the
Home tab's Active Jobs table. Shift-clicking **Run Now** lets you customize the job's timestamp
— useful for catch-up runs.

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
4. **Plugin** — choose **Shell Script** and paste the script (see
   [Data fetchers](#data-fetchers) below for the standard script).
5. **Target** — All Servers (we run a single server per environment).
6. **Timing** — pick minutes/hours/weekdays in the visual selector, or import a crontab
   expression. The server timezone is `Asia/Jerusalem`. Spread fetchers across the weekend
   hours like the existing ones so they don't pile up.
7. Optional but recommended: a **Timeout** (so a hung fetch doesn't run forever), **Retries** if
   the source is flaky, and **Notification** emails on failure.
8. **Save**, then click **Run** once and watch the Job Details log to confirm it works.

## Data fetchers

All data fetching services use the same script — one generic engine run with a spec name:

```
#!/bin/sh

cd /opt/cronicle/plugins/srm-etl

export PYTHONPATH=$PWD

python3 -m engine <spec_name>
```

All you need to do is create a relevant spec file for the source in
[`data/plugins/srm-etl/specs/`](data/plugins/srm-etl/specs) and put the spec file's name (without
`.yaml`) in the script's last line. Example — the shil fetcher, driven by
[`specs/shil.yaml`](data/plugins/srm-etl/specs/shil.yaml):

```
#!/bin/sh

cd /opt/cronicle/plugins/srm-etl

export PYTHONPATH=$PWD

python3 -m engine shil
```

The spec declares the source API, pagination, per-row transforms, and the Airtable output
tables; the full source list with a link to each spec is in [data.md](data.md).

### Example — adding a run for a new spec

Say you added `specs/new_source.yaml`:

1. Rebuild and redeploy the Cronicle image so the new spec is inside the container (the
   [dockerfile](dockerfile) copies `specs/` at build time). On a local compose run the plugins
   folder is mounted, so no rebuild is needed.
2. **Schedule → Add Event**, name it after the source, category **Data Import**, plugin
   **Shell Script**, and use the standard script with `python3 -m engine new_source`.
3. Set the timing (fetchers typically run weekly, on the weekend, at an hour no other fetcher
   uses) and save.
4. Click **Run**, follow the log in Job Details, and confirm the rows landed in the Airtable
   Data Import base.

### Non-fetcher jobs (operators)

The pipeline and maintenance jobs are Python packages, not specs. Their events use the same
script shape with a different last line:

```
python3 -m operators.<name>
```

where `<name>` is one of the packages under
[`operators/`](data/plugins/srm-etl/operators) — e.g. `publish` (Upload to DB), `deploy`,
`taxonomy` (Refresh Taxonomies), `geocode`, `manual_data_entry`, `github_backup`, `ssg_updater`
(Trigger Release Of FE).

> **Migration note:** the spec-driven engine replaced the old per-source operators in the code,
> but repointing the live Cronicle jobs from `python -m operators.<name>` to
> `python -m engine <spec_name>` and rebuilding the deployed image must happen together — see
> [MIGRATION_STATUS.md](data/plugins/srm-etl/MIGRATION_STATUS.md) before touching the
> production jobs.

## Creating users

Administrators only: **Admin → Users → Add User**.

1. Choose a username (alphanumeric, periods, dashes — it cannot be changed later), full name,
   email, and an initial password.
2. Assign privileges: a **Standard** user can be limited to specific actions (create/edit/run
   events, abort jobs); an **Administrator** gets full access including the Admin tab.
3. New team members who only need to run and watch jobs should get run/abort privileges without
   edit rights.

## Everything else

Plugins (we only use the built-in **Shell Script** plugin), server groups, API keys for
triggering jobs over REST, and advanced event options (catch-up mode, chaining, concurrency,
resource limits) are covered by the upstream
[Cronicle documentation](https://github.com/jhuckaby/Cronicle/tree/master).
