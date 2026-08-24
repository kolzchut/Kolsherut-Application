# Elasticsearch Tooling (`ES/`)

Everything Elasticsearch-related that is not application code lives here.

## Contents

- **[Dockerfile](Dockerfile)** — the Elasticsearch image used across the project: `elasticsearch:8.19.10` plus the `analysis-icu` plugin (required by the Hebrew analyzer the ETL publishes with). Both tools below build on it.
- **[Kibana](kibana/README.md)** — run Kibana locally against any Elasticsearch: the local replica, a port-forwarded remote cluster, or a reachable remote cluster.
- **[Reindex](reindex/README.md)** — bootstrap a local Elasticsearch replica filled with real data copied from a remote cluster (the `srm__cards_*` / `srm__autocomplete_*` indices the Back End reads).

## Typical local workflow

1. Use [reindex](reindex/README.md) to stand up a local ES on port 9200 and copy real indices into it.
2. Point the Back End's `.env` at `http://localhost:9200` with the matching `ENV` index pair.
3. Optionally use [kibana](kibana/README.md) on port 5601 to inspect the data.
