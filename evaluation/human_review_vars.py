from evaluation import vars

# Mission 6's config: the human-audit sample, the agreement report and its acceptance bar. A fifth
# focused relevance-side vars file for the same reason as the other four - relevance_vars.py sits at
# exactly 100 lines, so no constant can be added there. REVIEW_SAMPLE_SEED is NOT restated here; it
# already lives in relevance_vars.py and is imported from there.

# Artifacts. Both land in RESULTS_DIR, which is gitignored: the sheet is a run artifact a human
# fills in by hand and the report is derived from it, so neither is committed data.
REVIEW_SAMPLE_CSV_PATH = vars.RESULTS_DIR / 'human_review_sample.csv'
AGREEMENT_REPORT_JSON_PATH = vars.RESULTS_DIR / 'agreement_report.json'

# How many rows --review-sample draws when N is not given. A 2-3 hour sitting, and large enough that
# a 3x3 confusion matrix per side has readable cells.
REVIEW_SAMPLE_SIZE_DEFAULT = 200
# Floor per NON-EMPTY side x verdict cell, applied before the proportional split. Without it the
# larger side drowns every rare cell: a purely proportional draw gives `unclear` a couple of rows at
# best and can give it none, and a cell with no rows cannot be audited at all. Capped by the cell's
# own size and by an equal share of the budget, so it can never over-subscribe a small sample.
REVIEW_SAMPLE_MIN_PER_STRATUM = 10

# review_id: the sheet's own row identity, and the only key the read-back joins on. Zero-padded so a
# spreadsheet sorts it in draw order instead of lexicographically as 1, 10, 100.
REVIEW_ID_PREFIX = 'review-'
REVIEW_ID_DIGITS = 4

# agreement_report.json keys. Every field of the spec's field table, plus the provenance needed to
# tell which labels and which draw the numbers describe.
SAMPLE_SIZE_KEY = 'sample_size'
REVIEWED_COUNT_KEY = 'reviewed_count'
RAW_AGREEMENT_KEY = 'raw_agreement'
COHENS_KAPPA_KEY = 'cohens_kappa'
CONFUSION_BY_SIDE_KEY = 'confusion_by_side'
AGREEMENT_BY_VERDICT_KEY = 'agreement_by_verdict'
DISAGREEMENT_ROWS_KEY = 'disagreement_rows'
JUDGE_MODEL_KEY = 'judge_model'
REVIEW_SAMPLE_SEED_KEY = 'review_sample_seed'

# The stratification, drawn against available per side x verdict cell. In the report as well as the
# log because it is the evidence that the rare cells survived the draw: a reader checking whether
# `unclear` was actually audited needs the counts, not an assurance that stratification happened.
SAMPLE_STRATA_KEY = 'sample_strata'
STRATUM_DRAWN_KEY = 'drawn'
STRATUM_AVAILABLE_KEY = 'available'

# agreement_by_verdict: per LLM verdict, how often the human said the same thing. The raw counts
# travel with the rate for the same reason every Mission 5 rate carries its denominator - a rate over
# three rows is not a measurement, and only the counts say so.
AGREEMENT_MATCHED_KEY = 'matched'
AGREEMENT_TOTAL_KEY = 'total'
AGREEMENT_RATE_KEY = 'rate'

# A disagreement row: the full identity, both verdicts, and the one rationale that exists. The notes
# are carried because the M7 session reads these rows and two bare labels do not say who was right.
# There is no llm_reason counterpart: as of schema v3 the judge answers with a bare marker and states
# no rationale at all, so the row carries the human's side of the reasoning or nothing.
ROW_REVIEW_ID_KEY = 'review_id'
ROW_HUMAN_VERDICT_KEY = 'human_verdict'
ROW_HUMAN_NOTES_KEY = 'human_notes'
ROW_LLM_VERDICT_KEY = 'llm_verdict'

# The gate. BOTH thresholds are checked and BOTH numbers are always reported: with a skewed verdict
# distribution raw agreement can look excellent while kappa sits near zero, which means the judge is
# guessing the majority class rather than judging. Reporting one alone hides exactly that case.
GATE_KEY = 'gate'
GATE_PASSED_KEY = 'passed'
GATE_MIN_RAW_AGREEMENT_KEY = 'min_raw_agreement'
GATE_MIN_COHENS_KAPPA_KEY = 'min_cohens_kappa'
GATE_OUTCOME_KEY = 'outcome'
MIN_RAW_AGREEMENT = 0.85
MIN_COHENS_KAPPA = 0.60

# Degenerate Cohen's kappa. p_e == 1 means both raters used exactly one class each and the same one,
# so (1 - p_e) is zero and the ratio is undefined - there is no chance-corrected agreement to report
# because chance already explains everything. The sentinel is JSON `null`, deliberately neither 0.0
# nor 1.0: both of those are real kappa values a reader would act on. A null can only be read as
# "not computable", and the gate treats it as NOT met, because an undefined kappa cannot demonstrate
# above-chance agreement. An empty review (nothing filled in) yields the same sentinel.
COHENS_KAPPA_UNDEFINED = None
