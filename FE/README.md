# KolSherut — Front End

The front end of KolSherut (כל שירות) — an open database of public services in Israel.


A React 19 + TypeScript SPA, built with Vite, served by nginx inside a Docker container, with a **three-layer rendering strategy**: Client-Side Rendering (CSR) for humans, build-time Static Site Generation (SSG) for pages known ahead of time, and on-demand Server-Side Rendering (SSR) via the BE for bots hitting pages that were not pre-generated.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Bootstrap Flow](#application-bootstrap-flow)
- [Routing (Store-Driven, No Router Library)](#routing-store-driven-no-router-library)
- [Rendering Strategy: CSR / SSG / SSR](#rendering-strategy-csr--ssg--ssr)
  - [1. CSR — the default for humans](#1-csr--the-default-for-humans)
  - [2. SSG — build-time pre-rendering](#2-ssg--build-time-pre-rendering)
  - [3. SSR — on-demand rendering for bots](#3-ssr--on-demand-rendering-for-bots)
  - [How nginx decides which layer serves a request](#how-nginx-decides-which-layer-serves-a-request)
  - [Hydration on the client](#hydration-on-the-client)
- [Configuration Files](#configuration-files)
- [Synonyms & Meta Tags Integration](#synonyms--meta-tags-integration)
- [Sitemaps](#sitemaps)
- [Build Pipeline & npm Scripts](#build-pipeline--npm-scripts)
- [Docker & nginx](#docker--nginx)
- [CI/CD](#cicd)
- [Local Development](#local-development)
- [SEO Extras](#seo-extras)
- [Cloud-Specific Notes](#cloud-specific-notes)

## Tech Stack

| Concern | Choice |
| --- | --- |
| UI framework | React 19 (`react`, `react-dom`) |
| Language | TypeScript ~5.7 |
| Build tool | Vite 6 (`@vitejs/plugin-react`) |
| State | Redux Toolkit + `react-redux` |
| Styling | react-jss (`createUseStyles`, one `.css.ts` file per component) |
| Maps | OpenLayers (`ol`) |
| HTTP | axios |
| Analytics | `react-ga4` (GA4) + `@hotjar/browser` |
| Sanitization | `dompurify` |
| SSG | `puppeteer` + `puppeteer-cluster` + `serve-handler` |
| Serving | nginx (Docker) |
| Node engine | Node 20.x / npm 10.x |

## Project Structure

```
FE/
├── index.html                  # SPA shell (fonts preload, meta, #root)
├── vite.config.ts              # Vite build config (buildId-stamped filenames)
├── Dockerfile                  # nginx image; env-specific conf baked in
├── nginx-<env>.conf            # local / development / stage / production (+ *-hasadna legacy)
├── package.json
├── scripts/                    # build-time Node scripts (CommonJS)
│   ├── ssg-crawler/            # the SSG engine (see SSG section)
│   ├── generateMainSitemap.cjs
│   ├── generateHomepageSitemap.cjs
│   ├── generateStaticPagesSitemap.cjs
│   ├── updateSynonyms.cjs
│   ├── postbuild.cjs
│   └── docker-tasks.cjs        # docker build / save-to-tar helper
├── public/                     # copied verbatim into dist/
│   ├── configs/                # ALL runtime configuration (see Configuration Files)
│   ├── synonyms/               # source CSVs for the synonyms script
│   ├── sitemap/                # generated hpsitemap.xml + staticpages.xml (prebuild outputs)
│   ├── redirects.map           # nginx 301 map (old card ids → new)
│   ├── robots.txt / llms.txt / BingSiteAuth.xml
│   └── favicons…
└── src/
    ├── main.tsx                # builds the React tree, calls initialize()
    ├── App.tsx                 # theme, modal, sidebar, page switch
    ├── pages/                  # one folder per page: home, results, card, maintanence, staticPages (about/missing/partners/contact)
    │   └── pages.ts            # page-key → component map (home, map, card, results, maintenance, about, missing, partners, contact)
    ├── components/             # cross-page components (header, footer, map, sidebar, …)
    ├── services/               # pure functional services (init, config, url, search, map, …)
    ├── store/                  # Redux Toolkit slices: data / filter / general / shared
    ├── hooks/
    ├── types/                  # ALL types & interfaces live here
    ├── utilities/
    ├── constants/
    └── assets/                 # fonts, images, generated synonym JSONs
```

Component conventions: every component sits in its own camelCase folder with `<name>.tsx` (hooks + JSX only), `<name>.css.ts` (react-jss styles), and optional `<name>Logic.ts` pure-logic files. Page-owned components live under `pages/<page>/`; anything shared lives under `components/`.

## Application Bootstrap Flow

There is no logic in `main.tsx` beyond composing the tree:

1. **`src/main.tsx`** wraps `<App/>` in `<Provider store={store}>` and `<JssProvider>` and passes the tree to `initialize(main)`.
2. **`src/services/initialize.ts`** then, in order:
   1. `await loadConfig()` — fetches every config file (see below). On failure the app switches to the **maintenance** page.
   2. `await setTaxonomy()` — loads the taxonomy used for slug↔id matching in URLs.
   3. `hydrateFromLocation()` — parses `window.location` into route params and dispatches them into the store (with `window.__suppressHistoryPush` set so the initial sync never pushes history).
   4. Initializes analytics (GA4), the OpenLayers map service, default locations, and Hotjar.
   5. **Render vs. hydrate decision**: if `#root` already has children (i.e., the HTML came from SSG or SSR), it calls `hydrateRoot(container, main)`; otherwise `ReactDOM.createRoot(container).render(main)`. This single check is what makes the same bundle work for all three rendering modes.
   6. Registers a `popstate` listener that re-parses the URL back into the store (back/forward support).

## Routing (Store-Driven, No Router Library)

There is **no react-router**. Routing is a pure function pair in `src/services/url/route.tsx`:

- **URL → store**: `getRouteParams()` parses `location.pathname` + query string into a `UrlParams` object:
  - `/map` → map page
  - `/about` / `/missing` / `/partners` / `/contact` (the slugs in `src/services/url/staticPages.ts`) → the matching static content page — checked **before** the taxonomy match, so a taxonomy entry can never shadow a static page
  - `/p/card/c/:cardId` → card page
  - taxonomy slugs in the first two path segments (matched against the loaded taxonomy) → results page with `bsf`/`brf` (situation/response backend filters)
  - `by-<org>` / `bsnf-<name>` path parts → provider/name-scoped results
  - nothing matched → home page
- **Store → URL**: `useRouteUpdater()` (called once in `App.tsx`) watches the store's URL params selector and calls `applyHistory()`, which builds the canonical pretty URL via `buildUrl()` and decides between `history.pushState` (navigation to a different page/card) and `history.replaceState` (same page, changed filters). The first sync always replaces, and pushes are suppressed during hydration.

`App.tsx` selects the current page key from the store (`general` slice) and renders the matching component from `pages/pages.ts` (`home`, `map` → home with map modal, `card`, `results`, `maintenance`, and the static pages `about` / `missing` / `partners` / `contact`).

Because the "router" is just store state, SSG/SSR crawlers can render any URL with the exact same bundle — the URL fully determines the page.

## Rendering Strategy: CSR / SSG / SSR

This is the heart of the FE architecture. All three layers serve the **same Vite bundle**; they differ only in *who renders the first HTML and when*.

### 1. CSR — the default for humans

A human visitor requesting a route that has no pre-generated file gets the SPA shell `index.html` (nginx `rewrite ^ /index.html`). React boots, `loadConfig` runs, the URL is parsed into the store, and the page renders entirely client-side. All in-app navigation after first load is CSR regardless of how the first page arrived.

### 2. SSG — build-time pre-rendering

The SSG engine lives in `scripts/ssg-crawler/` and runs via `npm run ssg:generate` (or the `build:<env>:ssg` wrappers). It is a **self-crawling** system: it serves the freshly built `dist/` locally and renders every known route with headless Chrome, saving the resulting HTML back into `dist/`.

Flow (`index.cjs` orchestrates):

1. **`config.cjs`** reads `public/configs/<ENVIRONMENT>.json` to learn the target domain (`currentURL`) and sets limits: max **35,000 pages**, **5** concurrent browser contexts, **3** retries per page.
2. **`utils/files.cjs → ensureDist / updateEnvironmentConfig`** verifies `dist/` exists (the base build must run first) and copies `<env>.json` → `dist/configs/environment.json` so the crawled app runs against the right BE.
3. **`components/server.cjs`** starts a local static server (`serve-handler`) on port 3000 serving `dist/` with SPA fallback — the crawler crawls *itself*, not the live site.
4. **`components/sitemap.cjs` — route discovery**: fetches `sitemap.xml` (local first, falls back to the remote target domain), extracts sub-sitemaps (`staticpages.xml`, `cards.xml`, `taxonomy.xml`, `mixedtaxonomy.xml`, `hpsitemap.xml`, `services.xml`, `organizations.xml`), and collects every `<loc>` whose domain is allowed into a route set (always including `/`). Note: card/taxonomy sub-sitemaps are generated by the **BE** and reached through the nginx proxy on the deployed site, which is why the remote fallback matters.
5. **`components/crawler.cjs`** launches a `puppeteer-cluster` (`CONCURRENCY_CONTEXT`, headless) and queues every route against `http://127.0.0.1:3000`.
6. **`components/browser.cjs` — per-page rendering**:
   - Request interception blocks analytics domains (`utils/blockAnalytics.json`) and rewrites Origin/Referer for proxied BE requests (`be-dev` / `be-staging` / `be.kolsherut`), so the local page can call the real BE.
   - Navigates with `waitUntil: networkidle0`, waits until `#root` has content, inlines computed `<style>` rules and injects a `<base href="/">`.
7. **`utils/html.cjs → cleanHtmlContent`** replaces every `http://127.0.0.1:3000` / `localhost:3000` occurrence with the real target domain.
8. **`utils/files.cjs → savePage`** writes the HTML to `dist/<route>/index.html`. The homepage is deliberately saved to **`dist/home/index.html`** — never to `dist/index.html` — so the SPA shell entry point is not overwritten (nginx knows to look there, see below).

The build exits non-zero if zero pages succeed, failing the CI job.

Result: `dist/` contains the SPA shell **plus** tens of thousands of fully rendered `index.html` files, one per service card / taxonomy page, all baked into the Docker image.

**Where the pages live once deployed:** in the cluster the `p/` folder (the card pages, ~2.2 GB on production) is served from the environment's **Azure File Share**, mounted at `/usr/share/nginx/html/p`. On every FE pod start the `sync-config` initContainer wipes `p/` on the share and copies the image's SSG output into it — which is why FE rollouts are allowed up to 45 minutes ([Infra/templates/fe-deployment.yaml](../Infra/templates/fe-deployment.yaml)). The share is always overwritten from the image, so never edit `p/` by hand; the share's `configs/` folder behaves differently — see [Configuration Files](#configuration-files) and [docs/azure-environments.md](../docs/azure-environments.md#frontend-configuration).

### 3. SSR — on-demand rendering for bots

Pages that appear between builds (new services) or that were never crawled still need real HTML for search engines and link previews. That is handled at request time:

1. nginx classifies the client by User-Agent (`$is_bot` map): Googlebot, Bingbot, Yandex, Baidu, DuckDuckBot, social preview bots (Facebook, Twitter/X, LinkedIn, Pinterest, Slack, WhatsApp, Telegram, Discord, Apple), plus `curl`/`wget`/`python-requests`/`KolsherutTestBot`. The special UA `KolSherutBot` is explicitly **not** a bot — that is the UA the SSR renderer itself uses, preventing infinite proxy loops.
2. If the requested path has **no static file** and the client **is a bot**, nginx internally raises a 418 and lands in `@bot_ssr`, which proxies the request to the BE: `https://<be-host>/ssr$request_uri`.
3. The BE (`be/src/services/ssr/ssrService.ts`) keeps a persistent Puppeteer browser, opens the requested URL of the live site with the `KolSherutBot` UA (analytics blocked), waits for render, and returns the full HTML. A 404 from search APIs marks the page as failed so bots don't index empty results pages.
4. The bot receives fully rendered HTML; a human hitting the same URL would have received the SPA shell instead.

### How nginx decides which layer serves a request

For every request (see `nginx-<env>.conf`):

```
request
  ├─ matches redirects.map?          → 301 to the new URL
  ├─ exact static file ($uri)?       → serve it            (assets, configs, SSG page)
  ├─ $uri/index.html exists?         → serve it            (SSG page, no 301 hop)
  └─ @decision_logic:
       ├─ bot?    → @bot_ssr  → proxy to BE /ssr (live Puppeteer render)
       └─ human?  → rewrite to /index.html (SPA shell → CSR)
```

The homepage has a dedicated `location = /` that tries `home/index.html` (the SSG-rendered homepage) before falling into the decision logic; `index home/index.html index.html` covers directory requests.

### Hydration on the client

Whether the first HTML came from SSG or SSR, the same bundle boots and `initialize.ts` detects existing content inside `#root`, so React **hydrates** the server markup instead of re-rendering from scratch. `window.__suppressHistoryPush` guards against the initial store sync clobbering the history entry. If the shell was empty (pure CSR), it mounts normally with `createRoot`.

## Configuration Files

All runtime configuration lives in `public/configs/` and is fetched **at runtime** by `src/services/loadConfig.ts`, which:

- requests each file with a `?cacheBuster=${Date.now()}` query (edits go live on refresh, no rebuild),
- validates the response is JSON,
- attaches each to a global (`window.config`, `window.strings`, …) and `Object.freeze`s it,
- and on any failure routes the app to the **maintenance** page.

Files loaded at runtime: `environment.json`, `config.json`, `strings.json`, `responseColors.json`, `filters.json`, `modules.json`, `metaTags.json`, `jsonLd.json`. The rest (`homepage.json`, `presets.json`, `linksBelow.json`, the per-env files) are fetched by the features that need them or consumed at build time.

> **Deployed environments serve these files from an Azure File Share, not from the image — and the share is filled from the [Kolsherut-FE-Configurations](https://github.com/kolzchut/Kolsherut-FE-Configurations) repository.** On dev, staging and production the `configs/` folder is mounted from the environment's File Share ([Infra/templates/fe-deployment.yaml](../Infra/templates/fe-deployment.yaml)); a commit to that repository's `dev/`, `stage/` or `production/` folder is mirrored onto the matching share by CI. On every pod start the image's files are copied to the share **only if missing** (`cp -rn`), so a file that already exists on the share is never overwritten by a deploy. Consequences:
>
> - **Changing a config in this repo is not enough.** To change a value on a running environment, edit the same file in the configuration repository — step-by-step in [docs/azure-environments.md → Editing a config file](../docs/azure-environments.md#editing-a-config-file). Only brand-new files reach the share through a deploy; `public/configs/` is the default set a fresh environment starts with.
> - **Never edit the share in the Azure Portal** — the sync is a full mirror and overwrites manual edits.
> - To delete a config file permanently, remove it both from the configuration repository and from `public/configs/`; otherwise the next pod start restores it.
> - Invalid JSON puts that environment on the maintenance page immediately; the configuration repository's CI validates every file before syncing.

### 1. `config.json`
**Purpose:** Global settings — redirects, routes, maps, search behavior, Hotjar, default locations, taxonomy URL.
**How to maintain:** use existing key patterns for new routes/settings; use `%%MACRO%%` for values replaced dynamically.

### 2. `strings.json`
**Purpose:** Central source for **all** UI text (labels, placeholders, messages, tooltips).
**How to maintain:** add descriptive, consistent keys. Never hardcode display text in `.ts`/`.tsx` files — read from `window.strings`.

### 3. `responseColors.json`
**Purpose:** Colors for response tags and map points.
**Structure:** `responses` maps `responseId → colorName`; `colors` maps `colorName → { background, font }`.
**How to maintain:** every `colorName` referenced under `responses` must exist under `colors`.

### 4. `filters.json`
**Purpose:** All filters used in the app.
**Structure:** Responses are flat `responseId → display string`; situations are grouped inside `situationMap` (group id → array of situations, each group has a title).
**How to maintain:** add new filters to the right group; keep identifiers unique.

### 5. `homepage.json`
**Purpose:** Homepage search options.
**Structure:** groups, each with `group` (id), `situation_id`, `group_link`, and `labels` — each label has `response_id`, `situation_id`, `title`, and `query` (write with underscores).
**How to maintain:** labels must point to valid `situation_id`/`response_id` values. This file also feeds the homepage sitemap (see Sitemaps).

### 6. `linksBelow.json`
**Purpose:** Footer links.
**Structure:** array of `{ title, modal | url }` — exactly one of `modal` or `url` per entry.

### 7. `metaTags.json`
**Purpose:** Page-specific meta tags for SEO/sharing.
**Structure:** object per page with meta fields (`title`, `description`, `og:image`, …). Supports dynamic macros like `%%serviceDescription%%`, `%%search%%`, `%%situations%%`, `%%responses%%`, `%%location%%`.

### 8. `modules.json`
**Purpose:** Modules of the **AddService modal** — array of objects with `title`, `description`, optional `links`.

### 9. `presets.json`
**Purpose:** Default search options shown before the user types. Array of preset objects, each becoming a selectable SearchOption.

Required per preset: `label` (displayed text), `query` (executed search — must be **unique**, it's the React list key).
Optional: `responseId`, `situationId`, `cityName`, `bounds` (`[minLon, minLat, maxLon, maxLat]` — lon/lat order!), `by` (provider/organization scope), `labelHighlighted` (the *non*-emphasized part of the label).

A preset is treated as "structured" if it has any of `responseId` / `situationId` / `cityName` / `bounds` / `by`. Array order = display order; remove an entry to hide it (JSON has no comments). Prefer omitting optional keys over `null`. Common pitfalls: lat/lon flipped bounds, duplicate `query` values, trailing commas.

Example:
```json
{
  "bounds": [35.0852011, 31.7096214, 35.2650458, 31.8826655],
  "cityName": "ירושלים",
  "label": "ציוד רפואי בירושלים",
  "query": "ציוד רפואי בירושלים",
  "responseId": "human_services:health:medical_supplies"
}
```

### 10. `jsonLd.json`
**Purpose:** JSON-LD structured-data templates injected per page (`src/services/jsonLd`).

### 11. `local.json`, `development.json`, `stage.json`, `production.json`
**Purpose:** Environment-specific values — identical keys, different values:

| Key | Meaning |
| --- | --- |
| `state` | environment name (`local`/`development`/`stage`/`production`) |
| `server` | BE base URL for this environment |
| `analyticsId` | GA4 measurement id |
| `currentURL` | canonical site URL (also the SSG target domain) |
| `sitemapsDefaultLastModified` | default `<lastmod>` for static sitemaps |

**How to maintain:** keep all four in sync key-wise; never commit secrets.

### 12. `environment.json`
**Purpose:** The file the app actually loads — a **copy of the selected env file**, produced automatically:
- `postbuild.cjs` copies `<env>.json → dist/configs/environment.json` after every build,
- the SSG crawler re-asserts it before crawling,
- the Dockerfile bakes it again (`COPY dist/configs/${environment}.json … environment.json`).

You should never edit `environment.json` in `dist/` by hand; change the source env file instead.

### Best practices
- Validate JSON before committing (no trailing commas).
- Test with `local.json` before stage/production.
- Use `%%MACRO%%` placeholders instead of hardcoding dynamic values.

## Synonyms & Meta Tags Integration

Search-results meta tags are enriched with synonym data for situations and responses, producing SEO-friendly titles/descriptions and Open Graph tags that reflect the user's query.

### The `synonyms:update` script (`scripts/updateSynonyms.cjs`)

1. Reads all `.csv` files from `public/synonyms/` (expects columns `id`, `name`, `synonyms`; order unimportant).
2. Keeps rows that have both `id` and `synonyms`; cleans/normalizes quotes.
3. Writes one JSON per CSV into `src/assets/synonyms/` with the same base name (`Situations-synonyms.csv` → `Situations-synonyms.json`).

Runs automatically as part of `prebuild` (so every build is current); run manually with `npm run synonyms:update`.

**Files involved:** source CSVs `public/synonyms/Situations-synonyms.csv` and `Responses-synonyms.csv`; generated JSONs imported statically in `src/pages/results/getResultsMetaTags.ts`. **Keep CSV filenames exact** — renaming changes the generated JSON name and breaks the static import.

### How meta tags use them

`getResultsMetaTags.ts` matches active backend filters (`situation`, `response`, `by`) against the synonym JSONs and builds macro replacements; the `MetaTags` component (`src/services/metaTags/`) consumes `{ metaTags, macrosAndReplacements }` and injects `<title>`/`<meta>` into `<head>`.

Adding a macro: create it in `getResultsMetaTags.ts`, place the `%%myMacro%%` placeholder in `metaTags.json`, and make sure the returned `macrosAndReplacements` maps it.

**Validation checklist:** run `npm run synonyms:update` → confirm JSONs updated → `npm run dev` → visit a results page → inspect `<head>` for expanded tags (no raw `%%macro%%`).

**Pitfalls:** renamed CSV (broken import), missing `id`/`synonyms` column (row silently dropped), trailing spaces in `id` (filter mismatch), forgetting to rerun the script.

## Sitemaps

Two kinds, from two sources:

**Generated at build time** (all three run in `prebuild`):
- `scripts/generateMainSitemap.cjs` → `public/sitemap.xml` — the **sitemap index**, listing seven sub-sitemaps with `<loc>` on the env's `currentURL`. `cards.xml` gets a fresh `<lastmod>`; the rest use `sitemapsDefaultLastModified`. Order matters: the SSG crawler fills its route set in this order and truncates at `MAX_PAGES`, so the small always-local sitemaps go first and can never be dropped.
- `scripts/generateHomepageSitemap.cjs` → `public/sitemap/hpsitemap.xml` — pretty taxonomy URLs derived from `homepage.json` groups/labels.
- `scripts/generateStaticPagesSitemap.cjs` → `public/sitemap/staticpages.xml` — the standalone content pages (`about`, `missing`, `partners`, `contact`), so the SSG crawler discovers and prerenders them. **Keep its slug list in sync with `src/services/url/staticPages.ts`.**

**Served live by the BE** (proxied by nginx): `/sitemap/cards.xml`, `taxonomy.xml`, `mixedtaxonomy.xml`, `services.xml`, `organizations.xml` are proxied to the BE's sitemap endpoints, so they always reflect current data without an FE rebuild.

The SSG crawler consumes exactly this sitemap tree to discover what to pre-render — so the sitemaps are simultaneously the SEO surface **and** the SSG work list.

## Build Pipeline & npm Scripts

A full environment build is a chain:

```
npm run build:<env>
  └─ build:<env>:base
  │    └─ prebuild   → sitemap:staticpages + sitemap:homepage + sitemap:main + synonyms:update
  │    └─ build      → vite build  (dist/)
  │    └─ postbuild  → env json → dist/configs/environment.json (+ optional SWA config)
  └─ build:<env>:ssg  → ssg:generate (crawls dist/, writes static pages into it)
```

Environments: `development`, `stage`, `production` (with SSG) and `local` (base only, no SSG). `ENVIRONMENT` is set via `cross-env` by the wrapper scripts.

Vite specifics (`vite.config.ts`): a `buildId` (base-36 timestamp) is embedded in every entry/chunk/asset filename in addition to the content hash, `manifest: true`, sourcemaps on, target `esnext`.

Other scripts:

| Script | What it does |
| --- | --- |
| `dev` | Vite dev server (HMR) |
| `preview` | Vite preview of a built `dist/` |
| `lint` | ESLint |
| `docker:build:<env>` | full build + `docker build` (image `kolsherut_fe:<version>-<env>`; the `local` env drops the suffix) |
| `docker:save:<env>` | `docker save` the image to `../tars/kolsherut_fe.<version>-<env>.tar` |
| `tar:<env>` | docker build + save in one go |
| `ssg:generate` | run the SSG crawler against an existing `dist/` |
| `sitemap:staticpages` / `sitemap:homepage` / `sitemap:main` / `synonyms:update` | the prebuild steps, runnable standalone |

## Docker & nginx

### Dockerfile

Plain `nginx` base image, UTF-8 locale (SSG files contain Hebrew paths/content). The `environment` build-arg (`local`/`development`/`stage`/`production`) selects everything:

```dockerfile
COPY dist /usr/share/nginx/html
COPY nginx-${environment}.conf /etc/nginx/nginx.conf
COPY dist/redirects.map /etc/nginx/redirects.map
COPY dist/configs/${environment}.json .../configs/environment.json
```

The image is **fully static** — `dist/` (including all SSG pages) is baked in; there is no Node process at runtime.

### nginx configs

One file per environment; identical logic, different hostnames:

| File | server_name | BE (SSR + sitemaps) |
| --- | --- | --- |
| `nginx-production.conf` | kolsherut.org.il | be.kolsherut.org.il |
| `nginx-stage.conf` | staging.kolsherut.org.il | be-staging.kolsherut.org.il |
| `nginx-development.conf` | dev.kolsherut.org.il | be-dev.kolsherut.org.il |
| `nginx-local.conf` | localhost | localhost:5000 (BE container) |
| `nginx-*-hasadna.conf` | legacy Hasadna-cloud variants (api.kolsherut / whiletrue.industries hosts) |

Shared behavior (see the rendering section for the full decision flow):
- listens on **port 4000**;
- `redirects.map` (old card id → new card id) applied first as 301s;
- stage config also carries legacy rewrites (`/c/… → /p/card/c/…`, `/s/… → results`);
- HTML responses: `Cache-Control: no-cache, must-revalidate` (so config/SSG updates propagate); hashed static assets (`css|js|images|fonts`): `expires 1y, immutable`;
- CORS headers + `OPTIONS` short-circuit;
- bot detection map + `@bot_ssr` proxy;
- sitemap sub-files proxied to the BE.

## CI/CD

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) ("Deploy") — the single orchestrator shared by all services. FE is built in its `build-fe` job and deployed (together with the other changed services) in the single `deploy-nonprod` / `deploy-production` job. Images go to **Azure Container Registry** and deploy to **AKS** clusters (`kubectl` against deployment `kolsherut-fe`). Builds are `linux/arm64` only (the AKS node pools are ARM).

### Triggers & environment resolution

| Trigger | VERSION | Target env | Image tag | Deploys to |
| --- | --- | --- | --- | --- |
| push to `dev` (paths `FE/**` or the deploy workflow files) | `dev` | development | `:dev` | dev cluster (auto) |
| push to `main` | `stage` | stage | `:stage` | stage cluster (auto) |
| push to `production` branch | `production` | production | `:production` | prod cluster (auto job) |
| GitHub Release published / tag `v*` | tag without `v` | production | `:production` | prod cluster |

Concurrency is per-ref (`deploy-<ref>`, shared with all services) with `cancel-in-progress: false` — a newer push **queues** behind a still-running deploy of the same branch instead of cancelling it, so a cancelled run's cluster shutdown can never race the next run's deploy.

### The two-phase build (why the pipeline deploys twice)

SSG for tens of thousands of pages takes a long time. To get code changes live fast **without** waiting for the crawl, the pipeline ships twice:

**Phase 1 — base (no SSG), in the `build-fe` job:**
1. `npm run build:<env>:base` (prebuild → vite → postbuild).
2. Docker image built & pushed to ACR with the env tag; `dist/` is uploaded as the `fe-dist` artifact for phase 2.
3. Non-prod (dev/main): the shared `deploy-nonprod` job **starts the cluster once** (if it was stopped), deploys the BE first (so the SSG crawl hits the fresh backend), then `rollout restart` + waits for the FE rollout. The new code is now live, serving CSR/bot-SSR (old SSG pages are gone until phase 2).

**Phase 2 — SSG, inside the same `deploy-nonprod` job (the cluster is up).** Runs only when the `NONPROD_SSG_ENABLED` secret is `true` — see [Toggling SSG on dev/stage](#toggling-ssg-on-devstage).
4. The job downloads the `fe-dist` artifact and runs `npm run build:<env>:ssg` — the crawler discovers routes from the (now live) sitemaps and renders every page into `dist/`.
5. The image is rebuilt (now containing all static pages) and **pushed again with the same tag**.
6. Another `rollout restart` picks up the SSG-complete image.
7. If the workflow started a stopped cluster, an `always()` step stops it again at the very end of the job — even on failure — so dev/stage clusters don't run up cost. A cluster a human started stays running.

### Toggling SSG on dev/stage

The full non-prod crawl takes ~3 hours and keeps the dev/stage cluster running for all of it. A single GitHub **repository secret** switches phase 2 off for the non-prod environments without touching the workflow:

| Secret | Values | Effect |
| --- | --- | --- |
| `NONPROD_SSG_ENABLED` | `true` | Behaves as described above: base deploy → SSG crawl → SSG-complete image redeployed to dev/stage. |
| | anything else, or **unset** | Phase 2 is skipped on dev/stage. The base image (CSR for humans, bot-SSR via the BE) stays live, the `fe-dist` artifact is not uploaded, the cluster is stopped right after the service deploys, and the FE badge reports the *base* deploy outcome. |

Where it applies: **dev and stage only**. Production is never affected — the `build-fe` job always runs the SSG crawl for tags / the `production` branch regardless of this secret.

How it is read: the `detect` job resolves the secret once (case-insensitive match on `true`) into the `nonprod_ssg` output, because the `secrets` context is not available in job-level `if:` conditions. Every phase-2 step in `deploy-nonprod` and the `Upload dist For SSG Phase` step in `build-fe` are gated on that output; a skipped run logs a `Skip SSG Phase` step so the reason is visible in the run summary.

Setting it: GitHub → repository **Settings → Secrets and variables → Actions → Secrets** → `NONPROD_SSG_ENABLED` = `true` (or `gh secret set NONPROD_SSG_ENABLED --body true`). Delete the secret, or set it to `false`, to switch SSG off again. The change takes effect on the next deploy run; it never triggers one by itself. Note that after switching it off, the old pre-rendered `p/` pages are wiped on the next FE pod start (the `sync-config` initContainer overwrites the share from the image), so dev/stage serve no static pages until it is switched back on and a deploy completes.

### Production deploys

The `deploy-production` job (tags / `production` branch only) runs after the build job: Azure login → prod kube context → `kubectl set image` to the `:production` tag, sets `CODE_VERSION=<version>`, rollout restart, waits for status. Since the build job only completes after phase 2, production always receives the SSG-complete image.

### Release flow for team members

1. Merge PRs into `main` → stage deploys automatically; validate on staging.
2. Draft a GitHub Release with a **new** semantic tag `vMAJOR.MINOR.PATCH` targeting `main` → publish → production builds & deploys.
3. Rollback: publish a new release from a known-good commit (never reuse/delete tags), or point the deployment at a previous image manually.

Pushes that don't touch `FE/**` do not trigger this workflow at all.

## Local Development

### Dev server (fastest loop)

```bash
npm install
npm run dev
```

Vite serves on its default port with HMR. The environment used is whatever `public/configs/environment.json` currently points to — for local work make sure it matches `local.json` (or run a `build:local`, whose postbuild copies it). Config edits under `public/configs/` are picked up on refresh thanks to the cache-buster.

### Full stack via Docker (mirrors production)

From the repo root (`docker-compose.yml`): FE on **port 4000**, BE on **port 5000**.

```bash
npm run docker:build:local
```

then in the repo root:

```bash
docker compose up -d
```

With `nginx-local.conf`, sitemaps proxy to the local BE. If you received `.tar` images instead, `docker load -i <file>` and skip the build.

### Building distributable tars

```bash
npm run tar:stage
```

(or `tar:production` / `tar:development` / `tar:local`) — builds the env image and saves `../tars/kolsherut_fe.<version>-<env>.tar`.

### Verifying SSG locally

```bash
npm run build:development
```

then inspect `dist/` — you should see per-route folders each holding an `index.html`, and `dist/home/index.html` for the homepage. The crawler prints the first generated HTML in full for eyeballing.

## SEO Extras

- `public/robots.txt`, `public/llms.txt`, `public/BingSiteAuth.xml`, site-verification txt file.
- `index.html` sets `lang="he"`, preloads the RAG-Sans font family and the homepage background, `max-snippet:-1` robots hint.
- `metaTags.json` + synonyms drive per-page meta (see above); `jsonLd.json` drives structured data.
- `redirects.map` keeps old card URLs alive as 301s.
- Canonical URL cleanup is configured via `canonicalRemovals` in `config.json`.

## Cloud-Specific Notes

- The `nginx-*-hasadna.conf` files are legacy configs from the Hasadna cloud (hosts `api.kolsherut.org.il` / `srm-*.whiletrue.industries`). On that cloud volumes could not be mounted, so the BE emulated a file server and nginx rerouted to it. The current Azure setup bakes everything into the image and additionally mounts `configs/` and `p/` from a per-environment Azure File Share (see [docs/azure-environments.md](../docs/azure-environments.md)).
- `postbuild.cjs` also copies `staticwebapp-<env>.config.json` → `dist/staticwebapp.config.json` when present — a remnant of an Azure Static Web Apps deployment path; no such files currently exist in the repo, and the step warns and continues.
- Planned follow-ups from the last cloud migration: generate the sitemap as part of the ETL, and promote env→env by copying the previous level's bucket. (Configs on per-env mounted volumes is done — the Azure File Share above.)
