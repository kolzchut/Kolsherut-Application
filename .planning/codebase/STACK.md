# Stack — Kol Sherut (קול שירות)

## Overview

Government social services directory for Israeli citizens. Multi-service architecture with React SPA frontend, Node/Express backend, Elasticsearch data store, and Python ETL pipeline. Fully containerized with Docker.

## Languages & Runtimes

| Language | Version | Where Used |
|----------|---------|------------|
| TypeScript | ~5.7 (FE), ~4.9 (BE) | Frontend (React) and Backend (Express) |
| JavaScript (CJS) | Node 20.x | Build scripts, SSG crawler |
| Python | 3.x (Alpine) | ETL pipeline |
| YAML | — | Taxonomy definitions, config |

## Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI framework |
| Vite | 6.1.0 | Build tool and dev server |
| Redux Toolkit | 2.6.1 | State management |
| react-redux | 9.2.0 | React-Redux bindings |
| react-jss | 10.10.0 | CSS-in-JS styling (JSS) |
| OpenLayers (ol) | 10.6.0 | Interactive maps |
| axios | 1.7.9 | HTTP client |
| DOMPurify | 3.3.0 | XSS sanitization |
| react-ga4 | 2.1.0 | Google Analytics 4 |
| @hotjar/browser | 1.0.9 | Behavioral analytics |
| @fontsource/poppins | 5.2.5 | Font |
| js-yaml | 4.1.1 | YAML parsing (taxonomy) |
| cross-env | 10.0.0 | Cross-platform env vars |

### FE Dev Dependencies

| Technology | Version | Purpose |
|-----------|---------|---------|
| ESLint | 9.19.0 | Linting |
| typescript-eslint | 8.22.0 | TS lint rules |
| Puppeteer | 24.36.1 | SSG crawler |
| puppeteer-cluster | 0.25.0 | Parallel SSG crawling |
| vite-plugin-pwa | 0.21.1 | PWA support |
| fs-extra | 11.3.3 | File operations in scripts |

### FE Build Configuration

- **Entry**: `FE/src/main.tsx`
- **Build target**: `esnext`
- **Source maps**: enabled
- **Output**: Hashed filenames with build ID for cache busting
- **Config**: `FE/vite.config.ts`

## Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 4.21.2 | HTTP framework |
| @elastic/elasticsearch | 8.12.0 | Elasticsearch client |
| Puppeteer | 24.36.0 | Server-side rendering for bots |
| nodemailer | 7.0.9 | Email (Gmail SMTP) |
| cors | 2.8.5 | CORS middleware |
| xml2js | 0.6.2 | XML parsing |
| js-yaml | 4.1.0 | YAML parsing |
| axios | 1.11.0 | HTTP client |
| ts-node | 10.9.2 | TS runtime |
| nodemon | 3.0.1 | Dev auto-reload |

### BE Build Configuration

- **Compiler target**: ES6
- **Module system**: CommonJS
- **Output**: `be/dist/`
- **Config**: `be/tsconfig.json`

## ETL Stack (Python)

| Technology | Version | Purpose |
|-----------|---------|---------|
| dataflows | 0.5.5 | Data pipeline framework |
| dataflows-airtable | 0.2.5 | Airtable source/target |
| dataflows-elasticsearch | 0.1.1 | ES source/target |
| dataflows-ckan | 0.3.9 | CKAN open data |
| pandas | 2.2.3 | Data manipulation |
| pyairtable | 3.1.1 | Airtable API |
| elasticsearch | 7.13.4 | ES client |
| geocoder | 1.38.1 | Geocoding |
| pyproj | 3.7.2 | Coordinate projection |
| boto3 | 1.34.110 | AWS S3 operations |
| bleach | 6.2.0 | HTML sanitization |
| thefuzz | 0.22.1 | Fuzzy matching |
| lxml | 4.9.3 | XML/HTML parsing |
| psycopg2-binary | 2.9.9 | PostgreSQL client |
| requests | 2.32.3 | HTTP client |

### ETL Runtime

- **Scheduler**: Cronicle (via `soulteary/cronicle:latest` Docker image)
- **Python env**: Alpine + venv
- **Config**: `ETL/data/config.json` (Cronicle config)

## Data Store

| Technology | Version | Purpose |
|-----------|---------|---------|
| Elasticsearch | 8.19 | Primary data store — cards, autocomplete, sitemaps |
| ICU Analysis Plugin | — | Hebrew text analysis |

### ES Index Strategy

Environment-specific indices with timestamped names:
- `srm__cards_<timestamp>_<hash>`
- `srm__autocomplete_<timestamp>_<hash>`

Configured in `be/src/vars.ts` per environment (production/stage/development).

## Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker | Container packaging for all services |
| Docker Compose | Local orchestration (BE, FE, ES) |
| Nginx | FE static serving, bot detection, reverse proxy |

### Docker Images

| Service | Base Image | Port |
|---------|-----------|------|
| FE | `nginx` | 4000 |
| BE | `node:lts` (with Chromium) | 5000 |
| ETL | `soulteary/cronicle:latest` | 3012 |
| ES | Custom (with ICU plugin) | 9200 |

## Configuration Pattern

- **Environment variables**: All service config via env vars
- **Runtime JSON configs**: FE loads configs from `/configs/*.json` at startup
- **Docker volumes**: Config files mounted per environment
- **No `.env` files in app code** — injected at container level

---
*Mapped: 2026-03-22*
