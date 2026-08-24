# Local Elasticsearch Replica (`ES/reindex`)

Bootstrap a local Elasticsearch from zero and fill it with real data copied from a remote
(port-forwarded) cluster — a faithful replica of the indices the Back End actually uses.

Use this when you want to run the BE locally against real data without pointing it at the shared
staging/production cluster.

---

## What the script does

Running `setup-database.ps1` performs these steps in order:

1. **Loads config** from `.env` (see below). On the very first run it creates `.env` from
   `.env.example` and stops so you can fill in the credentials.
2. **Builds & starts a local Elasticsearch** container from [`../Dockerfile`](../Dockerfile)
   (Elasticsearch 8.19.10 + `analysis-icu`, needed for the Hebrew analyzer) via
   `docker-compose.yml`. It runs single-node, security disabled, on port `9200`.
3. **Waits** for the local cluster to become healthy.
4. **Discovers the source indices** matching `INDEX_PATTERNS` on the remote cluster.
5. **Recreates each index locally** with the source's settings (including the Hebrew ICU analyzer)
   and mappings, then **streams every document** into it (scroll read → bulk write, preserving
   each document's `_id`).
6. **Prints a document-count comparison** (`source -> local`) so you can confirm the copy matched.

Only the two index families the BE reads are copied — `srm__cards_*` and `srm__autocomplete_*`
(every `be/src/services/db/es/dsl/build*.ts` query uses only `indices.card` or
`indices.autocomplete`). Other `srm__*` indices are intentionally skipped. To copy more, add their
pattern to `INDEX_PATTERNS` in `.env` — no code change needed.

The script is **idempotent**: each target index is dropped and recreated before copying, so it is
safe to re-run.

---

## Requirements

- **Docker** (Docker Desktop) running.
- **PowerShell** (built in on Windows). No other tools or packages to install — the copy uses
  PowerShell's built-in HTTP client against the Elasticsearch REST API.
- **Network access to the remote cluster.** Typically a `kubectl port-forward` exposing the remote
  ES on a local port.

---

## Usage

From the repository root:

```powershell
# 1. Expose the remote Elasticsearch locally (must match SOURCE_ES_URL in .env; example uses 9201).
kubectl port-forward svc/<elasticsearch-service> 9201:9200

# 2. First run: creates .env from the template, then stops.
.\ES\reindex\setup-database.ps1

# 3. Edit ES/reindex/.env and fill in the SOURCE_ES_* values (URL + username + password).

# 4. Run again: builds the local DB and replicates the data.
.\ES\reindex\setup-database.ps1
```

When it finishes you'll see the per-index count comparison, e.g.:

```
Replication complete. Document counts (source -> local):
  srm__cards_20260226150255392734_05764288 : 48213 -> 48213
  srm__autocomplete_20260226150608367558_4f737de8 : 15022 -> 15022
```

---

## Configuration (`.env`)

`.env` is **git-ignored** (it holds the password). The committed [`.env.example`](.env.example) is
the template. Variables:

| Variable             | Description                                                        | Example                                        |
|----------------------|--------------------------------------------------------------------|------------------------------------------------|
| `SOURCE_ES_URL`      | Remote (port-forwarded) ES to copy **from**.                       | `http://127.0.0.1:9201`                        |
| `SOURCE_ES_USERNAME` | Basic-auth username for the source.                                | `elastic`                                       |
| `SOURCE_ES_PASSWORD` | Basic-auth password for the source.                               | `your-password`                                |
| `LOCAL_ES_URL`       | Local ES to copy **into** (started by this script).               | `http://127.0.0.1:9200`                        |
| `INDEX_PATTERNS`     | Comma-separated index patterns to replicate.                      | `srm__cards_*,srm__autocomplete_*`             |
| `SCROLL_BATCH_SIZE`  | Documents fetched/indexed per batch.                              | `1000`                                          |
| `SCROLL_TIMEOUT`     | How long the source keeps each scroll context alive.             | `2m`                                            |

---

## Using the replica from the Back End

The local Elasticsearch runs with **security disabled**, so connect with no auth:

- `ELASTIC_URL=http://127.0.0.1:9200`  (use `127.0.0.1`, not `localhost` — see the note below)
- `ENV` set to the environment whose index names you copied, so `be/src/vars.ts` resolves to the
  same `srm__cards_*` / `srm__autocomplete_*` names present locally. If you copied from production
  that is `ENV=production`.
- `ELASTIC_USERNAME` / `ELASTIC_PASS` can be anything (ignored by the security-disabled local ES).

> **Why `127.0.0.1` and not `localhost`?** On Windows with WSL/Docker Desktop, `localhost` often
> resolves to IPv6 (`::1`), where a WSL relay (`wslrelay.exe`) can hold the port without forwarding to
> the container — connections then hang/time out. Docker's real port proxy listens on IPv4, so
> `127.0.0.1` always works. This applies to the BE, to `curl`, and to this script's `.env` URLs.

---

## Files

| File                              | Purpose                                                             |
|-----------------------------------|--------------------------------------------------------------------|
| `setup-database.ps1`              | Entry point / orchestrator.                                         |
| `docker-compose.yml`              | Builds `../Dockerfile` and runs the local ES (single-node, :9200).  |
| `.env.example`                    | Config template (committed).                                        |
| `.env`                            | Real config incl. password (git-ignored, created on first run).    |
| `steps/invoke-es.ps1`             | ES REST wrapper (basic-auth + UTF-8/Hebrew-safe).                   |
| `steps/load-env.ps1`              | Parse `.env`, fail fast on missing keys.                            |
| `steps/wait-for-elastic.ps1`      | Poll cluster health until ready.                                    |
| `steps/get-source-indices.ps1`    | List source indices matching `INDEX_PATTERNS`.                      |
| `steps/create-target-index.ps1`   | Recreate index locally with source settings + mappings.            |
| `steps/copy-index-data.ps1`       | Scroll-read source → bulk-write local, preserving `_id`.            |

---

## Troubleshooting

- **"Created .env from the template..."** — expected on first run. Fill in `SOURCE_ES_*` and re-run.
- **"No source indices match..."** — the port-forward isn't up, `SOURCE_ES_URL` is wrong, or
  `INDEX_PATTERNS` doesn't match any index on the source. Verify with
  `curl http://127.0.0.1:9201/_cat/indices/srm__*?v`.
- **Connection times out even though the container is "Up"** — on Windows, `localhost` may resolve to
  IPv6 (`::1`) where a WSL relay squats the port. Use `127.0.0.1` in `.env` and the BE config.
- **"Elasticsearch did not become healthy..."** — the local container failed to start; check
  `docker compose -f ES/reindex/docker-compose.yml logs`.
- **Auth errors against the source** — check `SOURCE_ES_USERNAME` / `SOURCE_ES_PASSWORD`.
