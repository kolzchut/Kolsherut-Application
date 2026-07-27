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
