# Architecture — Kol Sherut (קול שירות)

## Pattern

**Multi-tier Web Application** with:
- **SPA Frontend** (React) served via Nginx with SSR fallback for bots
- **REST API Backend** (Express) connecting to Elasticsearch
- **Python ETL Pipeline** (Cronicle scheduler) feeding data into ES
- **Elasticsearch** as the single source of truth for runtime data

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Nginx (FE)  │     │  ETL Python  │
│   (React)    │◀────│  Port 4000   │     │  (Cronicle)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │  API calls         │  Bot → SSR proxy    │  Data load
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────────────────────────────┐   ┌──────────────┐
│         Express Backend (BE)         │   │  Airtable    │
│         Port 5000                    │   │  (staging)   │
│  ┌────────┐ ┌────────┐ ┌────────┐   │   └──────────────┘
│  │ Search │ │  Card  │ │  SSR   │   │
│  │ Route  │ │ Route  │ │Service │   │
│  └───┬────┘ └───┬────┘ └───┬────┘   │
│      └──────┬───┘          │         │
│             ▼              ▼         │
│      ┌─────────────┐  ┌─────────┐   │
│      │  ES DSL     │  │Puppeteer│   │
│      │  Builders   │  │ Browser │   │
│      └──────┬──────┘  └─────────┘   │
└─────────────┼────────────────────────┘
              ▼
       ┌──────────────┐
       │Elasticsearch │
       │  Port 9200   │
       │  (ICU + HE)  │
       └──────────────┘
```

## Layers

### Frontend Layer (FE/)

**Responsibility**: User interface, client-side routing (URL-driven), search interaction, map display, accessibility.

**Key abstractions**:
- **Pages**: `home`, `results`, `card`, `maintenance` — selected via Redux `page` state
- **Redux Store**: 3 slices (`general`, `data`, `filter`) + shared orchestration utilities
- **Services**: Stateless modules for API, URL routing, config loading, analytics, taxonomy
- **Components**: Reusable UI — header, footer, sidebar, modal system, map, labels, links

**Routing**: No React Router — custom URL-driven routing via `FE/src/services/url/route.tsx`:
- URL params → Redux state on load + popstate
- Redux state changes → URL updates via `history.pushState`
- Params: `p` (page), `c` (card), `sq` (search query), `lf`/`rf`/`sf` (filters), `by`/`brf`/`bsf`/`bsnf` (backend filters)

**Data flow**:
1. User types search → debounced autocomplete API call
2. User submits → POST `/search` with filters
3. Two-phase response: fast (50 results) renders immediately, then rest (300) merges in
4. Results populate Redux `data.results` → rendered by results page
5. Card click → GET `/card/:id` → card page

### Backend Layer (BE/)

**Responsibility**: REST API, Elasticsearch query construction, SSR for bots, sitemap generation, email notifications.

**Key abstractions**:
- **Routes**: Express route handlers — thin, delegate to services
- **DSL Builders**: `be/src/services/db/es/dsl/` — construct ES queries from request params
- **DB Service**: `be/src/services/db/` — ES client wrapper with connection management
- **SSR Service**: `be/src/services/ssr/` — Puppeteer singleton for bot rendering
- **Email Service**: `be/src/services/email/` — nodemailer with keep-alive

**Request flow**:
1. Request → Express route handler → sanitization middleware
2. Route handler calls DSL builder to construct ES query
3. ES query executed via db service
4. Response transformed / mapped and returned as JSON

### ETL Layer (ETL/)

**Responsibility**: Data extraction from external sources, transformation, loading into Elasticsearch and Airtable.

**Key abstractions**:
- **Operators**: `ETL/data/plugins/srm-etl/operators/` — per-data-source pipelines (guidestar, government offices, manual data, taxonomy)
- **Extractors**: `ETL/data/plugins/srm-etl/extract/` — Airtable and API extraction
- **Transformers**: `ETL/data/plugins/srm-etl/transform/` — data normalization
- **Loaders**: `ETL/data/plugins/srm-etl/load/` — Airtable writing
- **SRM Tools**: `ETL/data/plugins/srm-etl/srm_tools/` — shared utilities, API clients, geocoding
- **Scheduler**: Cronicle manages job scheduling, retries, logging

**Data flow**:
1. Cronicle triggers operator pipeline on schedule
2. Operator extracts from source API → transforms → loads into Airtable (staging)
3. Deploy operator promotes staging → production (Airtable + ES)

### Data Layer (Elasticsearch)

**Responsibility**: Full-text search, autocomplete, structured data retrieval.

**Indices**:
- `srm__cards_*` — service cards (main data)
- `srm__autocomplete_*` — autocomplete suggestions

**Features used**:
- Full-text search with Hebrew ICU analyzers
- Nested queries for hierarchical taxonomy filtering
- Scroll API for sitemap generation
- Inner hits for branch/service details within cards

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| FE App | `FE/src/main.tsx` | React app bootstrap + config loading |
| BE Server | `be/src/index.ts` | Express server startup + DB init |
| ETL Operators | `ETL/data/plugins/srm-etl/operators/*.py` | Cronicle-triggered pipelines |
| SSG Crawler | `FE/scripts/ssg-crawler/index.cjs` | Static site generation |

## Cross-Cutting Concerns

### Bot Detection & SSR
- Nginx maps user-agent to `$is_bot` variable
- Bots redirected to `be.kolsherut.org.il/ssr` (Puppeteer renders React app)
- Analytics domains blocked during SSR

### Configuration
- FE: Runtime JSON configs loaded from `/configs/*.json` at startup
- BE: Environment variables (Elastic connection, ports, indices)
- ETL: `.env` file + Cronicle config

### Logging
- FE: Client-side errors sent to BE via POST `/logs/:provider`
- BE: Custom logger (`be/src/services/logger/logger.ts`) — console + file + configurable verbosity
- ETL: Cronicle built-in logging + custom `logger.py`

---
*Mapped: 2026-03-22*
