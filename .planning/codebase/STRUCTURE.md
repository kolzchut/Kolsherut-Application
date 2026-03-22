# Structure — Kol Sherut (קול שירות)

## Top-Level Layout

```
kolSherut-WIP/
├── be/                     # Backend (Node/Express + TypeScript)
├── FE/                     # Frontend (React + Vite + TypeScript)
├── ES/                     # Elasticsearch Docker setup
├── ETL/                    # Python ETL pipeline (Cronicle)
├── tars/                   # Docker image tarballs (build outputs)
├── volumes/                # Docker volume mounts (logs, configs)
├── docker-compose.yml      # Local development orchestration
├── README.md               # Project readme
└── .planning/              # GSD planning directory
```

## Frontend (FE/)

```
FE/
├── src/
│   ├── main.tsx                        # App entry — Provider + JssProvider + App
│   ├── App.tsx                         # Root component — routing, theme, modal
│   ├── main.css                        # Global styles
│   ├── fonts.css                       # Font imports
│   ├── vite-env.d.ts                   # Vite type declarations
│   │
│   ├── pages/                          # Page-level components
│   │   ├── pages.ts                    # Page registry (home, results, card, maintenance)
│   │   ├── home/                       # Homepage with search
│   │   ├── results/                    # Search results with filters
│   │   ├── card/                       # Service card detail view
│   │   └── maintanence/                # Error/maintenance page
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── header/                     # App header with searchInput/
│   │   ├── footer/                     # App footer with linksMenu/
│   │   ├── sidebar/                    # Sidebar with sidebarButton/
│   │   ├── controlledModal/            # Modal system (About, AddService, Partners, etc.)
│   │   ├── map/                        # OpenLayers map with Popup/
│   │   ├── cardBanner/                 # Card header banner
│   │   ├── connection/                 # Contact/connection details
│   │   ├── defaultSearchOptions/       # Homepage search presets
│   │   ├── label/                      # Tag/label component
│   │   └── links/                      # External links component
│   │
│   ├── store/                          # Redux state management
│   │   ├── store.ts                    # Store configuration
│   │   ├── general/                    # General state (page, modal, search query)
│   │   │   ├── generalSlice.ts
│   │   │   └── general.selector.ts
│   │   ├── data/                       # Data state (results, taxonomy, sitemap)
│   │   │   ├── dataSlice.ts
│   │   │   └── data.selector.ts
│   │   ├── filter/                     # Filter state (responses, situations, location)
│   │   │   ├── filterSlice.ts
│   │   │   └── filter.selector.ts
│   │   └── shared/                     # Cross-slice orchestration
│   │       ├── sharedSlice.ts          # Multi-dispatch utilities
│   │       ├── shared.selector.ts
│   │       ├── urlSelector.ts          # URL → state mapping
│   │       ├── quickFilter.selector.ts
│   │       ├── locationFilters.selector.ts
│   │       └── inputPlaceHolderSelector.ts
│   │
│   ├── services/                       # Service modules (stateless)
│   │   ├── initialize.ts              # App initialization orchestrator
│   │   ├── loadConfig.ts              # Runtime JSON config loader
│   │   ├── setTaxonomy.ts             # Taxonomy YAML fetch + parse
│   │   ├── api/                       # Backend API client
│   │   ├── url/                       # URL routing (route.tsx)
│   │   ├── gtag/                      # Google Analytics
│   │   ├── hotjar/                    # Hotjar analytics
│   │   ├── map/                       # OpenLayers map service
│   │   ├── media.ts                   # Responsive breakpoints
│   │   └── accessibility/             # Accessibility utilities
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useElementWidth.ts
│   │   ├── useOnce.ts
│   │   ├── useOnClickedOutside.ts
│   │   └── useSearchAutocomplete.ts
│   │
│   ├── types/                         # TypeScript type definitions
│   ├── constants/                     # Shared constants
│   ├── utilities/                     # Utility functions
│   └── assets/                        # Static assets (images, SVGs)
│
├── public/
│   ├── configs/                       # Runtime configuration JSONs
│   │   ├── config.json                # Main config
│   │   ├── strings.json               # UI strings / i18n
│   │   ├── responseColors.json        # Color mappings
│   │   ├── filters.json               # Filter definitions
│   │   ├── modules.json               # Feature toggles
│   │   ├── metaTags.json              # SEO meta tags
│   │   ├── homepage.json              # Homepage layout
│   │   ├── linksBelow.json            # Footer links
│   │   ├── presets.json               # Search presets
│   │   ├── production.json            # Production overrides
│   │   ├── stage.json                 # Stage overrides
│   │   ├── local.json                 # Local overrides
│   │   └── development.json           # Dev overrides
│   ├── icons/                         # Favicon and PWA icons
│   ├── sitemap/                       # Static sitemap files
│   ├── synonyms/                      # Search synonyms
│   └── robots.txt, sitemap.xml        # SEO files
│
├── scripts/
│   ├── docker-tasks.cjs               # Docker build/save helpers
│   ├── generateHomepageSitemap.cjs    # Homepage sitemap generator
│   ├── generateMainSitemap.cjs        # Main sitemap generator
│   ├── postbuild.cjs                  # Post-build processing
│   ├── updateSynonyms.cjs            # Synonym updater
│   └── ssg-crawler/                   # SSG crawler system
│       ├── index.cjs                  # Main crawler entry
│       ├── components/                # Crawler components
│       └── config/                    # Crawler config
│
├── nginx-*.conf                       # Nginx configs per environment
├── Dockerfile                         # Nginx-based Docker image
├── vite.config.ts                     # Vite configuration
├── eslint.config.js                   # ESLint config
├── tsconfig.json                      # Base TS config
├── tsconfig.app.json                  # App TS config
└── package.json                       # Dependencies and scripts
```

## Backend (be/)

```
be/
├── src/
│   ├── index.ts                       # Express server entry point
│   ├── vars.ts                        # Configuration (env vars, indices)
│   │
│   ├── routes/                        # Express route handlers
│   │   ├── autoCompleteRoute.ts       # GET /autocomplete/:search
│   │   ├── cardRoute.ts              # GET /card/:card_id
│   │   ├── searchRoute.ts            # POST /search
│   │   ├── logRoute.ts               # POST /logs/:provider
│   │   ├── siteMapForModalRoute.ts   # GET /siteMapForModal
│   │   ├── sitemapRouter.ts          # /sitemap/* router
│   │   └── ssrRoute.ts               # /ssr/* SSR endpoint
│   │
│   ├── services/
│   │   ├── db/
│   │   │   ├── db.ts                  # DB initialization & wrapper
│   │   │   └── es/
│   │   │       ├── es.ts              # ES client singleton
│   │   │       ├── searchCards.ts     # Search query execution
│   │   │       ├── autoComplete.ts    # Autocomplete queries
│   │   │       ├── getCard.ts         # Single card retrieval
│   │   │       ├── getOrganizations.ts
│   │   │       ├── getServices.ts
│   │   │       ├── getAllCardIds.ts
│   │   │       └── dsl/               # Elasticsearch DSL query builders
│   │   │           ├── buildSearchQuery.ts
│   │   │           ├── buildFreeSearchQuery.ts
│   │   │           ├── buildAutoCompleteQuery.ts
│   │   │           └── ... (sitemap builders)
│   │   ├── email/
│   │   │   └── emailService.ts        # Nodemailer + keep-alive
│   │   ├── logger/
│   │   │   └── logger.ts             # Custom logging service
│   │   └── ssr/
│   │       └── ssrService.ts          # Puppeteer SSR service
│   │
│   ├── middlewares/
│   │   ├── errorHandler.ts            # Express error handler
│   │   └── sanitizer.ts              # Input sanitization
│   │
│   ├── controllers/
│   │   └── sitemapControllers.ts      # Sitemap business logic
│   │
│   ├── types/                         # TS type definitions
│   │   ├── autocomplete.ts
│   │   ├── serviceType.ts
│   │   └── taxonomy.ts
│   │
│   ├── utilities/                     # Utility functions
│   │   ├── sortSearchCards.ts
│   │   ├── tokenizeSearch.ts
│   │   ├── escapeXML.ts
│   │   ├── sanitizeRoutes.ts
│   │   ├── sendTimedEmails.ts
│   │   └── ... (transform utilities)
│   │
│   └── assets/                        # Static data files
│       ├── blockAnalytics.json
│       ├── fieldsToReplace.json
│       ├── generalLifeSituationTags.json
│       ├── governmentTypes.json
│       └── mixedTaxonomyBlackList.json
│
├── scripts/
│   ├── configurations.json            # Build configurations
│   └── makeBlackList.mjs             # Generates taxonomy blacklist
│
├── Dockerfile                         # Node + Chromium Docker image
├── tsconfig.json                      # TypeScript config
└── package.json                       # Dependencies and scripts
```

## ETL (ETL/)

```
ETL/
├── data/
│   ├── config.json                     # Cronicle scheduler config
│   ├── plugins/
│   │   └── srm-etl/
│   │       ├── operators/              # Data source pipelines
│   │       │   ├── child_care.py      # Child care services
│   │       │   ├── day_care.py        # Day care centers
│   │       │   ├── deploy.py          # Staging → Production promotion
│   │       │   ├── entities.py        # Entity management
│   │       │   ├── geocode.py         # Address geocoding
│   │       │   ├── guidestar_api.py   # GuideStar NGO data
│   │       │   ├── manual_data_entry.py
│   │       │   ├── taxonomy.py        # Taxonomy sync
│   │       │   └── ... (more operators)
│   │       ├── extract/                # Data extractors
│   │       ├── transform/              # Data transformers
│   │       ├── load/                   # Data loaders
│   │       ├── srm_tools/              # Shared utilities
│   │       ├── utilities/              # ETL utilities
│   │       └── conf/                   # ETL configuration
│   ├── data/                           # Runtime data directory
│   └── logs/                           # Cronicle logs
│
├── dockerfile                          # Cronicle + Python Docker image
├── docker-compose.yml                  # ETL orchestration
└── requirements.txt                    # Python dependencies
```

## Naming Conventions

| Convention | Example | Where |
|-----------|---------|-------|
| camelCase files | `searchRoute.ts`, `generalSlice.ts` | FE + BE TypeScript |
| camelCase components | `controlledModal/`, `cardBanner/` | FE components |
| snake_case files | `guidestar_api.py`, `data_cleaning.py` | ETL Python |
| PascalCase pages | `pages.ts` exports as `Pages` type | FE pages |
| `.css.ts` for styles | `header.css.ts`, `card.css.ts` | FE JSS stylesheets |
| `.selector.ts` for selectors | `general.selector.ts` | FE Redux selectors |
| `Slice.ts` for Redux | `generalSlice.ts`, `dataSlice.ts` | FE Redux slices |

## Key File Locations

| What | Location |
|------|----------|
| FE entry point | `FE/src/main.tsx` |
| BE entry point | `be/src/index.ts` |
| Redux store | `FE/src/store/store.ts` |
| API client | `FE/src/services/api/` |
| ES client | `be/src/services/db/es/es.ts` |
| ES queries | `be/src/services/db/es/dsl/` |
| Configuration | `be/src/vars.ts` (BE), `FE/public/configs/` (FE) |
| Docker compose | `docker-compose.yml` (root) |
| Nginx configs | `FE/nginx-*.conf` |
| SSG crawler | `FE/scripts/ssg-crawler/` |
| ETL pipelines | `ETL/data/plugins/srm-etl/operators/` |

---
*Mapped: 2026-03-22*
