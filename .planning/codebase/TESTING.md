# Testing — Kol Sherut (קול שירות)

## Current State

**There is no testing infrastructure in this project.**

| Check | Result |
|-------|--------|
| Unit test files (`*.test.ts`, `*.spec.ts`) | None found |
| Integration test files | None found |
| Python test files (`test_*.py`) | None found |
| Test framework (Jest/Vitest) | Not installed |
| Test framework (pytest) | Not installed |
| Test configuration files | None found |
| FE `package.json` test script | Not present |
| BE `package.json` test script | `"echo \"Error: no test specified\" && exit 1"` |
| CI/CD pipeline config | Not found |
| Code coverage tools | Not installed |

## Implications

- **No regression protection** — changes risk breaking existing functionality
- **No CI gating** — nothing prevents broken code from being deployed
- **Manual testing only** — all verification relies on developer testing
- **Refactoring risk** — structural changes have no safety net

## Testing Recommendations

### Priority Areas (if tests were to be added)

1. **Elasticsearch DSL builders** (`be/src/services/db/es/dsl/`) — pure functions, highly testable, critical for search correctness
2. **Redux selectors** (`FE/src/store/*/selector.ts`) — pure functions, easy to test
3. **Utility functions** (`be/src/utilities/`, `FE/src/utilities/`) — pure functions
4. **API route integration tests** — request → response validation
5. **ETL operator tests** — data transformation correctness

### Suggested Stack (if adding tests)

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| FE unit | Vitest | Native Vite integration, fast, TypeScript support |
| FE component | Vitest + React Testing Library | Standard React testing approach |
| BE unit | Vitest or Jest | TypeScript support, easy setup |
| BE integration | Supertest | HTTP endpoint testing for Express |
| ETL | pytest | Standard Python testing framework |
| E2E | Playwright | Already have Puppeteer skills in team |

---
*Mapped: 2026-03-22*
