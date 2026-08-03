import json
from pathlib import Path

from evaluation import relevance_input_vars, relevance_strings, vars
from evaluation.report.build_diff_service_entries import (
    RANK_KEY, RAW_RANK_KEY, SERVICE_NAME_KEY,
)
from evaluation.report.serialize_service_details import deserialize_service_details
from evaluation.report.build_service_diff_json import QUERY_KEY
from evaluation.relevance_schemas import JudgementItem


def read_judge_input_payload(path: Path) -> dict:
    """One frozen diff JSON file, as written by report/build_service_diff_json.py.

    The keys are imported from the writer rather than restated here, so the reader cannot drift
    from the file it reads.
    """
    if not path.exists():
        raise FileNotFoundError(relevance_strings.ERROR_JUDGE_INPUT_FILE_MISSING.format(
            path=path, directory=relevance_input_vars.JUDGE_INPUT_DIR))
    return json.loads(path.read_text(encoding='utf-8'))


def read_carried_scores(service_entry: dict) -> dict[str, float | None]:
    """The five score cells verbatim. `.get` with no default, so an absent score stays None:
    "no retriever surfaced this" must never become "a retriever scored it zero"."""
    return {score_key: service_entry.get(score_key) for score_key in vars.SERVICE_SCORE_KEYS}


def build_items_for_query(query_entry: dict, side: str) -> list[JudgementItem]:
    """Every service of one query's list, keeping the file's ranks, scores and content."""
    return [
        JudgementItem(query=query_entry[QUERY_KEY], side=side,
                      rank=service_entry[RANK_KEY],
                      raw_rank=service_entry.get(RAW_RANK_KEY),
                      service_name=service_entry[SERVICE_NAME_KEY],
                      scores=read_carried_scores(service_entry),
                      details=deserialize_service_details(service_entry))
        for service_entry in query_entry[vars.DIFF_JSON_SERVICES_KEY]
    ]


def build_items_for_side(path: Path) -> list[JudgementItem]:
    """One whole side, flattened. The side label comes from the file, so it is the same literal
    service_diff.csv wrote and the judgement table joins to it on (query, side, rank)."""
    payload = read_judge_input_payload(path)
    side = payload[vars.DIFF_JSON_SIDE_KEY]
    return [
        item
        for query_entry in payload[vars.DIFF_JSON_QUERIES_KEY]
        for item in build_items_for_query(query_entry, side)
    ]


def build_judgement_items() -> list[JudgementItem]:
    """Every (query, service) pair to judge, read from the FROZEN snapshot.

    Deliberately not results/: a concurrent evaluation run overwrites that directory, and the
    retrieval call is not reproducible anyway, so only these exact bytes identify the dataset.
    """
    return [
        *build_items_for_side(relevance_input_vars.JUDGE_INPUT_UNEXPECTED_JSON_PATH),
        *build_items_for_side(relevance_input_vars.JUDGE_INPUT_MISSED_JSON_PATH),
        *build_items_for_side(relevance_input_vars.JUDGE_INPUT_MUTUAL_JSON_PATH),
    ]
