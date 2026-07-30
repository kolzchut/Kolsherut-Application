from typing import Iterable

from evaluation import relevance_strings, relevance_vars
from evaluation.relevance.assert_judgement_completeness import (
    assert_chunk_item_ids_match, assert_every_chunk_key_returned,
)
from evaluation.relevance.build_judgement_request import FIRST_ITEM_ID
from evaluation.relevance.read_judgement_response import (
    read_judgement_entries, read_result_line_key, read_unjudged_reason,
)
from evaluation.schemas import JudgementChunk, ServiceJudgement


def index_chunks_by_key(chunks: list[JudgementChunk]) -> dict[str, JudgementChunk]:
    return {chunk.key: chunk for chunk in chunks}


def build_judgements_for_chunk(chunk: JudgementChunk,
                               judgement_entries: list[dict]) -> list[ServiceJudgement]:
    """Join one chunk's verdicts back onto its items by the echoed id.

    The id is the item's position in the request, so the join never depends on the model echoing
    a service name, and the completeness assertion runs first so no id can be missing here.
    """
    assert_chunk_item_ids_match(chunk, judgement_entries)
    entries_by_id = {entry[relevance_vars.JUDGEMENT_ID_KEY]: entry for entry in judgement_entries}
    return [
        ServiceJudgement(
            query=chunk.query, side=chunk.side, rank=item.rank, service_name=item.service_name,
            verdict=entries_by_id[item_id][relevance_vars.JUDGEMENT_VERDICT_KEY],
            reason=entries_by_id[item_id][relevance_vars.JUDGEMENT_REASON_KEY])
        for item_id, item in enumerate(chunk.items, start=FIRST_ITEM_ID)
    ]


def resolve_result_chunk(chunks_by_key: dict[str, JudgementChunk], result_line: dict,
                         seen_keys: set[str]) -> JudgementChunk:
    """The chunk a result line belongs to, found by its key. Unknown and repeated keys are errors:
    result order is not documented as matching input order, so the key is the only correlation."""
    key = read_result_line_key(result_line)
    if key not in chunks_by_key:
        raise ValueError(relevance_strings.ERROR_CHUNK_UNKNOWN_KEY.format(key=key))
    if key in seen_keys:
        raise ValueError(relevance_strings.ERROR_CHUNK_KEY_DUPLICATED.format(key=key))
    return chunks_by_key[key]


def parse_judgement_results(chunks: list[JudgementChunk], result_lines: Iterable[dict]
                            ) -> tuple[list[ServiceJudgement], list[tuple[JudgementChunk, str]]]:
    """Batch results to verdicts, plus the chunks that produced none and why.

    Each line is either a response or a status object, so the unjudged reason is resolved before
    any candidate is touched. Unjudged chunks are returned for logging and counting rather than
    raised on; a chunk that never came back at all is what raises.
    """
    chunks_by_key = index_chunks_by_key(chunks)
    judgements: list[ServiceJudgement] = []
    unjudged_chunks: list[tuple[JudgementChunk, str]] = []
    seen_keys: set[str] = set()
    for result_line in result_lines:
        chunk = resolve_result_chunk(chunks_by_key, result_line, seen_keys)
        seen_keys.add(chunk.key)
        unjudged_reason = read_unjudged_reason(result_line)
        if unjudged_reason:
            unjudged_chunks.append((chunk, unjudged_reason))
            continue
        judgements.extend(build_judgements_for_chunk(chunk, read_judgement_entries(result_line)))
    assert_every_chunk_key_returned(chunks, seen_keys)
    return judgements, unjudged_chunks
