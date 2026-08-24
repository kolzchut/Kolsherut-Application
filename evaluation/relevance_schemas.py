from dataclasses import dataclass, field

from evaluation.schemas import ServiceDetails

# The relevance judge's dataclasses. Split out of schemas.py to hold the 100-line rule, and this
# is the right seam: what a pair to judge and a verdict look like changes with the judge, while
# Example, ScrapedPage and QueryEvaluation change with the dataset and the metrics.


@dataclass(frozen=True)
class JudgementItem:
    """One (query, service) pair awaiting a verdict, read from a frozen diff JSON file.

    `scores` is the five score cells and `details` the description and tag sets, both exactly as
    that file holds them - carried, never re-derived. Every score is null on the missed side by
    construction; `details` is the one field that can be populated there, because it is fetched
    from the BE rather than produced by retrieval.

    `raw_rank` is the pair's position in retrieval's whole returned list, which is NOT `rank`:
    `rank` renumbers from 1 within each side, so the two disagree wherever a side skips a
    position. It is None on the missed side - retrieval never returned those, so they have no
    position in a list they are not in.
    """
    query: str
    side: str
    rank: int
    service_name: str
    raw_rank: int | None = None
    scores: dict[str, float | None] = field(default_factory=dict)
    details: ServiceDetails = ServiceDetails()


@dataclass(frozen=True)
class JudgementChunk:
    """The items of one (query, side) group that go into a single batch request.

    `key` is the user-defined Batch API key, which is what correlates a result line back to this
    chunk. Results are never joined by position.
    """
    key: str
    query: str
    side: str
    items: tuple[JudgementItem, ...] = ()


@dataclass(frozen=True)
class ServiceJudgement:
    """One LLM verdict on whether a service would help the person who asked the query.

    `side` and `rank` are the retrieval-side provenance of the pair - which partition it came
    from and its position in that partition. They are carried for reporting only, and never key
    anything: the verdict is a pure function of (query, service_name), while both of these
    change with retrieval configuration. `verdict` is always one of relevance_vars.VERDICTS -
    relevance_marker_vars.py's wire markers are decoded before a record is built and never reach
    one - and there is no reason field: as of schema v3 the judge returns no free text at all.
    """
    query: str
    side: str
    rank: int
    service_name: str
    verdict: str
