from evaluation.report.serialize_service_details import (
    deserialize_service_details, serialize_service_details,
)
from evaluation.report.serialize_service_scores import serialize_service_scores
from evaluation.schemas import ServiceScores

# Keys of one service object inside an emitted services list.
RANK_KEY = 'rank'
# Position in retrieval's WHOLE returned list, as opposed to RANK_KEY's position within this one
# side. Null wherever retrieval never returned the service, which is every row of the missed side.
RAW_RANK_KEY = 'raw_rank'
SERVICE_NAME_KEY = 'service_name'
FIRST_RANK = 1


def read_service_scores(serialized_score_map: dict, service_name: str) -> dict:
    """One service's five score keys, in the canonical order the CSV and the FE badges use.

    The map read off summary.json is already flat, so it is rehydrated and pushed back through
    the single flattener instead of re-projecting the keys here - one definition of the key set
    and of the None semantics. A name absent from the map serializes as five nulls, which covers
    both a service retrieval never scored and a summary written before scores were carried.
    """
    raw_scores = serialized_score_map.get(service_name)
    return serialize_service_scores(ServiceScores(**raw_scores) if raw_scores else None)


def read_service_details(serialized_detail_map: dict, service_name: str) -> dict:
    """One service's five content keys, rehydrated and re-flattened for the same reason.

    A name absent from the map serializes as five nulls: retrieval never returned it and the
    backend had no exact match for it either, so nothing is known about it. That is why the
    lookup stores its misses - this branch cannot tell "unknown" from "never asked".
    """
    raw_details = serialized_detail_map.get(service_name)
    return serialize_service_details(
        deserialize_service_details(raw_details) if raw_details else None)


def build_raw_rank_lookup(ranked_names: list[str]) -> dict[str, int]:
    """Every returned name's 1-based position in retrieval's own ordering.

    Built from the returned list rather than from any side, which is the point: it is the one
    ordering all three sides are cut out of, so a row's raw rank stays the same whichever side
    it lands on when the golden set changes.
    """
    return {service_name: raw_rank for raw_rank, service_name in enumerate(ranked_names,
                                                                           start=FIRST_RANK)}


def build_service_entries(service_names: list[str], serialized_score_map: dict,
                          serialized_detail_map: dict, ranked_names: list[str]) -> list[dict]:
    """One object per service, so its rank, scores and content travel with it.

    rank is the 1-based position within this side. Nothing is re-sorted: the incoming order is
    already the rank - the site's render order on the missed side, retrieval's on the other two.
    """
    raw_rank_by_name = build_raw_rank_lookup(ranked_names)
    return [
        {
            RANK_KEY: rank,
            RAW_RANK_KEY: raw_rank_by_name.get(service_name),
            SERVICE_NAME_KEY: service_name,
            **read_service_details(serialized_detail_map, service_name),
            **read_service_scores(serialized_score_map, service_name),
        }
        for rank, service_name in enumerate(service_names, start=FIRST_RANK)
    ]
