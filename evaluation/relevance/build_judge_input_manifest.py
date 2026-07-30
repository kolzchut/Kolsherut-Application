import hashlib
from pathlib import Path

from evaluation import relevance_input_vars, vars
from evaluation.relevance.build_judgement_items import build_items_for_side
from evaluation.relevance.chunk_judgement_items import chunk_judgement_items

JUDGE_INPUT_PATHS = (relevance_input_vars.JUDGE_INPUT_UNEXPECTED_JSON_PATH,
                     relevance_input_vars.JUDGE_INPUT_MISSED_JSON_PATH)


def compute_file_checksum(path: Path) -> str:
    """SHA-256 of the file's bytes. This, not the retrieval configuration, is what identifies the
    judged dataset: retrieval/.env moved twice inside 11 minutes and six byte-identical retrieve
    calls returned two distinct document sets, so a config provably does not reproduce a run."""
    return f'{vars.CHECKSUM_PREFIX}{hashlib.sha256(path.read_bytes()).hexdigest()}'


def build_judge_input_manifest() -> dict:
    """The frozen snapshot's identity card: both content hashes, the pair and chunk counts, the
    headline score, and the retrieval configuration and scrape date as context."""
    items_by_side = {path.stem: build_items_for_side(path) for path in JUDGE_INPUT_PATHS}
    all_items = [item for items in items_by_side.values() for item in items]
    return {
        relevance_input_vars.MANIFEST_SOURCE_RUN_KEY: relevance_input_vars.JUDGE_INPUT_SOURCE_RUN,
        relevance_input_vars.MANIFEST_INPUT_HASHES_KEY: {
            path.name: compute_file_checksum(path) for path in JUDGE_INPUT_PATHS},
        relevance_input_vars.MANIFEST_PAIR_COUNTS_KEY: {
            side: len(items) for side, items in items_by_side.items()},
        relevance_input_vars.MANIFEST_TOTAL_PAIRS_KEY: len(all_items),
        relevance_input_vars.MANIFEST_CHUNK_COUNT_KEY: len(chunk_judgement_items(all_items)),
        relevance_input_vars.MANIFEST_OVERALL_SCORE_KEY:
            relevance_input_vars.JUDGE_INPUT_OVERALL_SCORE,
        relevance_input_vars.MANIFEST_SCRAPE_DATE_KEY: relevance_input_vars.JUDGE_INPUT_SCRAPE_DATE,
        relevance_input_vars.MANIFEST_RETRIEVAL_CONFIG_KEY:
            relevance_input_vars.JUDGE_INPUT_RETRIEVAL_CONFIG,
    }
