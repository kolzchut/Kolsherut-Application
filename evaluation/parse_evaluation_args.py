import argparse

from evaluation.strings import APP_TITLE, CLI_DESCRIPTION, CLI_LIMIT_HELP, CLI_RESCRAPE_HELP
from evaluation.relevance_strings import CLI_JUDGE_HELP, CLI_JUDGE_LIMIT_HELP
from evaluation.human_review_strings import CLI_AGREEMENT_HELP, CLI_REVIEW_SAMPLE_HELP
from evaluation.human_review_vars import REVIEW_SAMPLE_SIZE_DEFAULT

# The CLI surface, and nothing else. Split out of run_evaluation.py to hold the 100-line rule, and
# this is the right seam: the flags change when a stage is added, the orchestration below them
# changes when a stage moves, and neither should drag the other's imports along.


def parse_evaluation_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog=APP_TITLE, description=CLI_DESCRIPTION)
    parser.add_argument('--limit', type=int, default=None, help=CLI_LIMIT_HELP)
    parser.add_argument('--rescrape', action='store_true', help=CLI_RESCRAPE_HELP)
    # Judging is opt-in: it is the only part of this pipeline that costs money and needs a
    # credential, so the default run stays free, offline and reproducible.
    parser.add_argument('--judge', action='store_true', help=CLI_JUDGE_HELP)
    parser.add_argument('--judge-limit', type=int, default=None, help=CLI_JUDGE_LIMIT_HELP)
    # Mission 6. `nargs='?'` so the flag carries the default 200 when N is omitted while its ABSENCE
    # still means "do not emit a sheet" - a plain default would emit one on every ordinary run.
    parser.add_argument('--review-sample', type=int, nargs='?', default=None,
                        const=REVIEW_SAMPLE_SIZE_DEFAULT, help=CLI_REVIEW_SAMPLE_HELP)
    parser.add_argument('--agreement', action='store_true', help=CLI_AGREEMENT_HELP)
    return parser.parse_args()
