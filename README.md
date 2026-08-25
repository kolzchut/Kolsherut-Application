# KolSherut - כל שירות 

### Deploy Status

Last known result per service and environment (updated by the `Deploy` workflow after every run; a service untouched by a run keeps its previous status).

| Environment | FE | BE | ETL | Retrieval |
| --- | --- | --- | --- | --- |
| **Production** | [![FE production](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fproduction-fe.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![BE production](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fproduction-be.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![ETL production](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fproduction-etl.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![Retrieval production](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fproduction-retrieval.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) |
| **Stage** | [![FE stage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fstage-fe.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![BE stage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fstage-be.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![ETL stage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fstage-etl.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![Retrieval stage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fstage-retrieval.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) |
| **Dev** | [![FE dev](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fdev-fe.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![BE dev](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fdev-be.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![ETL dev](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fdev-etl.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) | [![Retrieval dev](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fkolzchut%2FKolsherut-Application%2Fdev%2F.badges%2Fdev-retrieval.json)](https://github.com/kolzchut/Kolsherut-Application/actions/workflows/deploy.yml) |

### [Repo][GitHub]
### [Board][Board]
### [Version Changes][Releases]

[GitHub]: https://github.com/kolzchut/Kolsherut-Application
[Board]: https://github.com/orgs/kolzchut/projects/8
[Releases]: https://github.com/kolzchut/Kolsherut-Application/releases

### Monitoring Versions

Versions are tracked on the **[Releases page][Releases]** — no technical setup needed, it's a plain web page:

- **Every version that went live is listed there**, newest first. Each entry shows the version number (e.g. `v1.17.2`), a short title saying what the version is about, the date it went live, and — when expanded — a bullet list of the changes it included.
- **The entry marked `Latest` at the top is the version currently running on the live site.** Everything below it is the version history.
- **Reading the version number** (`v1.MINOR.PATCH`): when the middle number goes up (`v1.16.x` → `v1.17.0`) the version delivered new features; when only the last number goes up (`v1.17.0` → `v1.17.1`) it delivered fixes to the previous version.
- Publishing a release on that page is also what triggers the production deployment itself — so the page is always in sync with what's live. The mechanics are in the [Deployment & Release Guide](#deployment--release-guide-for-all-team-members) below.



## Front End

Fully documented in **[FE/README.md](FE/README.md)** — architecture, the CSR / SSG / SSR rendering strategy, all configuration files, synonyms & meta tags, sitemaps, build pipeline, Docker/nginx, CI/CD, and local development.

## BackEnd

The BE is built with TypeScript and Node.js, using the Express framework. It handles requests from the frontend, processes data, interacts with Elasticsearch, and provides the on-demand SSR endpoint (`/ssr`) and live sitemap endpoints that the FE's nginx proxies to.

Fully documented in **[be/README.md](be/README.md)** — routes, all environment variables, the email notifier, local development, Docker, and CI/CD.

## ETL

- **[README](ETL/README.md)**
- **[Data](ETL/data.md)**
- **[Cronicle](ETL/CRONICLE.md)**
- Operator docs: **[publish](ETL/data/plugins/srm-etl/operators/publish/README.md)** (the current pipeline), **[derive](ETL/data/plugins/srm-etl/operators/derive/README.md)** (legacy pipeline reference), **[deploy](ETL/data/plugins/srm-etl/operators/deploy/README.md)** (Airtable base sync).

## Elasticsearch Tooling (`ES/`)

Overview in **[ES/README.md](ES/README.md)**.

- **[Kibana](ES/kibana/README.md)** — run Kibana locally against any Elasticsearch (the local replica, a port-forwarded remote cluster, or a reachable remote cluster).
- **[Reindex](ES/reindex/README.md)** — bootstrap a local Elasticsearch replica filled with real data copied from a remote cluster.

## Infrastructure (`Infra/`)

The Helm chart that deploys all services to AKS — base [values.yaml](Infra/values.yaml), per-environment `values-<env>.yaml` overrides, and secrets templates. Deployment instructions in **[Infra/DEPLOYMENT.md](Infra/DEPLOYMENT.md)**.

**Azure operations (for all team members):** **[docs/azure-environments.md](docs/azure-environments.md)** — portal links for every environment, how to start/stop the dev and staging clusters, and how to edit the frontend configuration files on each environment's Azure File Share (the share, not the repo, is what a running environment serves).

## Docs (`docs/`)

- **[Azure Environments — Operations Guide](docs/azure-environments.md)** — clusters, URLs, start/stop, editing live FE configs.
- **[Embedding v4 (Gemini) spec](docs/embedding-v4-gemini-spec.md)** and **[Evaluation relevance-judging spec](docs/evaluation-relevance-judging-spec.md)** — design specs for the AI services.

## AI

- **Retrieval** — [retrieval/README.md](retrieval/README.md): the hybrid retrieval microservice.
- **Evaluation** — [evaluation/README.md](evaluation/README.md): offline evaluation of the retrieval service against ground truth from the live staging site.

## CI CD

All four services (FE, BE, ETL, Retrieval) are handled by a single orchestrator workflow, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) ("Deploy"). It detects which service folders changed, builds the changed images **in parallel** (be/ETL/retrieval via [`.github/workflows/reusable-build-image.yml`](.github/workflows/reusable-build-image.yml)), and then deploys them all in **one job**. Images are pushed to **Azure Container Registry** and deployed to **AKS** clusters via `kubectl` (built for `linux/arm64` — the AKS node pools are ARM).

Current automated behavior:
- Push to `dev` → builds and deploys changed services to the **development** environment (`:dev` image tag).
- Push to `main` → builds and deploys changed services to **staging** (`:stage` image tag).
- Push to the `production` branch → builds and deploys changed services to **production** (`:production` image tag).
- Publishing a GitHub Release (tag `v*`) → builds and deploys **all** services to production.

Dev and stage clusters may be powered off; the deploy job detects a stopped cluster, starts it **once**, deploys every changed service inside that window, and stops it again afterwards. (Before the merge into one workflow, parallel per-service runs could stop the cluster under each other's deploys.) A cluster that was already running — e.g. started manually — is never stopped by the workflow. Starting/stopping a cluster by hand is described in [docs/azure-environments.md](docs/azure-environments.md#starting-and-stopping-a-cluster).

The FE deploy additionally runs a two-phase flow (fast base deploy, then a full SSG crawl and redeploy inside the same cluster window) — detailed in [FE/README.md](FE/README.md#cicd).

### Codebase Knowledge Graph

Every push to `main` / `dev` builds a queryable knowledge graph of the codebase (the
`Graphify Knowledge Graph` workflow). Use it instead of grepping when you need to know
how components connect.

**Get the latest graph:**
```bash
gh run download -n graphify-graph -D graphify-out
```

**Query it** (requires `pipx install graphifyy==0.9.29`):
```bash
graphify query "how does retrieval connect to ETL?"
graphify path "<node A>" "<node B>"     # shortest path between two nodes
graphify affected "<node>"              # what breaks if this changes
graphify god-nodes --top 10             # most connected hubs
```

`graphify-out/graph.html` is an interactive visualization; `GRAPH_REPORT.md` lists hubs
and suggested questions.

**What the graph covers:** Python, TypeScript/TSX and JS across `ETL/`, `FE/`, `be/`,
`retrieval/` and `evaluation/` — functions, classes, imports and call edges, parsed
locally with tree-sitter AST.

**What it does NOT cover.** The graph is built `--code-only`, so absence of something is
not evidence it doesn't exist:
- No YAML. `Infra/`, `docker-compose.yml` and `.github/workflows/` are **not** in the
  graph — do not use it to answer infrastructure or deployment questions.
- No Markdown, and no images.
- Communities are unnamed placeholders (`Community 1`, ...).
- `retrieval/artifacts/` (the Git LFS embedding model) is excluded via `.graphifyignore`.

For a fuller graph that *does* include `Infra/` and the docs, run `/graphify .` locally in
an AI assistant that has the graphify skill installed — that path uses the assistant's own
model, so it needs no API key.

---
## Developers

### Running locally

1. In case you got `.tar`s for **FE** and **BE**, load them using `docker load -i {fileName}` and skip to step 4.
2. Make sure Docker is installed and running on your machine.
3. In the **FE** folder run `npm run docker:build:local`, and in the **BE** folder run `npm run docker:build`.
4. Copy `.env.example` to `.env` in the main folder and fill in the Elasticsearch credentials and the image tags of the images you built/loaded (the build scripts tag images with the `version` from each `package.json`). `docker-compose.yml` itself holds no secrets.
5. The `retrieval` service is built from `retrieval/` by compose (`docker compose build retrieval`; run `git lfs pull` there first so the embedding model is present). Leave it out with `docker compose up -d be fe` if you only need FE + BE.
6. Make sure all the configuration files are set correctly (FE configs: see [FE/README.md](FE/README.md#configuration-files)).
7. Run in the main folder:
    ```bash
    docker compose up -d
    ```
* Be aware, frontend is served on host port 5173 (nginx listens on 4000 inside the container), backend on port 5000 and retrieval on port 8200. Host ports are set via `FE_PORT` / `BE_PORT` / `RETRIEVAL_PORT` in `.env`.

### Building tar files for FE and BE

1. Make sure Docker is installed and running on your machine.
2. In the **BE** folder run:
```bash
npm run tar
```
3. In the **FE** folder, decide which environment you want to build for, and run:
```bash
npm run tar:{environment}
```

---
## Deployment & Release Guide (For All Team Members)
Simple steps for staging (test) and production (live). No local build needed.

### 1. Staging Deployment (Automatic on push to main)
Use when: You want updated code on the staging environment.
Steps:
1. Ensure your feature branch was merged into `main` via a Pull Request (PR).
2. After merge, go to GitHub → Repository → "Actions" tab.
3. Look for the `Deploy` workflow run (it runs when any of `FE/`, `be/`, `ETL/`, `retrieval/` changed; inside the run, only the changed components are built and deployed — the rest show as skipped).
4. Open the workflow run (top of the list) and watch the steps. A green check means success.
5. When finished, the `:stage` image is pushed to ACR and the staging AKS deployment is restarted automatically.
6. Validate staging:
   - Open the staging URL & sanity-check: homepage, search, card page.

If something is wrong: Fix code → new PR → merge → staging redeploys automatically.

### 2. Production Deployment (Manual via Release Tag)
Use when: You approve staging and want to publish to production.
Steps:
1. Confirm staging is healthy (basic flows OK, no blocking bugs).
2. Decide a new semantic version (e.g. `v1.3.0`). Do not reuse an existing tag.
3. GitHub → "Releases" → "Draft a new release".
4. In "Tag version": type the new tag (e.g. `v1.3.0`) and target branch = `main`.
5. Title: e.g. `Release v1.3.0`.
6. Description: bullet list of notable changes (copy from merged PR titles if needed).
7. Click "Publish release".
8. This triggers the `Deploy` workflow's production path for **all** components: `:production` images are built, pushed to ACR, and rolled out to the production AKS cluster with `CODE_VERSION=<tag>`.
9. Monitor under "Actions" like staging. Wait for green check.
10. Validate production: open site, run smoke checks (search, open card, any critical flows).

Rollback (simple):
- Create a new release from a known-good commit with a new incremented tag (e.g. if `v1.3.0` is bad, re-release the stable commit as `v1.3.1`). The workflow publishes new images and redeploys.
- OR (DevOps only) manually point the AKS deployment at a previous image.

### 3. Quick Trigger Reference
| Action              | What deploys     | Environment | Image Tag     |
| ------------------- | ---------------- | ----------- | ------------- |
| Push to `dev`       | changed components| Development | `:dev`        |
| Push to `main`      | changed components| Staging     | `:stage`      |
| Release / tag `v*`  | all components   | Production  | `:production` |

### 4. Versioning Rules
- Use `vMAJOR.MINOR.PATCH` (e.g. `v1.4.2`).
- Increment:
  - MAJOR: breaking changes
  - MINOR: new features (backward compatible)
  - PATCH: fixes / small changes
- Never reuse or delete tags.

### 5. What Gets Deployed
- On branch pushes, only components whose folders changed are built & deployed (the rest are skipped inside the single `Deploy` run). A release deploys all components.
- FE sitemaps and SSG pages are generated during the deploy (per-environment) — see [FE/README.md](FE/README.md#cicd).

### 6. Common Questions
Q: I pushed to main, but FE didn't deploy?  
A: No changes under `FE/` → the `Deploy` run skips the FE jobs. Same rule per component folder. If nothing under any service folder changed, no `Deploy` run is triggered at all.

Q: Release created but FE didn't deploy?  
A: Releases deploy all four components — check the `Deploy` run of the release under Actions for the failing job.

Q: Can I edit a release note after publishing?  
A: Yes. Editing text doesn't redeploy. To redeploy you must create a new tag.

Q: How do I know which image is live?  
A: The release marked **Latest** on the [Releases page][Releases] is the current production version. To verify at the cluster level, check the deployment's image tag in AKS / ArgoCD, or the `CODE_VERSION` env on the production deployment.

Q: I can't find the correct json config file, where is it?  
A: FE config files are in `FE/public/configs/`; some rarely-changed data lives in `FE/src/assets/`. Full list in [FE/README.md](FE/README.md#configuration-files).

### 7. Pre-Production Checklist
- [ ] All intended PRs merged to main
- [ ] Staging smoke tests pass
- [ ] Version chosen (unique tag)
- [ ] Release notes written
- [ ] No open critical issues

### 8. After Deployment Checklist
- [ ] Homepage loads
- [ ] Search returns results
- [ ] Card page loads
- [ ] (If changed) New sitemap served
- [ ] Analytics events visible (if applicable)
