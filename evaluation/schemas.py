from dataclasses import dataclass, field


@dataclass(frozen=True)
class Example:
    """One dataset row: a free-text query and its labelled taxonomy slugs."""
    query: str
    response_slugs: list[str] = field(default_factory=list)
    situation_slugs: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class QueryEvaluation:
    """Metrics for a single query, plus the meta needed for aggregation and drill-down."""
    query: str
    ground_truth_size: int
    empty_ground_truth: bool
    be_returned_empty: bool
    metrics_by_k: dict[int, dict[str, float]] = field(default_factory=dict)
    hits_by_k: dict[int, int] = field(default_factory=dict)
