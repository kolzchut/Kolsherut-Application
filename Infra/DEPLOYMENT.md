# Kolsherut Helm Deployment Guide

This guide explains how to deploy the Kolsherut application across different environments (Development, Staging, Production) using the structured Helm configuration.

## Pre-requisites

1.  **Helm** installed.
2.  **Kubectl** configured to point to the correct cluster.
3.  **Local Secrets File**: You must have a `secrets-<env>.yaml` file locally. If not, copy `secrets.template.yaml` and fill in the credentials.
4.  **A running cluster**: dev and staging clusters are usually stopped. Portal links and start/stop steps are in [docs/azure-environments.md](../docs/azure-environments.md), which also documents the frontend Azure File Share that `frontend.persistence` binds to.

## Deployment Command Structure

To install or upgrade the release, you need to combine three configuration files:
1.  `values.yaml` (Base configuration)
2.  `values-<env>.yaml` (Environment overrides)
3.  `secrets-<env>.yaml` (Local secrets)

**Note:** The command `helm upgrade --install` handles both initial installation (if the release doesn't exist) and updating an existing release. You run the exact same command to push updates.

### 1. Development

Run the following command from the chart directory:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-dev.yaml -f secrets-dev.yaml
```

*   **Release Name:** `kolsherut`
*   **Path:** `.` (Current directory)
*   **Files:** Base + Dev Overrides + Dev Secrets

### 2. Staging

Switch your kubectl context to the staging cluster (if applicable) and run:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-staging.yaml -f secrets-staging.yaml
```

### 3. Production

Switch your kubectl context to the production cluster and run:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-prod.yaml -f secrets-prod.yaml
```

---

## ETL Plugins Share

The ETL mounts the `srm-etl` plugin tree from an RWX Azure File Share (`etl-plugins` on the
same storage account as the frontend share — see
[docs/azure-environments.md](../docs/azure-environments.md)) so that CI can deploy a plugin
change without an image build or a cluster start. The chart pieces are
`templates/etl-plugins-storage.yaml` (Secret + static PV), `templates/etl-plugins-pvc.yaml`,
and the `seed-plugins` initContainer plus ten read-only `subPath` mounts in
`templates/etl-deployment.yaml`.

**CI never runs Helm**, so adding or changing any of this requires a manual
`helm upgrade` per environment. To bring an environment onto the share:

1.  Create the `etl-plugins` share on that environment's storage account.
2.  Put the account name and key in `secrets-<env>.yaml` under `etl.pluginsShare`
    (same values as `frontend.persistence.*`) — see `secrets.template.yaml`.
3.  Add the matching `<DEV|STAGE|PROD>_ETL_PLUGINS_STORAGE_ACCOUNT` / `_KEY` repository
    secrets so the `sync-etl-plugins` job can reach it.
4.  Run the `helm upgrade` for that environment.

Order does not matter for safety: the image still carries a full copy of the plugin tree, so
an ETL pod deployed before the share exists behaves exactly as it did before the share was
introduced.

On the first pod start with the share mounted, check the seeding decision:

```bash
kubectl logs deployment/kolsherut-etl -c seed-plugins -n default
```

**Both outcomes are healthy** — which one you get depends on the order you did the steps in:

*   `share populated - leaving it alone` — the usual result when following the steps above,
    because the `sync-etl-plugins` job writes the share over the REST API and needs neither
    the mount nor a running pod. So if any plugin change was pushed between step 3 and step 4,
    CI has already filled the share.
*   `share empty - seeding from image` — the share was still empty at first mount, so the
    initContainer populated it from the image copy.

Either way the share is authoritative from then on, and an image rebuild never reverts a
plugin change. If the initContainer instead fails, the share is present but incomplete: the
sentinel checks refuse to start a pod on a half-synced tree. Re-run the `sync-etl-plugins`
job (or empty the share to force a reseed) rather than restarting the pod.

*   **Resize:** the PVC is statically bound and cannot be resized in place. Change
    `etl.pluginsShare.size` **and** bump `etl.pluginsShare.shareGeneration`; Helm then creates
    a fresh PV/PVC pair on the same share and the ETL rolls onto it.
*   **Never** run `azcopy remove --recursive` or `az storage directory delete --recursive` on
    this share. The ten plugin directories are `subPath` bind mounts resolved at container
    start, so deleting one behind the mount leaves the running pod with a stale view until it
    restarts. The CI sync only ever removes files.
*   **Disable:** set `etl.pluginsShare.enabled: false` and the ETL falls back to the plugin
    copy inside the image, with no share, no seeding and no mounts.

---

## Non-Prod Basic Auth (dev / staging)

`dev.kolsherut.org.il` and `staging.kolsherut.org.il` are guarded by HTTP Basic Auth at the ingress (`frontend.ingress.basicAuth.enabled: true` in `values-dev.yaml` / `values-staging.yaml`). Production leaves it disabled. This keeps the non-prod sites out of search engines and away from casual visitors — a per-host `robots.txt` cannot do that (robots rules are per host and advisory only).

*   **Scope:** only the **FE** ingress. The BE (`be-<env>`), ETL and retrieval ingresses are untouched: the browser calls the BE cross-origin (Basic Auth credentials would not carry over), and the SSG crawler in `deploy.yml` renders against `127.0.0.1:3000` and the BE hosts directly, so neither the deploy nor the SSG phase is affected.
*   **Credentials:** `frontend.ingress.basicAuth.username` / `password` in `secrets-<env>.yaml` (see `secrets.template.yaml`). Helm renders them into the `<release>-fe-basic-auth` Secret (htpasswd, bcrypt) that the ingress `auth-secret` annotation points at. `helm upgrade` fails with a clear message if either is missing while `enabled` is true.
*   **Rotate:** change the values in `secrets-<env>.yaml` and rerun the `helm upgrade` for that environment; ingress-nginx picks up the new Secret without a pod restart.
*   **Automation that browses the non-prod FE** (e.g. the `evaluation/` headless-browser runner against staging) must now send the credentials, e.g. `https://<user>:<pass>@staging.kolsherut.org.il/`.
*   **Disable for one environment:** set `frontend.ingress.basicAuth.enabled: false` in that env's values file.

---

## Retrieval Service

The `retrieval` service (FastAPI) runs from the self-contained image `kosherutregistry.azurecr.io/kolsherut-retrieval`, which **bundles the local embedding model** — there is no model volume to provision, the pod pulls the image and warms the model on startup. It is a pure hybrid retriever (semantic kNN + lexical BM25 fused by RRF) over `srm_services`; there is no reranker and no LLM.

*   **Config:** non-secret settings live under `retrieval.env` in `values.yaml`; `ELASTIC_URL` is injected automatically (in-cluster Elasticsearch).
*   **Secrets:** `ELASTIC_USERNAME` / `ELASTIC_PASS` come from the shared secret (`secrets-<env>.yaml`), and — because the chart now ships `EMBEDDING_PROVIDER: "gemini"` — so does `GEMINI_EMBEDDER_API_KEY`. **That key is required, not optional, at the shipping default.** The startup dimension probe is itself an embed call, so a missing or unauthorised key raises inside the FastAPI lifespan and the pod **CrashLoopBackOffs** — it never starts serving, which is the loud failure you want rather than per-request 500s. Cluster egress to `generativelanguage.googleapis.com:443` is verified open from the retrieval pod; egress being open says nothing about the key existing or being authorised for `gemini-embedding-001`, so on a failure check the key first, not the network.
*   **Embedding arm:** `EMBEDDING_PROVIDER` selects the embedder at runtime — `"gemini"` (Google API, 3072 dims) or `"local"` (the bundled sentence-transformers model, 1024 dims). It must always be changed **in the same commit** as `RETRIEVAL_EMBEDDINGS_INDEX_NAME`, because the two vector spaces are not interchangeable; a startup guard compares the index's stored dimensions against the live provider and refuses to boot on a mismatch rather than serving confident nonsense. Both indexes exist and are fully populated (9,871 services each), so switching arms in either direction needs **no reindex**. Rollback is `EMBEDDING_PROVIDER: "local"` plus `RETRIEVAL_EMBEDDINGS_INDEX_NAME: "srm__services_retrieval_embeddings_v3_enriched"`. Note that on the gemini arm `/api/retrieve` gains a per-query Google dependency with **no degraded path** — a Gemini outage returns 500 rather than falling back to BM25.
*   **Reindex:** embed all services by calling `POST /api/services/reindex` on the service (synchronous — run it as a one-shot `kubectl` Job or a `curl` against the ClusterIP service); query at `POST /api/retrieve`. Budget **~2 h** for the ~9.9k carded services: measured **~1.2-1.4 services/s** sustained on CPU, an order of magnitude below what a short sample suggests, because throughput degrades as the index grows. Keep the SSE connection open for the whole run — the work is driven by the response stream, so **anything that drops the connection or the server process stops the embedding loop**, with no error on either side. In practice a 2 h foreground stream is fragile (a client timeout, a laptop sleep, or a restarted pod all kill it), so prefer a detached one-shot Job over a `curl` you have to babysit. Resume an interrupted run with `{"resume": true}` — it re-derives the remaining work from the index and is reliable — but only within the same build: resume keys on `service_id` alone and will not re-render a service whose text changed, so resuming across a rendering change silently produces a half-old, half-new corpus.
*   **Embedded-text changes are a breaking index change.** `RETRIEVAL_EMBEDDINGS_INDEX_NAME` is versioned and must be bumped in the same commit as any change to how `embedded_text` is rendered, then reindexed after rollout. Deploying new rendering code against the old index name lets `POST /api/services/update` mix old- and new-format documents into it, one service at a time, with no error. The index is created lazily on first embed, so a freshly bumped name serves an **empty** index until the reindex finishes.
*   **Networking:** internal-only by default (backend reaches it at `http://<release>-retrieval:8200`). To expose it, set `retrieval.ingress.enabled=true` and add `retrieval.ingress.hosts`/`tls` in the env values file.
*   **Startup:** the embedding model loads before `/health` responds; the startup probe allows up to ~10 min of warm-up. The image pull can be slow on first schedule.
*   **Disable entirely:** set `retrieval.enabled=false`.

## Troubleshooting

*   **Secrets Missing?** Ensure `secrets-<env>.yaml` exists and is filled out. It is ignored by git for security.
*   **Wrong Values?** Helm merges files from left to right. If a value is defined in multiple files, the file specified *last* in the command takes precedence.
