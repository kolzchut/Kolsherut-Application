# Conventions — Kol Sherut (קול שירות)

## Code Style

### Formatting
- **No Prettier** or EditorConfig configured
- **No Husky / lint-staged** — no pre-commit hooks
- Code style relies on ESLint + developer convention
- Indentation: 4 spaces (observed pattern)

### ESLint (FE only)
- **Config**: `FE/eslint.config.js` — flat config format (`tseslint.config()`)
- **Base**: `@eslint/js` recommended + `typescript-eslint` recommended
- **Plugins**: `react-hooks` (recommended), `react-refresh` (`only-export-components` warn, `allowConstantExport: true`)
- **Scope**: `*.ts`, `*.tsx` files; `dist/` ignored
- **Missing**: No Prettier plugin, no import-order rules, no a11y rules

### TypeScript
- **Both FE and BE**: `"strict": true`
- **FE extras**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **FE**: `"moduleResolution": "bundler"`, `allowImportingTsExtensions: true`
- **BE**: `"target": "ES6"`, `"module": "CommonJS"`

## Naming Conventions

| Convention | Where | Example |
|-----------|-------|---------|
| camelCase files | FE + BE TypeScript | `searchRoute.ts`, `generalSlice.ts` |
| camelCase components | FE component dirs | `controlledModal/`, `cardBanner/` |
| PascalCase React components | FE component functions | `function ControlledModal()` |
| snake_case files | ETL Python | `guidestar_api.py`, `data_cleaning.py` |
| `.css.ts` extension | FE styling | `header.css.ts`, `card.css.ts` |
| `.selector.ts` suffix | FE Redux selectors | `general.selector.ts` |
| `Slice.ts` suffix | FE Redux slices | `generalSlice.ts` |
| `build*` prefix | BE DSL builders | `buildSearchQuery.ts` |
| `I` prefix for interfaces | FE + BE types | `IService`, `IProps` |

## Import Patterns

- **Relative imports only** — no path aliases configured in either FE or BE
- **No barrel exports** / `index.ts` files in FE (except theme.ts)
- **Inconsistent `.ts` extension**: some imports include `.ts` extension, some don't (FE allows both via `allowImportingTsExtensions`)
- Deep relative paths common: `"../../../types/serviceType"`

## Styling Pattern (React-JSS)

The FE uses `react-jss` (`createUseStyles`) exclusively — **64 `.css.ts` files** found.

### File structure:
```
component/
├── component.tsx          # Component logic
└── component.css.ts       # Co-located JSS styles
```

### Style file pattern:
```typescript
// component.css.ts
import { createUseStyles } from 'react-jss';
import { someColor } from '../../services/theme';

interface IProps { /* dynamic style props */ }

export default createUseStyles({
  className: ({ prop }: IProps) => ({ /* dynamic CSS rules */ }),
  staticClass: { /* static CSS rules */ },
});
```

### Consumption:
```tsx
import useStyles from './component.css';
const classes = useStyles({ prop1, prop2 });
return <div className={classes.className}>...</div>;
```

### Theme:
- Centralized color constants in `FE/src/services/theme.ts`
- Dynamic theme via `ThemeProvider` in `App.tsx`: `{ isMobile, accessibilityActive }`
- Responsive: inline `@media` queries inside JSS objects

## Error Handling

### Backend (well-structured)
- `asyncHandler(fn)` wraps async route handlers → catches rejections → forwards to `next()`
- Global `errorHandler` middleware: logs error, sends email alert, returns 500 JSON
- Process-level: `SIGTERM`/`SIGINT` handlers for graceful Puppeteer shutdown
- Service-level: local `try/catch` blocks for granular handling

### Frontend (ad-hoc)
- **No React Error Boundary** — missing entirely
- Ad-hoc `try/catch` in ~8 locations (service calls, URL parsing, config loading)
- Top-level `.catch()` on initialization in `main.tsx`
- Client-side logger sends errors to server via POST `/logs/:provider`
- XSS: `dompurify` for HTML sanitization

## State Management Pattern

### Redux (FE)
- **3 slices**: `general`, `data`, `filter`
- **Shared orchestration**: `FE/src/store/shared/sharedSlice.ts` — multi-dispatch utilities that coordinate across slices
- **Selectors**: Dedicated `*.selector.ts` files per slice + shared selectors
- **URL sync**: Route params ↔ Redux state bidirectional sync
- **No async thunks** — API calls happen in components/services, results dispatched to store

### Configuration (BE)
- Single `vars.ts` exports all config from env vars
- No config service or dependency injection

## Component Patterns (FE)

- **Functional components only** — no class components
- **No React Router** — custom URL-driven routing via Redux + `history.pushState`
- **Page components** render based on Redux `page` state
- **Modal system**: `controlledModal/` renders modal by type from Redux `modal` state
- **Two-phase fetch**: Components dispatch fast search (50 results), then full search (300 results) merges in

## API Pattern (BE)

- **Thin routes**: Route handlers delegate to service layer
- **DSL builders**: Construct Elasticsearch queries from request parameters
- **Middleware**: `sanitizer.ts` (response field redaction), `errorHandler.ts` (global error catching)
- **No validation library** — manual parameter checking

---
*Mapped: 2026-03-22*
