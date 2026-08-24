# Text for Mission 5's relevance surfacing: the console table's labels, and the one log line the
# judged run's second write emits. A separate file from relevance_strings.py, which is already at 98
# lines and holds the judging pipeline's operational text.

# A judged run writes summary.json twice: once with the base results, before any network call, and
# again with the relevance block once verdicts exist. Logged so the second write is visible rather
# than looking like the first one having been overwritten by something.
LOG_REWROTE_SUMMARY = 'Rewrote {summary} and {html} with the relevance block'

RELEVANCE_TABLE_TITLE = 'Relevance judgements (LLM judge, frozen snapshot)'
RELEVANCE_TABLE_STATISTIC_HEADER = 'Statistic'
RELEVANCE_TABLE_VALUE_HEADER = 'Value'

# Verdict-bucket rows. The bucket name is supplied by the caller from the verdict vocabulary in
# relevance_vars.py, so this file never restates it and the two cannot drift apart.
VERDICT_COUNT_ROW_LABEL = '{side} / {bucket}'

# Rate rows. Each label carries its own numerator and denominator, because a rate over a denominator
# that dropped every `unclear` and every unjudged pair is misleading printed on its own.
RATE_UNCLEAR_EXCLUDED_NOTE = 'unclear and unjudged excluded from the denominator'
MISSED_TRULY_IRRELEVANT_LABEL = (
    'Missed ground truth judged irrelevant ({count}/{denominator}, ' + RATE_UNCLEAR_EXCLUDED_NOTE + ')'
)
UNEXPECTED_ACTUALLY_RELEVANT_LABEL = (
    'Unexpected judged relevant, ALL rows ({count}/{denominator}, '
    + RATE_UNCLEAR_EXCLUDED_NOTE + ')'
)
UNEXPECTED_ACTUALLY_RELEVANT_EXCLUDING_EMPTY_GT_LABEL = (
    'Unexpected judged relevant, EXCLUDING empty golden set ({count}/{denominator}) '
    '- the only variant comparable to the incumbent'
)
EMPTY_GROUND_TRUTH_ROW_LABEL = (
    'Empty-golden-set rows dropped by that variant ({queries} queries)'
)

# Raised while reading the frozen snapshot's per-query counts. Two files describing different runs
# would pair the labels with the wrong arm, which is silent unless it raises.
ERROR_FROZEN_HIT_COUNTS_DISAGREE = (
    'The frozen diff files disagree on how many golden-set services query "{query}" retrieved: '
    '{from_returned} by the unexpected side, {from_ground_truth} by the missed side, '
    '{from_mutual} by the mutual side. They must come from the same run.'
)

# Adjusted set metrics, keyed by the identifiers in relevance_statistics_vars.py - the same shape
# strings.py uses for SET_METRIC_LABELS.
ADJUSTED_SET_METRIC_LABELS = {
    'adjusted_precision_at_returned': 'Adjusted Precision@returned',
    'adjusted_recall_at_returned': 'Adjusted Recall@returned',
    'adjusted_f1_at_returned': 'Adjusted F1@returned',
}
