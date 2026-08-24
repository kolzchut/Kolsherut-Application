from dataclasses import dataclass


@dataclass(frozen=True)
class FrozenQueryRecord:
    """One query as the FROZEN snapshot records it: the three counts the adjusted metrics divide by.

    Every field is read verbatim off the frozen diff files' per-query entries, which re-emit
    summary.json's own `ground_truth_size` and `returned_count` under the same names. Nothing here
    is recomputed from service names or from a live retrieval call - the labels were produced from
    these exact bytes, and re-deriving the counts from anything else would pair them with a
    different arm.

    `hits` is the one derived field, and it is a set identity over two recorded integers rather than
    a re-measurement: the returned services that ARE in the golden set are the returned ones minus
    the unexpected ones, and equally the golden-set ones minus the missed ones. Both files record
    their own side's count, so the identity is checkable - and it holds on all 65 frozen queries.

    `returned_count` is None for a query retrieval was never called for (an unsupported golden-set
    URL). Such a query contributes no rows to either diff file, so it has no adjusted metrics.
    """
    query: str
    ground_truth_size: int
    returned_count: int | None
    unexpected_count: int | None
    missed_count: int | None
    hits: int | None
