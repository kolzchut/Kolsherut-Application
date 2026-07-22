import argparse
import sys

from evaluation import vars
from evaluation.strings import APP_TITLE, LOG_LOADED_DATASET, LOG_WROTE_RESULTS, LOG_THRESHOLDS_PASSED
from evaluation.logger import build_logger
from evaluation.dataset.load_dataset import load_dataset
from evaluation.evaluate_dataset import evaluate_dataset
from evaluation.metrics.aggregate_metrics import aggregate_metrics
from evaluation.report.compute_overall_score import compute_overall_score
from evaluation.report.serialize_summary import build_summary
from evaluation.report.write_results import write_results
from evaluation.report.build_metrics_table import build_metrics_table
from evaluation.report.render_table import render_table
from evaluation.report.check_thresholds import check_thresholds


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=APP_TITLE)
    parser.add_argument('--limit', type=int, default=None, help='Evaluate only the first N queries')
    return parser.parse_args()


def report_and_gate(aggregate: dict, overall_score: float, logger) -> int:
    table = build_metrics_table(aggregate['metrics'])
    print(render_table(table, overall_score, aggregate['meta']))
    failures = check_thresholds(overall_score, aggregate['metrics'])
    for failure in failures:
        logger.error(failure)
    if not failures:
        logger.info(LOG_THRESHOLDS_PASSED)
    return 1 if failures else 0


def main() -> int:
    args = parse_args()
    logger = build_logger()
    examples = load_dataset()
    logger.info(LOG_LOADED_DATASET.format(count=len(examples), path=vars.DATASET_PATH))
    if args.limit is not None:
        examples = examples[:args.limit]
    evaluations = evaluate_dataset(examples, logger)
    aggregate = aggregate_metrics(evaluations)
    overall_score = compute_overall_score(aggregate['metrics'])
    write_results(build_summary(aggregate, overall_score, evaluations))
    logger.info(LOG_WROTE_RESULTS.format(
        summary=vars.SUMMARY_JSON_PATH, csv=vars.PER_QUERY_CSV_PATH, html=vars.REPORT_HTML_PATH))
    return report_and_gate(aggregate, overall_score, logger)


if __name__ == '__main__':
    sys.exit(main())
