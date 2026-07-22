# Kibana (`ES/kibana`)

Run [Kibana](https://www.elastic.co/kibana) locally and point it at **whatever Elasticsearch you
choose** — the local replica from [`../reindex`](../reindex), a port-forwarded remote cluster, or a
reachable remote cluster directly. Use it to browse indices, run Dev Tools queries, and inspect the
`srm__cards_*` / `srm__autocomplete_*` data the Back End reads.

Kibana version (`8.19.10`) matches the Elasticsearch built in [`../Dockerfile`](../Dockerfile).

Nothing is baked into the image — every connection setting is an **injected environment variable**
(see [`Dockerfile`](Dockerfile)). Locally, `docker compose` supplies them from `.env`; in a cluster
they come from the Deployment's `env` / `envFrom` (same pattern as the BE and ES).

---

## Local dev (docker compose + `.env`)

From the repository root:

```powershell
# 1. Create your config from the template.
Copy-Item ES/kibana/.env.example ES/kibana/.env

# 2. Edit ES/kibana/.env and set ELASTICSEARCH_HOSTS (+ auth if the cluster is secured).

# 3. Start Kibana.
docker compose -f ES/kibana/docker-compose.yml up -d

# 4. Open http://localhost:5601  (first startup takes a minute or two).

# Stop it when done:
docker compose -f ES/kibana/docker-compose.yml down
```

`docker compose` builds the [`Dockerfile`](Dockerfile) and injects the variables from `.env` into the
container's environment.

---

## Deployment (build the image, inject env at runtime)

For a cluster / server the image is built from the [`Dockerfile`](Dockerfile) and the variables are
injected by the orchestrator — **no `.env`**:

```bash
docker build -t kolsherut_kibana:0.0.0 ES/kibana

docker run -d -p 5601:5601 \
  -e ELASTICSEARCH_HOSTS=https://your-es:9200 \
  -e ELASTICSEARCH_USERNAME=elastic \
  -e ELASTICSEARCH_PASSWORD=... \
  -e ELASTICSEARCH_SSL_VERIFICATIONMODE=none \
  kolsherut_kibana:0.0.0
```

In Kubernetes, supply the same variables via the Deployment's `env` / `envFrom` (ConfigMap +
Secret), exactly as [`Infra/templates/be-deployment.yaml`](../../Infra/templates/be-deployment.yaml)
does for the Back End.

---

## Choosing the Elasticsearch (`.env`)

`.env` is **git-ignored**. The committed [`.env.example`](.env.example) is the template. Set
`ELASTICSEARCH_HOSTS` to the cluster you want:

| Target | `ELASTICSEARCH_HOSTS` | Auth |
|---|---|---|
| Local replica (`../reindex`, security disabled) | `http://host.docker.internal:9200` | leave blank |
| Port-forwarded remote (`kubectl port-forward svc/<es> 9201:9200`) | `http://host.docker.internal:9201` | as required |
| Remote cluster directly | `https://<host>` | username + password |

| Variable | Description | Example |
|---|---|---|
| `ELASTICSEARCH_HOSTS` | The Elasticsearch Kibana connects to. | `http://host.docker.internal:9200` |
| `ELASTICSEARCH_USERNAME` | Basic-auth user. Blank for a security-disabled cluster. | `elastic` |
| `ELASTICSEARCH_PASSWORD` | Basic-auth password. Blank for a security-disabled cluster. | `your-password` |
| `ELASTICSEARCH_SSL_VERIFICATIONMODE` | `none` skips cert checks (dev/self-signed https); `full` verifies. | `none` |

> **Why `host.docker.internal` and not `localhost`?** Kibana runs in a container, so `localhost`
> there means the container itself, not your machine. `host.docker.internal` reaches the host, where
> the local ES / port-forward listens. On Windows this also sidesteps the IPv6 (`::1`) WSL-relay
> issue that can make `localhost` hang. The `docker-compose.yml` maps `host.docker.internal` to the
> host gateway so this works on Linux too.

---

## Troubleshooting

- **"Kibana server is not ready yet"** — normal for the first minute or two after `up`. Watch
  `docker compose -f ES/kibana/docker-compose.yml logs -f`.
- **Cannot connect to Elasticsearch** — check `ELASTICSEARCH_HOSTS` is reachable from the container
  (use `host.docker.internal`, not `localhost`), the port-forward is up, and auth matches the
  cluster's security setting.
- **TLS / certificate errors** against an https cluster — set `ELASTICSEARCH_SSL_VERIFICATIONMODE=none`.
- **Version mismatch warnings** — Kibana's major.minor must match the target Elasticsearch. Bump the
  image tag in `docker-compose.yml` (and `../Dockerfile`) together if you upgrade.
