import hashlib
import json
import shutil
from datetime import date

from evaluation import relevance_input_vars, relevance_strings, vars
from evaluation.logger import build_logger
from evaluation.relevance.build_judgement_items import build_judgement_items
from evaluation.relevance.chunk_judgement_items import chunk_judgement_items

# The freeze: copy results/ into results-judge-frozen/ and regenerate its manifest. Run BETWEEN the
# unjudged run and the judged one - `--judge` reads the frozen bytes, never results/.
#
#     python -m evaluation.run_evaluation          # produces results/
#     python -m evaluation.freeze_judge_input      # freezes it
#     python -m evaluation.run_evaluation --judge  # judges the frozen bytes
#
# Overwrites the previous freeze, which is the only record of what the committed labels were judged
# against - copy it aside first if those labels still matter.
#
# scrape_date and retrieval_config are CARRIED OVER from relevance_input_vars.py rather than
# observed: nothing here can see retrieval's .env or the scraper's last run. Edit those constants
# whenever the arm changes, or the manifest will confidently describe the wrong configuration.
SIDE_PATHS = {
    vars.UNEXPECTED_RETRIEVED_JSON_PATH.stem: vars.UNEXPECTED_RETRIEVED_JSON_PATH,
    vars.MISSED_GROUND_TRUTH_JSON_PATH.stem: vars.MISSED_GROUND_TRUTH_JSON_PATH,
    vars.MUTUAL_RETRIEVED_JSON_PATH.stem: vars.MUTUAL_RETRIEVED_JSON_PATH,
}
SUMMARY_OVERALL_SCORE_KEY = 'overall_score'


def hash_frozen_file(file_name: str) -> str:
    return (f'{vars.CHECKSUM_PREFIX}'
            f'{hashlib.sha256((relevance_input_vars.JUDGE_INPUT_DIR / file_name).read_bytes()).hexdigest()}')


def count_frozen_pairs(file_name: str) -> int:
    """One frozen side's pair count, read back from the COPY rather than from results/, so the
    manifest counts the same bytes it hashes."""
    payload = json.loads(
        (relevance_input_vars.JUDGE_INPUT_DIR / file_name).read_text(encoding='utf-8'))
    return sum(len(entry[vars.DIFF_JSON_SERVICES_KEY])
               for entry in payload[vars.DIFF_JSON_QUERIES_KEY])


def copy_results_into_freeze() -> None:
    """A missing side raises rather than freezing a partial snapshot, which would be judged as if
    it were the whole dataset."""
    relevance_input_vars.JUDGE_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    for path in SIDE_PATHS.values():
        if not path.exists():
            raise FileNotFoundError(relevance_strings.ERROR_JUDGE_INPUT_FILE_MISSING.format(
                path=path, directory=vars.RESULTS_DIR))
        shutil.copy2(path, relevance_input_vars.JUDGE_INPUT_DIR / path.name)


def build_manifest(pair_counts: dict[str, int]) -> dict:
    items = build_judgement_items()
    summary = json.loads(vars.SUMMARY_JSON_PATH.read_text(encoding='utf-8'))
    return {
        relevance_input_vars.MANIFEST_SOURCE_RUN_KEY:
            relevance_strings.MANIFEST_SOURCE_RUN.format(date=date.today().isoformat()),
        relevance_input_vars.MANIFEST_INPUT_HASHES_KEY: {
            path.name: hash_frozen_file(path.name) for path in SIDE_PATHS.values()},
        relevance_input_vars.MANIFEST_PAIR_COUNTS_KEY: pair_counts,
        relevance_input_vars.MANIFEST_TOTAL_PAIRS_KEY: len(items),
        relevance_input_vars.MANIFEST_CHUNK_COUNT_KEY: len(chunk_judgement_items(items)),
        relevance_input_vars.MANIFEST_OVERALL_SCORE_KEY: summary[SUMMARY_OVERALL_SCORE_KEY],
        relevance_input_vars.MANIFEST_SCRAPE_DATE_KEY: relevance_input_vars.JUDGE_INPUT_SCRAPE_DATE,
        relevance_input_vars.MANIFEST_RETRIEVAL_CONFIG_KEY:
            relevance_input_vars.JUDGE_INPUT_RETRIEVAL_CONFIG,
    }


def main() -> int:
    logger = build_logger()
    copy_results_into_freeze()
    pair_counts = {side: count_frozen_pairs(path.name) for side, path in SIDE_PATHS.items()}
    manifest = build_manifest(pair_counts)
    relevance_input_vars.JUDGE_INPUT_MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    for path in SIDE_PATHS.values():
        logger.info(relevance_strings.LOG_FROZE_SIDE.format(
            side=path.stem, pairs=pair_counts[path.stem], hash=hash_frozen_file(path.name)))
    logger.info(relevance_strings.LOG_FROZE_JUDGE_INPUT.format(
        pairs=manifest[relevance_input_vars.MANIFEST_TOTAL_PAIRS_KEY],
        source=vars.RESULTS_DIR, directory=relevance_input_vars.JUDGE_INPUT_DIR))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
