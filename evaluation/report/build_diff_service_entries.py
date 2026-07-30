from evaluation.report.serialize_service_scores import serialize_service_scores
from evaluation.schemas import ServiceScores

# Keys of one service object inside an emitted services list.
RANK_KEY = 'rank'
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


def build_service_entries(service_names: list[str], serialized_score_map: dict) -> list[dict]:
    """One object per service, so its scores travel with it instead of joining on the name.

    rank is the 1-based position within this side. Nothing is re-sorted: the incoming order is
    already the rank - the site's render order on the missed side, retrieval's on the other.
    """
    return [
        {
            RANK_KEY: rank,
            SERVICE_NAME_KEY: service_name,
            **read_service_scores(serialized_score_map, service_name),
        }
        for rank, service_name in enumerate(service_names, start=FIRST_RANK)
    ]
