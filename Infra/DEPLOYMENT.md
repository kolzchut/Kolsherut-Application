# Kolsherut Helm Deployment Guide

This guide explains how to deploy the Kolsherut application across different environments (Development, Staging, Production) using the structured Helm configuration.

## Pre-requisites

1.  **Helm** installed.
2.  **Kubectl** configured to point to the correct cluster.
3.  **Local Secrets File**: You must have a `secrets-<env>.yaml` file locally. If not, copy `secrets.template.yaml` and fill in the credentials.

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

## Retrieval Service

The `retrieval` service (FastAPI) runs from the self-contained image `kosherutregistry.azurecr.io/kolsherut-retrieval`, which **bundles the local embedding model** — there is no model volume to provision, the pod pulls the image and warms the model on startup. It is a pure hybrid retriever (semantic kNN + lexical BM25 fused by RRF) over `srm_services`; there is no reranker and no LLM.

*   **Config:** non-secret settings live under `retrieval.env` in `values.yaml`; `ELASTIC_URL` is injected automatically (in-cluster Elasticsearch).
*   **Secrets:** `ELASTIC_USERNAME` / `ELASTIC_PASS` come from the shared secret (`secrets-<env>.yaml`).
*   **Reindex:** embed all services by calling `POST /api/services/reindex` on the service (synchronous — run it as a one-shot `kubectl` Job or a `curl` against the ClusterIP service); query at `POST /api/retrieve`. Budget **~2 h** for the ~9.9k carded services: measured **~1.2-1.4 services/s** sustained on CPU, an order of magnitude below what a short sample suggests, because throughput degrades as the index grows. Keep the SSE connection open for the whole run — the work is driven by the response stream, so **anything that drops the connection or the server process stops the embedding loop**, with no error on either side. In practice a 2 h foreground stream is fragile (a client timeout, a laptop sleep, or a restarted pod all kill it), so prefer a detached one-shot Job over a `curl` you have to babysit. Resume an interrupted run with `{"resume": true}` — it re-derives the remaining work from the index and is reliable — but only within the same build: resume keys on `service_id` alone and will not re-render a service whose text changed, so resuming across a rendering change silently produces a half-old, half-new corpus.
*   **Embedded-text changes are a breaking index change.** `RETRIEVAL_EMBEDDINGS_INDEX_NAME` is versioned and must be bumped in the same commit as any change to how `embedded_text` is rendered, then reindexed after rollout. Deploying new rendering code against the old index name lets `POST /api/services/update` mix old- and new-format documents into it, one service at a time, with no error. The index is created lazily on first embed, so a freshly bumped name serves an **empty** index until the reindex finishes.
*   **Networking:** internal-only by default (backend reaches it at `http://<release>-retrieval:8200`). To expose it, set `retrieval.ingress.enabled=true` and add `retrieval.ingress.hosts`/`tls` in the env values file.
*   **Startup:** the embedding model loads before `/health` responds; the startup probe allows up to ~10 min of warm-up. The image pull can be slow on first schedule.
*   **Disable entirely:** set `retrieval.enabled=false`.

## Troubleshooting

*   **Secrets Missing?** Ensure `secrets-<env>.yaml` exists and is filled out. It is ignored by git for security.
*   **Wrong Values?** Helm merges files from left to right. If a value is defined in multiple files, the file specified *last* in the command takes precedence.
