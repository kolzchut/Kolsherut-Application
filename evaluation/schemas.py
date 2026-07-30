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
    # The two set differences behind the metrics: which ground-truth services were never
    # returned, and which returned services the incumbent site does not show. Empty for
    # skipped queries. Each keeps its source ordering, so position is its rank.
    missed_ground_truth_names: tuple[str, ...] = ()
    unexpected_retrieved_names: tuple[str, ...] = ()
    # Carried, never scored on: no metric reads this. Keyed by the same normalized service
    # name the metrics match on, so both diff lists can look their scores up directly. Empty
    # for skipped queries, where retrieval was never called.
    service_scores: dict[str, ServiceScores] = field(default_factory=dict)


@dataclass(frozen=True)
class JudgementItem:
    """One (query, service) pair awaiting a verdict, read from a frozen diff JSON file.

    `scores` is the five score cells exactly as that file holds them - carried, never re-derived,
    and null on the missed side by construction.
    """
    query: str
    side: str
    rank: int
    service_name: str
    scores: dict[str, float | None] = field(default_factory=dict)


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

    `side` and `rank` are the retrieval-side provenance of the pair - which diff list it came
    from and its position in that list. They are carried for reporting only, and never key
    anything: the verdict is a pure function of (query, service_name), while both of these
    change with retrieval configuration.
    """
    query: str
    side: str
    rank: int
    service_name: str
    verdict: str
    reason: str
