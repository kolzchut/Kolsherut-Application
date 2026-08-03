from evaluation import strings, vars
from evaluation.report.build_diff_service_entries import build_service_entries

# Keys read off one serialized per-query summary entry. The first four are re-emitted under the
# same names, so a single constant serves both the read and the write.
QUERY_KEY = 'query'
GROUND_TRUTH_SIZE_KEY = 'ground_truth_size'
RETURNED_COUNT_KEY = 'returned_count'
SKIP_REASON_KEY = 'skip_reason'
PER_QUERY_KEY = 'per_query'
META_KEY = 'meta'
UNEXPECTED_NAMES_KEY = 'unexpected_retrieved_names'
MISSED_NAMES_KEY = 'missed_ground_truth_names'
MUTUAL_NAMES_KEY = 'mutual_retrieved_names'
RANKED_NAMES_KEY = 'ranked_names'
# Derived from the paths actually involved, so the provenance line cannot drift from them.
GENERATED_FROM_SUMMARY = f'{vars.RESULTS_DIR.name}/{vars.SUMMARY_JSON_PATH.name}'


def _build_query_entry(entry: dict, names_key: str) -> dict:
    """One query's diff entry for whichever side names_key selects.

    Taking the side as a parameter is what lets the other side reuse this untouched. Skipped
    queries never reached retrieval, so count is null and services empty rather than reading as
    a genuine zero - the same blanking build_per_query_rows applies to its cells. skip_reason is
    emitted only when set, so an evaluated query's entry stays clean.
    """
    returned_count = entry[RETURNED_COUNT_KEY]
    was_skipped = returned_count is None
    service_names = [] if was_skipped else (entry.get(names_key) or [])
    services = build_service_entries(
        service_names, entry.get(vars.PER_QUERY_SERVICE_SCORES_KEY) or {},
        entry.get(vars.PER_QUERY_SERVICE_DETAILS_KEY) or {},
        entry.get(RANKED_NAMES_KEY) or [])
    query_entry = {
        QUERY_KEY: entry[QUERY_KEY],
        GROUND_TRUTH_SIZE_KEY: entry[GROUND_TRUTH_SIZE_KEY],
        RETURNED_COUNT_KEY: returned_count,
        vars.DIFF_JSON_COUNT_KEY: None if was_skipped else len(services),
        vars.DIFF_JSON_SERVICES_KEY: services,
    }
    if entry.get(SKIP_REASON_KEY):
        query_entry[SKIP_REASON_KEY] = entry[SKIP_REASON_KEY]
    return query_entry


def _build_payload(summary: dict, side: str, names_key: str) -> dict:
    """One side's whole file: the wrapper keys, plus one entry per query.

    Every query gets an entry, empty-ground-truth ones included: they still have a real diff
    list, and dropping them would hide the queries retrieval behaves worst on. The side value
    is the same literal service_diff.csv writes, so the two files join on (query, side, rank).
    """
    return {
        vars.DIFF_JSON_SIDE_KEY: side,
        vars.DIFF_JSON_GENERATED_FROM_KEY: GENERATED_FROM_SUMMARY,
        META_KEY: summary[META_KEY],
        vars.DIFF_JSON_QUERIES_KEY: [
            _build_query_entry(entry, names_key) for entry in summary[PER_QUERY_KEY]
        ],
    }


def build_unexpected_payload(summary: dict) -> dict:
    """Everything retrieval returned that the incumbent site does not show - false positives."""
    return _build_payload(
        summary, strings.SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED, UNEXPECTED_NAMES_KEY)


def build_mutual_payload(summary: dict) -> dict:
    """Everything retrieval returned that the incumbent site also shows - the true positives.

    The same builder as the other two sides, because it is the same kind of list: a partition of
    one query's names, in retrieval's rank order, with every score and every content field
    carried. It is the side that makes raw_rank readable - the unexpected file alone renumbers
    over the positions these rows occupy, so the two only reconstruct the returned ordering when
    read together.
    """
    return _build_payload(
        summary, strings.SERVICE_DIFF_SIDE_MUTUAL_RETRIEVED, MUTUAL_NAMES_KEY)


def build_missed_payload(summary: dict) -> dict:
    """Every golden-set service retrieval never returned - the recall failures.

    All five score keys come out null here by construction, never zero: the score map is keyed
    by the names retrieval RETURNED, and a missed name is by definition not one of them, so
    read_service_scores always misses and serializes the unscored five. No code path can put a
    number on this side, which is the honest answer - nothing ever scored these (see 11.9).
    """
    return _build_payload(
        summary, strings.SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH, MISSED_NAMES_KEY)
