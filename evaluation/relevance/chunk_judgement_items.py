from evaluation import relevance_vars
from evaluation.schemas import JudgementChunk, JudgementItem

FIRST_CHUNK_INDEX = 1


def group_items_by_query_and_side(items: list[JudgementItem]) -> dict[tuple[str, str], list[JudgementItem]]:
    """One group per (query, side). Grouping by query is what lets a request carry the query once
    and a list of services under it; keeping the sides apart keeps a request's services all
    comparable, since one side has scores and the other has none.

    Insertion order is preserved, so the chunk sequence is a deterministic function of the input
    files and re-chunking the same snapshot yields the same keys.
    """
    grouped: dict[tuple[str, str], list[JudgementItem]] = {}
    for item in items:
        grouped.setdefault((item.query, item.side), []).append(item)
    return grouped


def split_items_into_batches(items: list[JudgementItem]) -> list[tuple[JudgementItem, ...]]:
    """Slice one group at JUDGEMENT_CHUNK_SIZE. That size is a reliability lever, not a cost one:
    cost is indifferent to it, while a lite-tier model omits and mis-echoes ids more as the list
    grows, so halving it is the first fix when the completeness assertion fires."""
    size = relevance_vars.JUDGEMENT_CHUNK_SIZE
    return [tuple(items[start:start + size]) for start in range(0, len(items), size)]


def build_chunk_key(chunk_index: int) -> str:
    """The Batch API's user-defined key. It is what correlates a result line back to its request,
    so every chunk gets a distinct one and nothing is ever joined by position."""
    return f'{relevance_vars.BATCH_CHUNK_KEY_PREFIX}{chunk_index}'


def chunk_judgement_items(items: list[JudgementItem]) -> list[JudgementChunk]:
    """Every item, grouped by (query, side) and split at the chunk size, in one flat list."""
    chunks = []
    for (query, side), group_items in group_items_by_query_and_side(items).items():
        for batch in split_items_into_batches(group_items):
            chunks.append(JudgementChunk(key=build_chunk_key(len(chunks) + FIRST_CHUNK_INDEX),
                                         query=query, side=side, items=batch))
    return chunks
