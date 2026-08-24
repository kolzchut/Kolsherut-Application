from dataclasses import dataclass, field

from evaluation.schemas import ServiceDetails, ServiceScores


@dataclass(frozen=True)
class RetrievalResult:
    """One /api/retrieve response, split into the three things the evaluation reads from it.

    A dataclass rather than a widening tuple: the two maps are keyed the same way and hold
    different things, so as positional elements they would be silently swappable at every call
    site. `ranked_names` is the ONLY record of retrieval's ordering - the maps are unordered by
    construction - which is what makes it the source of every raw rank downstream.
    """
    ranked_names: tuple[str, ...] = ()
    service_scores: dict[str, ServiceScores] = field(default_factory=dict)
    service_details: dict[str, ServiceDetails] = field(default_factory=dict)
