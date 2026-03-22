# Integrations — Kol Sherut (קול שירות)

## Overview

The system integrates with multiple external services across all layers: data sourcing (ETL), search (BE), analytics (FE), and mapping/geocoding (FE + ETL).

## Primary Data Store

### Elasticsearch 8.19
- **Used by**: BE (queries), ETL (loading), ES container
- **Client**: `@elastic/elasticsearch` 8.12.0 (BE), `elasticsearch` 7.13.4 (ETL)
- **Indices**: Cards, Autocomplete — environment-specific with timestamps
- **Connection**: `be/src/services/db/es/es.ts` — singleton client, retry on disconnect
- **ICU plugin**: Installed for Hebrew text analysis
- **Authentication**: Basic auth (username/password via env vars)
- **DSL builders**: `be/src/services/db/es/dsl/` — query construction for search, autocomplete, sitemap, cards

## Analytics & Tracking

### Google Analytics 4
- **Used by**: FE
- **Library**: `react-ga4` 2.1.0
- **Location**: `FE/src/services/gtag/analytics.ts`
- **Events**: Search, card views, filter usage, page navigation
- **Blocked in SSR**: `be/src/assets/blockAnalytics.json` domains blocked by Puppeteer

### Hotjar
- **Used by**: FE
- **Library**: `@hotjar/browser` 1.0.9
- **Location**: `FE/src/services/hotjar/hotjar.ts`
- **Purpose**: Heatmaps, session recordings, behavioral analytics

## Maps & Geocoding

### OpenLayers (Frontend)
- **Used by**: FE
- **Library**: `ol` 10.6.0
- **Location**: `FE/src/services/map/map.ts`
- **Features**: OSM tile layer, POI markers with clustering, popup overlays, bounding box filtering
- **Integration**: Results with lat/lon displayed on map, clicking markers shows service details

### GovMap API (ETL)
- **Used by**: ETL geocoding
- **Purpose**: Primary geocoding for Israeli addresses
- **Auth**: API key via `ETL_GOVMAP_API_KEY` env var

### Google Maps API (ETL)
- **Used by**: ETL geocoding
- **Purpose**: Fallback geocoding
- **Auth**: API key via `ETL_GOOGLE_MAPS_API_KEY` env var

### Mapbox (ETL)
- **Used by**: ETL
- **Purpose**: Tileset uploads for staging geographic data
- **Auth**: API key via env var

## Data Sources (ETL)

### Airtable
- **Used by**: ETL
- **Library**: `pyairtable` 3.1.1, `dataflows-airtable` 0.2.5
- **Purpose**: Staging area for service data — two bases (staging + production)
- **Auth**: Personal access token via env var
- **Operations**: Read records, update records, write new records

### GuideStar API
- **Used by**: ETL
- **Location**: `ETL/data/plugins/srm-etl/srm_tools/guidestar_api.py`
- **Purpose**: Israeli NGO/nonprofit registry data extraction
- **Auth**: API key via env var

### CKAN (DataCity)
- **Used by**: ETL
- **Library**: `dataflows-ckan` 0.3.9
- **Purpose**: Open data portal integration
- **Auth**: API key via `CKAN_API_KEY` env var

### Government Data Sources
- **Kolzchut** (knowledge base for social rights) — taxonomy YAML
- **Government offices** — various API integrations for services data
- **Location**: `ETL/data/plugins/srm-etl/operators/` (per data source)

## Email

### Nodemailer (Gmail SMTP)
- **Used by**: BE
- **Library**: `nodemailer` 7.0.9
- **Location**: `be/src/services/email/emailService.ts`
- **Features**: Send notifications, weekly keep-alive email in production
- **Config**: Gmail SMTP (smtp.gmail.com:587) with app password

### ETL Email Notifications
- **Used by**: ETL
- **Location**: `ETL/data/config.json` (Cronicle config)
- **Purpose**: Job completion/failure notifications

## SSR / Bot Rendering

### Puppeteer (Server-side Rendering)
- **Used by**: BE
- **Library**: `puppeteer` 24.36.0
- **Location**: `be/src/services/ssr/ssrService.ts`
- **Purpose**: Render pages for search engine bots and social media crawlers
- **Browser**: System Chromium (installed in Docker image)
- **Analytics blocking**: Blocks analytics domains during SSR (`be/src/assets/blockAnalytics.json`)
- **Nginx integration**: bot user-agent → redirect to `/ssr` endpoint

## Taxonomy (Kolzchut OpenEligibility)
- **Used by**: FE, BE
- **Source**: Remote YAML file (GitHub-hosted)
- **FE location**: `FE/src/services/setTaxonomy.ts` — fetched at app init
- **BE location**: Referenced in `be/src/vars.ts`
- **Purpose**: Hierarchical taxonomy of service responses and life situations
- **Format**: YAML parsed to flat tree structures

## SSG (Static Site Generation)
- **Used by**: FE build process
- **Library**: Puppeteer + puppeteer-cluster (dev dependencies)
- **Location**: `FE/scripts/ssg-crawler/`
- **Purpose**: Pre-render pages for SEO (homepage, card pages)
- **Components**: sitemap generation, URL crawling, HTML capture

## AWS
- **Used by**: ETL
- **Library**: `boto3` 1.34.110
- **Purpose**: S3 operations (data backup/storage)

## PostgreSQL
- **Used by**: ETL (connection available)
- **Library**: `psycopg2-binary` 2.9.9
- **Purpose**: Likely for specific data source access during ETL

---
*Mapped: 2026-03-22*
