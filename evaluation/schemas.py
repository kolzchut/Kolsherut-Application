from dataclasses import dataclass, field


@dataclass(frozen=True)
class Example:
    """One dataset row: a free-text query and the golden-set URL that answers it."""
    query: str
    url: str
    staging_url: str


@dataclass(frozen=True)
class ScrapedPage:
    """What one rendered golden-set page yielded, or why it could not be used."""
    service_names: tuple[str, ...] = ()
    skip_reason: str = ''


@dataclass(frozen=True)
class ServiceScores:
    """Every score retrieval reported for one returned service.

    None means the corresponding retriever never surfaced a document for that service, which
    is a different fact from having scored it zero. The distinction is load-bearing for how
    the semantic floor reads, so it is never substituted with 0.0 anywhere downstream.
    """
    retrieval_score: float | None = None
    semantic_score: float | None = None
    lexical_score: float | None = None
    cosine_score: float | None = None
    cosine_score_ratio: float | None = None


@dataclass(frozen=True)
class ServiceDetails:
    """What one service IS, as opposed to how it scored: its description and its two tag sets.

    Read off the same srm__cards fields whether they arrive on a retrieval response or on a BE
    search response, and carried to the judgement table untouched. Every field is optional at
    the source, so an absent one stays empty here and is written as a BLANK cell - never a
    placeholder and never a guess at what the service might be about.
    """
    service_description: str = ''
    response_ids: tuple[str, ...] = ()
    response_names: tuple[str, ...] = ()
    situation_ids: tuple[str, ...] = ()
    situation_names: tuple[str, ...] = ()


@dataclass(frozen=True)
class QueryEvaluation:
    """Metrics for a single query, plus the meta needed for aggregation and drill-down."""
    query: str
    ground_truth_size: int
    empty_ground_truth: bool
    skip_reason: str = ''
    metrics_by_k: dict[int, dict[str, float]] = field(default_factory=dict)
    hits_by_k: dict[int, int] = field(default_factory=dict)
    # How many services retrieval actually returned. None for skipped queries, where
    # retrieval was never called - distinct from a genuine zero.
    returned_count: int | None = None
    set_metrics: dict[str, float] = field(default_factory=dict)
    # Retrieval's returned list in its own rank order, whole and unfiltered. The ONLY source of
    # raw_rank: position here is the rank retrieval actually assigned, which the three partitions
    # below cannot express because each renumbers from 1 within itself.
    ranked_names: tuple[str, ...] = ()
    # The three partitions of (returned union golden set) behind the metrics: which ground-truth
    # services were never returned, which returned services the incumbent site does not show, and
    # which both agree on. Empty for skipped queries. Each keeps its source ordering.
    missed_ground_truth_names: tuple[str, ...] = ()
    unexpected_retrieved_names: tuple[str, ...] = ()
    mutual_retrieved_names: tuple[str, ...] = ()
    # Carried, never scored on: no metric reads either map. Both are keyed by the same normalized
    # service name the metrics match on, so every partition can look its rows up directly. The
    # score map covers the returned names only; the detail map also covers missed names, whose
    # content is fetched separately because retrieval never returned them.
    service_scores: dict[str, ServiceScores] = field(default_factory=dict)
    service_details: dict[str, ServiceDetails] = field(default_factory=dict)
