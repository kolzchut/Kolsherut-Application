# Concerns — Kol Sherut (קול שירות)

## Risk Matrix

| Category | Severity | Count | Action |
|----------|----------|-------|--------|
| **Committed secrets** | CRITICAL | 1 file, 10+ secrets | Rotate ALL credentials |
| **Zero test coverage** | HIGH | 0 tests across all layers | Add test framework |
| **`: any` type abuse** | MEDIUM | ~45 instances | Create proper ES types |
| **Debug console.logs on hot path** | MEDIUM | 3 in autocomplete | Remove or gate |
| **Outdated BE TypeScript** | MEDIUM | v4.9 vs FE v5.7 | Upgrade |
| **ES client version skew** | MEDIUM | ETL py 7.x vs BE 8.x | Align |
| **Hardcoded ES index names** | MEDIUM | 6 indices in vars.ts | Move to env vars |
| **No request validation** | MEDIUM | All BE routes | Add validation |
| **Puppeteer SSR fragility** | LOW-MED | 1 service | Monitor/plan alternatives |
| **Window global pollution** | LOW | 8 untyped properties | Type properly |

---

## CRITICAL: Committed Secrets

`ETL/data/plugins/srm-etl/.env` contains plaintext secrets:

- Airtable API key
- GuideStar password
- GovMap API key
- Mapbox secret token
- Google Maps API key
- Elasticsearch credentials
- CKAN API key
- Gmail app password
- GitHub personal access tokens (x2)

While `.env` is in `.gitignore`, the file's nested path may not have always been excluded. **All credentials should be considered compromised and rotated.**

Additionally, `be/src/vars.ts` has hardcoded fallback credential patterns:
```typescript
password: process.env.ELASTIC_PASS || 'your-password'
```

---

## HIGH: Zero Test Coverage

**No testing infrastructure exists anywhere in the project.**

- No test files (`*.test.*`, `*.spec.*`, `test_*.py`)
- No test frameworks installed (no Jest, Vitest, pytest)
- BE `test` script: `"echo \"Error: no test specified\" && exit 1"`
- FE has no test script at all
- No CI/CD pipeline config found

**Impact**: Any change risks breaking existing functionality. Refactoring is high-risk. No regression protection.

---

## MEDIUM: TypeScript Type Safety Erosion

### `: any` usage (~45 instances)

**Backend (35 instances)** in critical areas:
- `be/src/utilities/transformAutocompleteUtilities.ts` — 8 instances (ES response processing)
- `be/src/utilities/objectController.ts` — 7 instances (generic object manipulation)
- `be/src/utilities/mapElasticsearchHitsToServiceHierarchy.ts` — 8 instances (ES hit mapping)
- `be/src/services/db/es/dsl/buildSearchQuery.ts` — 2 instances (query construction)
- `be/src/middlewares/sanitizer.ts` — 2 instances

**Frontend (10 instances)**:
- `FE/src/services/loadConfig.ts` — 8 instances (`Window` interface extensions)
- `FE/src/services/debounced.ts` — 2 instances

**Root cause**: Elasticsearch response objects lack proper type definitions. The `@elastic/elasticsearch` client returns generic types that weren't specialized.

---

## MEDIUM: Debug Logging on Hot Path

`be/src/utilities/extractServiceForAutocomplete.ts` has 3 `console.log` statements that execute on **every autocomplete request**:

```typescript
console.log("Extracting service for autocomplete with search:", cleanSearch)
console.log("Autocomplete options:", autocompleteOptions)
console.log("Found relevant option for autocomplete:", relevantOption)
```

These dump full Elasticsearch response objects to stdout — performance cost and potential data leak in production.

---

## MEDIUM: Dependency Version Issues

### Backend TypeScript version mismatch
- **BE**: `typescript ^4.9.5` (3 major versions behind)
- **FE**: `typescript ~5.7.2`
- Same project, different TypeScript capabilities

### ETL Elasticsearch client skew
- **ETL**: `elasticsearch` 7.13.4 (Python)
- **BE**: `@elastic/elasticsearch` 8.12.0 (Node)
- Risk of incompatible query syntax or features

### Aging dependencies
- `react-jss` 10.10.0 — effectively unmaintained; modern alternatives exist
- `urllib3` 1.26.20 (ETL) — 1.x is maintenance-only
- `lxml` 4.9.3 (ETL) — known CVEs in older 4.x

---

## MEDIUM: Hardcoded Elasticsearch Index Names

`be/src/vars.ts` contains timestamped index names baked into source code:

```typescript
production: {
    card: "srm__cards_20260226141535946891_275ed989",
    autocomplete: "srm__autocomplete_20260226141847128564_27ce41ff",
}
```

**Impact**: Every ETL reindex requires a code change + redeploy of the BE service. Should be environment variables or Elasticsearch aliases.

---

## MEDIUM: No Backend Request Validation

- No schema validation library (no zod, joi, express-validator, class-validator)
- All request parameters trusted without validation
- Sanitizer middleware exists but only for response field redaction, not input validation
- SQL injection not relevant (no SQL), but malformed queries could cause ES errors

---

## LOW-MEDIUM: Puppeteer SSR Fragility

`be/src/services/ssr/ssrService.ts` uses headless Chrome for server-side rendering:

- Resource-heavy: Chromium process in Docker container
- Memory leak risk: long-running browser singleton
- 30-second timeout per page render
- Zombie process risk under high load
- Requires full Chromium + system dependencies in Docker image

---

## LOW: Frontend Global State on Window

`FE/src/services/loadConfig.ts` attaches 8 untyped properties to `window`:
- `window.config`, `window.strings`, `window.responseColors`, `window.filters`, `window.modules`, `window.metaTags`, `window.homepage`, `window.linksBelow`
- All typed as `any` — typos silently return `undefined`
- Object.freeze applied after assignment

---

## LOW: No React Error Boundary

- FE has no Error Boundary component
- Unhandled React errors will crash the entire app
- Only protection: top-level `.catch()` in `main.tsx` (catches init errors only)

---

## Documented Migration Debt

From `README.md` — acknowledged but unresolved:

1. Move configs to separate volumes after cloud migration
2. Sitemaps need to be generated as part of ETL and mounted to all environments
3. Upload path: dev → stage → prod should copy previous level bucket

---

## TODO Comments

Only 1 TODO found in entire codebase:
- `ETL/data/plugins/srm-etl/operators/derive/to_sql.py` line 8: `# TODO: if/when we need a relational Data API`

The near-absence of TODO markers despite significant debt suggests debt is undocumented.

---
*Mapped: 2026-03-22*
