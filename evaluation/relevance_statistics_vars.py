from evaluation import strings

# Mission 5's keys: the relevance block of summary.json, its verdict buckets, its two rates and the
# adjusted set metrics. A fourth focused relevance vars file for the same reason as the other three -
# relevance_vars.py sits at exactly 100 lines, so no constant can be added there.

# WHERE THE BLOCK GOES. `relevance` is a SIBLING of set_metrics and count_stats in summary.json and
# is never a member of `metrics`: compute_overall_score averages whatever keys it finds in each
# per-k metrics dict, so a key folded in there would silently redefine the headline score and break
# comparison with results-arm0-baseline/. None of the keys below appear in vars.METRIC_KEYS,
# vars.SET_METRIC_KEYS or vars.COUNT_STAT_KEYS, which is what keeps that true.
RELEVANCE_BLOCK_KEY = 'relevance'
RELEVANCE_VERDICT_COUNTS_KEY = 'verdict_counts'
RELEVANCE_RATES_KEY = 'rates'
RELEVANCE_ADJUSTED_SET_METRICS_KEY = 'adjusted_set_metrics'

# Verdict buckets, per side. `unjudged` is a bucket of its own and never a verdict: a pair whose
# chunk came back blocked or truncated has no opinion attached to it, and counting it as anything
# else would report partial coverage as complete. `unclear` is likewise its own bucket end to end
# and is never folded into `irrelevant` - see relevance_vars.VERDICTS for the vocabulary itself.
VERDICT_COUNT_UNJUDGED_KEY = 'unjudged'
VERDICT_COUNT_TOTAL_KEY = 'total'
# Both diff sides, under the same literals service_diff.csv and the two frozen JSON files use.
RELEVANCE_SIDES = [
    strings.SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED,
    strings.SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH,
]

# The two rates, each shipped with its own numerator and denominator. The denominator counts only
# judged-and-decisive pairs - `unclear` and `unjudged` are both excluded from it - so the raw counts
# travel next to every rate rather than leaving a reader to guess how far the denominator shrank.
MISSED_TRULY_IRRELEVANT_RATE_KEY = 'missed_truly_irrelevant_rate'
MISSED_TRULY_IRRELEVANT_COUNT_KEY = 'missed_truly_irrelevant_count'
MISSED_TRULY_IRRELEVANT_DENOMINATOR_KEY = 'missed_truly_irrelevant_denominator'
UNEXPECTED_ACTUALLY_RELEVANT_RATE_KEY = 'unexpected_actually_relevant_rate'
UNEXPECTED_ACTUALLY_RELEVANT_COUNT_KEY = 'unexpected_actually_relevant_count'
UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_KEY = 'unexpected_actually_relevant_denominator'
# The second unexpected-side rate, over the same side minus the empty-golden-set rows. Reported
# ALONGSIDE the first, never instead of it: for a query whose golden set is empty, "unexpected" is
# trivially true by absence of a golden set rather than by disagreement with one, so the combined
# rate mixes "we disagree with the incumbent" with "there is no incumbent to disagree with". Any
# figure framed as "vs the incumbent" reads the excluding variant.
UNEXPECTED_ACTUALLY_RELEVANT_RATE_EXCLUDING_EMPTY_GT_KEY = (
    'unexpected_actually_relevant_rate_excluding_empty_ground_truth')
UNEXPECTED_ACTUALLY_RELEVANT_COUNT_EXCLUDING_EMPTY_GT_KEY = (
    'unexpected_actually_relevant_count_excluding_empty_ground_truth')
UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_EXCLUDING_EMPTY_GT_KEY = (
    'unexpected_actually_relevant_denominator_excluding_empty_ground_truth')
# How much the two variants differ by, so either can be reconstructed from the block alone.
EMPTY_GROUND_TRUTH_ROW_COUNT_KEY = 'empty_ground_truth_row_count'
EMPTY_GROUND_TRUTH_QUERY_COUNT_KEY = 'empty_ground_truth_query_count'

# Adjusted set metrics. Deliberately named apart from vars.SET_METRIC_KEYS' entries rather than
# overwriting them: the unadjusted pair is what compares to the baseline arm, and both are reported.
ADJUSTED_PRECISION_AT_RETURNED_KEY = 'adjusted_precision_at_returned'
ADJUSTED_RECALL_AT_RETURNED_KEY = 'adjusted_recall_at_returned'
ADJUSTED_F1_AT_RETURNED_KEY = 'adjusted_f1_at_returned'
ADJUSTED_SET_METRIC_KEYS = [
    ADJUSTED_PRECISION_AT_RETURNED_KEY, ADJUSTED_RECALL_AT_RETURNED_KEY,
    ADJUSTED_F1_AT_RETURNED_KEY,
]
