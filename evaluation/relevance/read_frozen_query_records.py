from pathlib import Path

from evaluation import relevance_input_vars, relevance_statistics_strings, vars
from evaluation.relevance.build_judgement_items import read_judge_input_payload
from evaluation.relevance.frozen_query_record import FrozenQueryRecord
from evaluation.report.build_service_diff_json import (
    GROUND_TRUTH_SIZE_KEY, QUERY_KEY, RETURNED_COUNT_KEY,
)


def read_side_counts(path: Path) -> dict[str, dict]:
    """One frozen diff file's per-query entries, keyed by query.

    The keys are imported from the writer that produced the file, exactly as build_judgement_items
    does, so this reader cannot drift from the bytes it reads.
    """
    payload = read_judge_input_payload(path)
    return {entry[QUERY_KEY]: entry for entry in payload[vars.DIFF_JSON_QUERIES_KEY]}


def compute_hits(unexpected_entry: dict, missed_entry: dict) -> int | None:
    """Golden-set services that WERE returned, from the two recorded counts and nothing else.

    Two independent expressions of the same set identity, so the recorded counts check each other:
    |returned| - |unexpected| and |golden set| - |missed|. They disagreeing means the two frozen
    files describe different runs, which would silently pair labels with the wrong arm - so it
    raises rather than picking one.
    """
    if unexpected_entry[RETURNED_COUNT_KEY] is None:
        return None
    from_returned = unexpected_entry[RETURNED_COUNT_KEY] - unexpected_entry[vars.DIFF_JSON_COUNT_KEY]
    from_ground_truth = missed_entry[GROUND_TRUTH_SIZE_KEY] - missed_entry[vars.DIFF_JSON_COUNT_KEY]
    if from_returned != from_ground_truth:
        raise ValueError(relevance_statistics_strings.ERROR_FROZEN_HIT_COUNTS_DISAGREE.format(
            query=unexpected_entry[QUERY_KEY], from_returned=from_returned,
            from_ground_truth=from_ground_truth))
    return from_returned


def build_frozen_query_record(unexpected_entry: dict, missed_entry: dict) -> FrozenQueryRecord:
    return FrozenQueryRecord(
        query=unexpected_entry[QUERY_KEY],
        ground_truth_size=unexpected_entry[GROUND_TRUTH_SIZE_KEY],
        returned_count=unexpected_entry[RETURNED_COUNT_KEY],
        unexpected_count=unexpected_entry[vars.DIFF_JSON_COUNT_KEY],
        missed_count=missed_entry[vars.DIFF_JSON_COUNT_KEY],
        hits=compute_hits(unexpected_entry, missed_entry),
    )


def read_frozen_query_records() -> list[FrozenQueryRecord]:
    """Every query of the frozen snapshot, in the unexpected-side file's order.

    Read from the frozen files rather than from the live run's summary.json on purpose: the
    judgements were produced from these bytes, and a live run's counts belong to a different,
    non-reproducible retrieval call - Elasticsearch's approximate kNN alone returns different
    document sets for byte-identical requests at this pool size.
    """
    unexpected_entries = read_side_counts(relevance_input_vars.JUDGE_INPUT_UNEXPECTED_JSON_PATH)
    missed_entries = read_side_counts(relevance_input_vars.JUDGE_INPUT_MISSED_JSON_PATH)
    return [build_frozen_query_record(entry, missed_entries[query])
            for query, entry in unexpected_entries.items()]
