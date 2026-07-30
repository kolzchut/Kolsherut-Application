from evaluation import relevance_statistics_strings, relevance_statistics_vars, relevance_vars

# Counts are rendered as strings so render_table's float formatter leaves them alone: "1180" is a
# pair count, and printing it as 1180.0000 would read as a metric.
VERDICT_BUCKET_KEYS = [
    *relevance_vars.VERDICTS,
    relevance_statistics_vars.VERDICT_COUNT_UNJUDGED_KEY,
    relevance_statistics_vars.VERDICT_COUNT_TOTAL_KEY,
]


def build_verdict_count_rows(verdict_counts: dict[str, dict[str, int]]) -> list[list]:
    """Every bucket of every side, each on its own row - `unclear` and `unjudged` included as the
    separate buckets they are, so no row of this table merges them into anything."""
    return [
        [relevance_statistics_strings.VERDICT_COUNT_ROW_LABEL.format(side=side, bucket=bucket),
         str(counts[bucket])]
        for side, counts in verdict_counts.items()
        for bucket in VERDICT_BUCKET_KEYS
    ]


def build_rate_row(label_template: str, rate: float, count: int, denominator: int) -> list:
    """One rate, with its numerator and denominator printed in its own label. The raw counts travel
    with the rate rather than in a separate block, because a shrunken denominator is the thing a
    reader most needs to see at the same moment as the rate."""
    return [label_template.format(count=count, denominator=denominator), rate]


def build_rate_rows(rates: dict) -> list[list]:
    stats_vars = relevance_statistics_vars
    stats_strings = relevance_statistics_strings
    return [
        build_rate_row(
            stats_strings.MISSED_TRULY_IRRELEVANT_LABEL,
            rates[stats_vars.MISSED_TRULY_IRRELEVANT_RATE_KEY],
            rates[stats_vars.MISSED_TRULY_IRRELEVANT_COUNT_KEY],
            rates[stats_vars.MISSED_TRULY_IRRELEVANT_DENOMINATOR_KEY]),
        build_rate_row(
            stats_strings.UNEXPECTED_ACTUALLY_RELEVANT_LABEL,
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_RATE_KEY],
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_COUNT_KEY],
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_KEY]),
        build_rate_row(
            stats_strings.UNEXPECTED_ACTUALLY_RELEVANT_EXCLUDING_EMPTY_GT_LABEL,
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_RATE_EXCLUDING_EMPTY_GT_KEY],
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_COUNT_EXCLUDING_EMPTY_GT_KEY],
            rates[stats_vars.UNEXPECTED_ACTUALLY_RELEVANT_DENOMINATOR_EXCLUDING_EMPTY_GT_KEY]),
        [stats_strings.EMPTY_GROUND_TRUTH_ROW_LABEL.format(
            queries=rates[stats_vars.EMPTY_GROUND_TRUTH_QUERY_COUNT_KEY]),
         str(rates[stats_vars.EMPTY_GROUND_TRUTH_ROW_COUNT_KEY])],
    ]


def build_adjusted_metric_rows(adjusted_set_metrics: dict[str, float]) -> list[list]:
    return [
        [relevance_statistics_strings.ADJUSTED_SET_METRIC_LABELS[metric_key],
         adjusted_set_metrics[metric_key]]
        for metric_key in relevance_statistics_vars.ADJUSTED_SET_METRIC_KEYS
    ]


def build_relevance_table(relevance: dict) -> dict:
    """The console table for the relevance block: bucket counts, then the rates, then the adjusted
    metrics. One table so the rates are read in sight of the counts they were computed over."""
    stats_vars = relevance_statistics_vars
    return {
        'headers': [relevance_statistics_strings.RELEVANCE_TABLE_STATISTIC_HEADER,
                    relevance_statistics_strings.RELEVANCE_TABLE_VALUE_HEADER],
        'rows': [
            *build_verdict_count_rows(relevance[stats_vars.RELEVANCE_VERDICT_COUNTS_KEY]),
            *build_rate_rows(relevance[stats_vars.RELEVANCE_RATES_KEY]),
            *build_adjusted_metric_rows(
                relevance[stats_vars.RELEVANCE_ADJUSTED_SET_METRICS_KEY]),
        ],
    }
