# Phase 7 Context — Validation & Deployment

**Phase type:** Code + Documentation
**Target files:**
- `derive_es/validate.py` — automated comparison script
- `derive_es/README.md` — migration documentation
- Update `derive_es/__init__.py` and `derive_curation/__init__.py` with invoke_on config

## Scope
1. Comparison script: query old vs new ES index doc counts + sample field diffs
2. Both operators registered with invoke_on patterns
3. README documenting the two-operator setup
