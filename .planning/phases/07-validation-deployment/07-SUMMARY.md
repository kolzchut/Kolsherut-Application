# Phase 7 Summary — Validation & Deployment

**Status:** COMPLETE
**Commit:** 2509ad4

## Deliverables

### validate.py (248 lines)
- `validate_index()` — checks doc count, mapping field coverage, sample non-emptiness
- `validate_all()` — runs validation on all 6 indexes with summary report
- `compare_indexes()` — pairwise field-level diff between old and new aliases
- CLI entry: `python -m operators.derive_es.validate [index_name]`

### README.md (157 lines)
- Architecture diagram (2-operator split)
- Usage instructions for both operators
- Execution order guidance
- Validation instructions
- ES index table (all 6 with content/ID field)
- Key differences table (old vs new)
- Rollback instructions
- File inventory

### Operator Registration (verified)
- `derive_es/__init__.py` → `invoke_on(_run, 'Derive ES (Operator B)')` 
- `derive_curation/__init__.py` → `invoke_on(_run, 'Derive Curation (Operator A)')`

## Requirements Satisfied

- **VAL-01**: Automated comparison script for all 6 ES indexes ✓
- **VAL-02**: Document-level diff between old and new pipeline output ✓
- **VAL-03**: Both operators registered and callable by scheduler ✓
