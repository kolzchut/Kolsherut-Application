# Kolsherut Backend (`be`)

The public-facing API server of the Kolsherut application. It is a Node.js (Express + TypeScript) microservice whose job is to serve the frontend with **search, autocomplete, and card (service) data** read from Elasticsearch, and to serve **SEO surfaces** — XML sitemaps and server-side-rendered pages for crawlers.

The service is **read-only** with respect to data: it never writes to Elasticsearch. Indices are produced by the ETL pipeline; this service only queries them.

## What it connects to

| System | Direction | Purpose |
|---|---|---|
| **Elasticsearch** | reads | All application data: `cards` index (services × branches) and `autocomplete` index. Index names are pinned per environment in [src/vars.ts](src/vars.ts). |
| **Frontend (FE)** | serves | The React frontend calls `/search`, `/autocomplete`, `/card`, `/logs`, `/siteMapForModal`. CORS origin is controlled by `ORIGIN`. |
| **Itself, via Puppeteer (SSR)** | reads | `/ssr/*` launches headless Chromium, renders the frontend page for the requested URL, and returns the resulting HTML (used for crawlers/bots). |
| **openeligibility taxonomy (GitHub)** | reads | Taxonomy sitemaps fetch `taxonomy.tx.yaml` from the kolzchut/openeligibility repo (URL in [src/vars.ts](src/vars.ts)). |
| **Gmail SMTP** | sends | Error notifications and a weekly keep-alive email via nodemailer (see "Email notifier" below). |

## Routes

All JSON responses follow the shape `{ success: true, data: ... }`. Unhandled errors return `500 { success: false, message, error }` (and trigger an error email).

### Application API

| Route | Method | Input | Output |
|---|---|---|---|
| `/test` | GET | — | `200 { message, success: true }` — liveness check. |
| `/autocomplete` | GET | `search` — free text typed by the user (query param, `?search=`). `GET /autocomplete/:search` (path param) is a legacy alias kept until client configs are updated. | Top 5 autocomplete options: `{ structured: [...], unstructured: [...] }`. Structured entries carry response/situation/service references; unstructured are plain text suggestions. When no structured result is found, the raw search text is prepended as a fallback suggestion; an empty search returns empty lists. |
| `/card/:card_id` | GET | `card_id` (path param, sanitized). | The full card document plus `servicesInSameBranch` — sibling cards sharing the same `branch_key`. `404` if not found. |
| `/search` | POST | JSON body: `searchQuery` (string, required; underscores are replaced with spaces), `isFast` (boolean — first fast page vs. the rest), `responseId`, `situationId`, `serviceName`, `by` (organization filter). All except `searchQuery` optional. | Cards grouped into a service hierarchy. When only `searchQuery` is given a free-text query is used; otherwise filters become ES `must` conditions. `isFast: true` returns the first `SEARCHCARDS_FIRST_LENGTH` results (`404` when empty); `isFast: false` returns the remainder. |
| `/logs/:provider` | POST | JSON body: `{ message, payload }`; `provider` names the client-side source. | `200 "Log Received"`. Writes the client event into this service's logger. |

### SEO / crawler surfaces

| Route | Method | Output |
|---|---|---|
| `/sitemap/cards` | GET | XML sitemap of all card pages (each entry's `<lastmod>` is floored to `SITEMAP_MINIMUM_LAST_MODIFIED_FOR_CARDS`). |
| `/sitemap/taxonomy` | GET | XML sitemap of all response and situation taxonomy pages. |
| `/sitemap/mixedtaxonomy` | GET | XML sitemap of combined response×situation search pages. |
| `/sitemap/organizations` | GET | XML sitemap of organization pages. |
| `/sitemap/services` | GET | XML sitemap of service pages. |
| `/siteMapForModal` | GET | JSON (not XML): list of response/situation links used by the frontend's sitemap modal. |
| `/ssr/*` | GET | Server-side-rendered HTML of the frontend page at the requested path. The original host is taken from `x-ssr-original-host` / `x-forwarded-host`; analytics domains are blocked during rendering; returns `404` when the underlying page has no results. |

## Environment variables

All environment variables are read **only** in [src/vars.ts](src/vars.ts); everything else imports the resolved values from there.

| Variable | Default | Description |
|---|---|---|
| `ENV` | `local` | Environment name: `production` / `stage` / `development`. Selects the Elasticsearch index pair and gates prod-only behavior (keep-alive email). |
| `PORT` | `5000` | HTTP port. |
| `ORIGIN` | `*` | Allowed CORS origin(s), comma-separated. The first entry also serves as the canonical origin for sitemap URLs. |
| `ELASTIC_URL` | `http://localhost:9200` | Elasticsearch node URL. |
| `ELASTIC_USERNAME` | `elastic` | Elasticsearch basic-auth username. |
| `ELASTIC_PASS` | — | Elasticsearch basic-auth password. |
| `ELASTIC_RECONNECT_TIMEOUT` | `5` | Seconds between reconnect attempts when the initial cluster-health check fails. |
| `AUTOCOMPLETE_MIN_SCORE` | `5000` | ES `min_score` applied to the card-derived autocomplete query; hits scoring below it are dropped. |
| `SEARCHCARDS_FIRST_LENGTH` | `50` | Size of the fast first page of `/search`; also the offset of the "rest" page. |
| `VERBOSE` | `false` | `true` enables verbose console logging (`logger.log`). |
| `LOG_TO_FILE` | `false` | `true` additionally writes logs to the `logs/` folder. |
| `LOG_DURATION` | `10` | Log-file rotation window, minutes. |
| `EMAIL_NOTIFIER_SENDER_EMAIL` | — | Gmail address used to send notification emails. Email service is disabled when unset. |
| `EMAIL_NOTIFIER_PASSWORD` | — | App password for the sender address. |
| `EMAIL_NOTIFIER_RECIPIENT_LIST` | team list | Comma-separated recipients of notification emails. |
| `EMAIL_INTERVAL_HOURS` | `6` | Batching interval for queued notification emails. |
| `SITEMAP_MINIMUM_LAST_MODIFIED_FOR_CARDS` | `2026-02-01T09:00:00` | Floor for the `<lastmod>` value in `/sitemap/cards` — cards modified earlier are reported with this date (no card is excluded). |

Elasticsearch **index names are not env vars** — they are pinned per `ENV` in the `indices` map at the top of [src/vars.ts](src/vars.ts) and must be updated there after each reindex.

## Email notifier

If the `EMAIL_NOTIFIER_*` variables are set, the service sends:
- **Immediate error emails** — every unhandled route error (via the global error handler) is pushed to a queue and flushed immediately.
- **Batched notifications** — queued items are flushed every `EMAIL_INTERVAL_HOURS`.
- **Weekly keep-alive** — in `production` only, a weekly email proving the service is up (also keeps the Gmail app password active).

## Local development

```bash
npm install
npm run dev
```

`npm run dev` runs nodemon, which starts `src/index.ts` with `node --env-file=.env -r ts-node/register` — configuration goes in a git-ignored [.env](.env) file in this folder (copy [.env.example](.env.example) and fill it in; see the variables table above). You need a reachable Elasticsearch with the index pair matching your `ENV`.

Other scripts:

| Script | Purpose |
|---|---|
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled server (`node dist/index.js`). |
| `npm run docker:build` / `npm run tar` | Build (and export) a local Docker image `kolsherut_be:<version>`. |
| `npm run makeBlackList` | Regenerate [src/assets/mixedTaxonomyBlackList.json](src/assets/mixedTaxonomyBlackList.json): crawls the mixed-taxonomy sitemap and records response×situation combinations that return no results, so they are excluded from future sitemaps. Configured by [scripts/configurations.json](scripts/configurations.json). |

## Docker

The [Dockerfile](Dockerfile) expects `dist/` to already exist (`npm run build` runs **before** `docker build` — the image copies `dist/`, it does not compile). The image is based on `node:lts`, installs system Chromium, and points Puppeteer at it (`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`) instead of downloading its own binary. Exposes port 5000.

## CI/CD

All services share a single orchestrator workflow: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml). It detects which services changed in the push (via path filters), builds only those in parallel, then deploys them in **one** deploy job — so the non-prod AKS cluster is started and stopped exactly once per run. A change to either workflow file rebuilds and redeploys **all** services; releases and manual `workflow_dispatch` runs do the same.

The BE build is delegated to the shared [reusable-build-image.yml](../.github/workflows/reusable-build-image.yml) with `node_build: true`: it compiles the TypeScript on Node 20 (`npm install && npm run build`), builds a **linux/arm64** Docker image (the AKS node pools are ARM), and pushes it to Azure Container Registry as `kolsherut-be`.

Branch → environment mapping:

| Ref | Image tag | Deploys to |
|---|---|---|
| `dev` branch | `dev` | Dev AKS cluster (`deploy-nonprod` job). |
| `main` branch | `stage` | Stage AKS cluster (`deploy-nonprod` job). |
| `production` branch, `v*` tag, or release | `production` | Production AKS cluster (`deploy-production` job). |

Non-prod deploy details:
- The job waits out transitional cluster states, starts the cluster if it was stopped, and stops it again afterwards (only if the workflow itself started it — a human-started cluster is never stopped).
- **BE deploys first** among the services, because the frontend's SSG crawl later in the same job renders pages against the freshly deployed backend.
- The rollout is a `kubectl rollout restart` of the `kolsherut-be` deployment with a 2-minute status timeout; a failed BE build never blocks the other services' deploys.

Production deploy pins the image explicitly (`kubectl set image ... kolsherut-be:production`), stamps `CODE_VERSION`, and restarts the deployment with a 3-minute timeout.

Runtime environment variables come from the Kubernetes deployment spec (managed in `Infra/`), not from the image.
