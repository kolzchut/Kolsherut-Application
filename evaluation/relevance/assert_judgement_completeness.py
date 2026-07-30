from evaluation import relevance_strings, relevance_vars
from evaluation.relevance.build_judgement_request import FIRST_ITEM_ID
from evaluation.schemas import JudgementChunk

# Both assertions RAISE. A silently dropped chunk, or a chunk that answered about 37 of the 40
# services it was given, produces output that still looks valid - and on a lite-tier model id
# omission and id drift on long chunks are the EXPECTED failure, not an exotic one. That is why
# the messages name halving JUDGEMENT_CHUNK_SIZE as the fix.


def build_expected_item_ids(chunk: JudgementChunk) -> list[int]:
    """The ids the request actually asked about: 1..len(items), the same scheme the request
    builder assigned, imported from it so the two cannot drift."""
    return list(range(FIRST_ITEM_ID, len(chunk.items) + FIRST_ITEM_ID))


def assert_every_chunk_key_returned(chunks: list[JudgementChunk], returned_keys: set[str]) -> None:
    """Every submitted key must come back, whether it produced verdicts or was logged unjudged."""
    missing_keys = [chunk.key for chunk in chunks if chunk.key not in returned_keys]
    if missing_keys:
        raise ValueError(relevance_strings.ERROR_CHUNK_KEYS_MISSING.format(
            count=len(missing_keys), total=len(chunks), keys=missing_keys,
            chunk_size=relevance_vars.JUDGEMENT_CHUNK_SIZE))


def assert_chunk_item_ids_match(chunk: JudgementChunk, judgement_entries: list[dict]) -> None:
    """Exactly one verdict per submitted item id - no omissions, no duplicates, no invented ids."""
    returned_ids = sorted(entry[relevance_vars.JUDGEMENT_ID_KEY] for entry in judgement_entries)
    expected_ids = build_expected_item_ids(chunk)
    if returned_ids != expected_ids:
        raise ValueError(relevance_strings.ERROR_CHUNK_ITEM_IDS_MISMATCH.format(
            key=chunk.key, returned=returned_ids, expected=expected_ids,
            chunk_size=relevance_vars.JUDGEMENT_CHUNK_SIZE))
