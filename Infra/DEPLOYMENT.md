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
*   **Reindex:** embed all services by calling `POST /api/services/reindex` on the service (synchronous — run it as a one-shot `kubectl` Job or a `curl` against the ClusterIP service); query at `POST /api/retrieve`.
*   **Networking:** internal-only by default (backend reaches it at `http://<release>-retrieval:8200`). To expose it, set `retrieval.ingress.enabled=true` and add `retrieval.ingress.hosts`/`tls` in the env values file.
*   **Startup:** the embedding model loads before `/health` responds; the startup probe allows up to ~10 min of warm-up. The image pull can be slow on first schedule.
*   **Disable entirely:** set `retrieval.enabled=false`.

## Troubleshooting

*   **Secrets Missing?** Ensure `secrets-<env>.yaml` exists and is filled out. It is ignored by git for security.
*   **Wrong Values?** Helm merges files from left to right. If a value is defined in multiple files, the file specified *last* in the command takes precedence.
