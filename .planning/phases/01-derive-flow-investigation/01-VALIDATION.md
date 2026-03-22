---
phase: 1
slug: derive-flow-investigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | grep / file existence checks (documentation phase — no code tests) |
| **Config file** | none |
| **Quick run command** | `grep -c "##" _analysis_temp/derive-analysis.md` |
| **Full suite command** | `bash -c 'for s in "from_curation" "to_dp" "autocomplete" "to_es" "to_sql"; do grep -q "$s" _analysis_temp/derive-analysis.md && echo "✓ $s" || echo "✗ $s MISSING"; done'` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run quick heading count check
- **After every plan wave:** Run full section coverage check
- **Before `/gsd-verify-work`:** All 5 stages and all requirements documented
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ANLYS-01 | grep | `grep -q "Flow()" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | ANLYS-02 | grep | `grep -q "checkpoint" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | ANLYS-03 | grep | `grep -q "__main__" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | ANLYS-04 | grep | `grep -cE "from_curation|to_dp|autocomplete|to_es|to_sql|helpers|autotagging|es_schemas|es_utils|manual_fixes" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | ANLYS-05 | grep | `grep -q "step chaining\|multi-step\|sequential" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | ANLYS-06 | grep | `grep -c "checkpoint\|cache\|dump_to_path" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | ANLYS-07 | file | `grep -q "mermaid\|graph\|flowchart" _analysis_temp/derive-analysis.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `_analysis_temp/` directory — clone dataflows source
- [ ] `_analysis_temp/derive-analysis.md` — stub document with section headers

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Explanations are accurate | ANLYS-01 | Requires domain expertise | Read dataflows section, verify against source |
| Diagrams render correctly | ANLYS-07 | Visual rendering | Open markdown in VS Code preview |
| Document is coherent end-to-end | ALL | Subjective quality | Read full document top-to-bottom |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
