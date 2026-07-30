# Mission 6's text: the review sheet's three own headers, CLI help, the agreement console table, log
# lines and errors. A separate file from relevance_strings.py (97 lines) and
# relevance_statistics_strings.py, both of which are at or near budget. The sheet's other four
# headers are NOT restated here - they are relevance_strings.JUDGEMENT_CSV_* verbatim, so the sheet,
# service_diff.csv and relevance_judgements.csv join on identical literals with nothing mapped.

REVIEW_SHEET_REVIEW_ID_HEADER = 'review_id'
REVIEW_SHEET_HUMAN_VERDICT_HEADER = 'human_verdict'
REVIEW_SHEET_HUMAN_NOTES_HEADER = 'human_notes'
# What the two answer columns are emitted as. Blank, and blank is not a verdict: a row left empty is
# an unreviewed row and is reported in sample_size but never in reviewed_count.
REVIEW_SHEET_BLANK_CELL = ''

# CLI. Both flags read the frozen snapshot and the committed label cache only, so they neither call
# retrieval nor scrape staging - which is why a run that passes either one does no evaluation.
CLI_REVIEW_SAMPLE_HELP = (
    'Emit the human-review sheet: a stratified, shuffled sample of N already-judged pairs with the '
    'verdict and score columns withheld. N defaults to 200. Does no evaluation.'
)
CLI_AGREEMENT_HELP = (
    'Read the filled-in human-review sheet back and write the agreement report. Does no evaluation.'
)

# Console table.
AGREEMENT_TABLE_TITLE = 'Human-vs-LLM agreement (Mission 6 gate)'
AGREEMENT_TABLE_STATISTIC_HEADER = 'Statistic'
AGREEMENT_TABLE_VALUE_HEADER = 'Value'
AGREEMENT_TABLE_SAMPLE_SIZE_LABEL = 'Rows in the sheet (sample_size)'
AGREEMENT_TABLE_REVIEWED_COUNT_LABEL = 'Rows a human answered (reviewed_count)'
AGREEMENT_TABLE_RAW_AGREEMENT_LABEL = 'raw_agreement (bar: >= {threshold:.2f})'
AGREEMENT_TABLE_KAPPA_LABEL = "cohens_kappa (bar: >= {threshold:.2f})"
AGREEMENT_TABLE_DISAGREEMENTS_LABEL = 'Disagreeing rows'
AGREEMENT_TABLE_GATE_LABEL = 'Gate'
# Printed wherever an undefined kappa appears - the table and the gate sentence both. Words rather
# than a number, because there is no number here that would not be read as a measurement.
KAPPA_UNDEFINED_VALUE = 'undefined (no reviewed rows, or both raters used a single class)'

# Gate outcomes. Recorded as the reported OUTCOME, never acted on: neither re-judging nor a prompt
# edit is ever triggered from here, because both are decisions.
GATE_OUTCOME_PASSED = (
    'PASSED: raw_agreement {raw_agreement} >= {min_raw_agreement:.2f} and cohens_kappa '
    '{cohens_kappa} >= {min_cohens_kappa:.2f}. The Mission 5 adjusted metrics are usable.'
)
GATE_OUTCOME_FAILED = (
    'FAILED: raw_agreement {raw_agreement} vs bar {min_raw_agreement:.2f}, cohens_kappa '
    '{cohens_kappa} vs bar {min_cohens_kappa:.2f}. Do not proceed to Mission 7 and do not present '
    'the adjusted metrics: return to Task 4.3.2, revise the PROMPT ONLY, re-judge (the cache '
    'invalidates on a prompt change) and re-sample.'
)
GATE_OUTCOME_NO_VERDICTS = (
    'OPEN: {sample_size} rows are in the sheet and {reviewed_count} carry a human verdict, so there '
    'is nothing to compare. The gate is undecided until a human fills the sheet in.'
)

# Progress log messages.
LOG_WROTE_REVIEW_SAMPLE = 'Wrote {count} rows of {available} judged pairs to {path}'
LOG_REVIEW_SAMPLE_STRATA = 'Review sample strata, drawn of available: {strata}'
LOG_REVIEW_SAMPLE_STRATUM = '{label} {drawn}/{available}'
LOG_REVIEW_SAMPLE_STRATUM_SEPARATOR = ', '
# How a side x verdict cell is named wherever one is reported - the log line and the report field.
STRATUM_LABEL = '{side}/{verdict}'
# A partially-judged label set would silently sample only the judged part, which would read as a
# sample of the whole snapshot. Logged loudly rather than raised: sampling what exists is legitimate.
LOG_REVIEW_SAMPLE_PARTIAL_LABELS = (
    '{pending} of {total} frozen pairs carry no verdict yet, so the sample is drawn from the '
    '{judged} judged pairs only and does not cover the whole snapshot.'
)
LOG_LOADED_REVIEW_VERDICTS = 'Read {reviewed} answered rows of {total} in {path}'
LOG_WROTE_AGREEMENT_REPORT = 'Wrote the agreement report to {path}'
LOG_AGREEMENT_GATE_OUTCOME = 'Mission 6 gate - {outcome}'

# Errors. Raised, never swallowed: every one of them means the numbers would otherwise be wrong
# rather than merely missing.
ERROR_NO_JUDGEMENTS_TO_SAMPLE = (
    'There are no LLM verdicts to sample: {path} is missing, or its model, prompt or schema no '
    'longer match. Mission 6 audits Mission 4 output, so run --judge first.'
)
ERROR_REVIEW_SHEET_MISSING = (
    'The filled-in review sheet {path} is missing. Emit it with --review-sample, have a human fill '
    'in human_verdict, then re-run with --agreement.'
)
ERROR_UNKNOWN_REVIEW_VERDICT = (
    'Row {review_id} of the review sheet holds human_verdict "{verdict}", which is not one of '
    '{allowed}. Fix the cell rather than letting a typo count as a disagreement.'
)
ERROR_UNKNOWN_REVIEW_ID = (
    'Row {review_id} of the review sheet matches no row of the redrawn sample. Rows must not be '
    'added, removed or reordered - only the human_verdict and human_notes cells may be edited.'
)
ERROR_REVIEW_ROW_IDENTITY_DRIFT = (
    'Row {review_id} of the review sheet describes {sheet}, but the redrawn sample says {redrawn}. '
    'The label cache or the frozen snapshot changed after the sheet was emitted, so these answers '
    'belong to a different set of pairs. Re-emit the sheet.'
)
ERROR_REVIEW_SHEET_LEAKS_ANSWER = (
    'The review sheet header {header} would carry {leaked}. The LLM verdict and every score are '
    'withheld on purpose: shown first they anchor the reviewer and the agreement number stops '
    'measuring anything.'
)
