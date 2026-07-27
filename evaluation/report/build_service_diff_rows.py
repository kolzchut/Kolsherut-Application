from typing import Iterator

from evaluation.strings import (
    SERVICE_DIFF_CSV_QUERY_HEADER,
    SERVICE_DIFF_CSV_RANK_HEADER,
    SERVICE_DIFF_CSV_SERVICE_NAME_HEADER,
    SERVICE_DIFF_CSV_SIDE_HEADER,
    SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH,
    SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED,
)

MISSED_NAMES_KEY = 'missed_ground_truth_names'
UNEXPECTED_NAMES_KEY = 'unexpected_retrieved_names'
FIRST_RANK = 1


def build_service_diff_header() -> list[str]:
    return [
        SERVICE_DIFF_CSV_QUERY_HEADER, SERVICE_DIFF_CSV_SIDE_HEADER,
        SERVICE_DIFF_CSV_RANK_HEADER, SERVICE_DIFF_CSV_SERVICE_NAME_HEADER,
    ]


def build_side_rows(query: str, side: str, service_names: list[str]) -> Iterator[list]:
    """Rank is the name's 1-based position within its own side: the incumbent site's render
    order for missed names, retrieval's rank order for unexpected ones."""
    for rank, service_name in enumerate(service_names, start=FIRST_RANK):
        yield [query, side, rank, service_name]


def build_service_diff_rows(entry: dict) -> Iterator[list]:
    """Both sides of one query's diff. Yields nothing when a side is empty, so skipped and
    perfectly-matched queries simply do not appear."""
    query = entry['query']
    yield from build_side_rows(query, SERVICE_DIFF_SIDE_MISSED_GROUND_TRUTH,
                               entry.get(MISSED_NAMES_KEY) or [])
    yield from build_side_rows(query, SERVICE_DIFF_SIDE_UNEXPECTED_RETRIEVED,
                               entry.get(UNEXPECTED_NAMES_KEY) or [])
