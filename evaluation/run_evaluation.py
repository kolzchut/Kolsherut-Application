import sys

from evaluation import vars
from evaluation.strings import (
    COUNT_STATS_TABLE_TITLE, LOG_LOADED_DATASET, LOG_WROTE_RESULTS,
    LOG_THRESHOLDS_PASSED, SET_METRICS_TABLE_TITLE,
)
from evaluation.relevance_statistics_strings import RELEVANCE_TABLE_TITLE
from evaluation.logger import build_logger
from evaluation.parse_evaluation_args import parse_evaluation_args
from evaluation.human_review.run_human_review_stage import run_human_review_stage
from evaluation.relevance.judge_and_rewrite_summary import judge_and_rewrite_summary
from evaluation.dataset.load_dataset import load_dataset
from evaluation.ground_truth.load_ground_truth import load_ground_truth
from evaluation.ground_truth.enrich_missed_service_details import enrich_missed_service_details
from evaluation.evaluate_dataset import evaluate_dataset
from evaluation.metrics.aggregate_metrics import aggregate_metrics
from evaluation.report.compute_overall_score import compute_overall_score
from evaluation.report.serialize_summary import build_summary
from evaluation.report.write_results import write_results
from evaluation.report.build_metrics_table import build_metrics_table
from evaluation.report.build_relevance_table import build_relevance_table
from evaluation.report.build_set_metrics_table import build_count_stats_table, build_set_metrics_table
from evaluation.report.render_table import render_table, render_titled_table
from evaluation.report.check_thresholds import check_thresholds


def report_and_gate(aggregate: dict, overall_score: float, relevance: dict | None, logger) -> int:
    table = build_metrics_table(aggregate['metrics'])
    print(render_table(table, overall_score, aggregate['meta']))
    print(render_titled_table(SET_METRICS_TABLE_TITLE, build_set_metrics_table(aggregate)))
    print(render_titled_table(COUNT_STATS_TABLE_TITLE, build_count_stats_table(aggregate)))
    # Only when the run judged. An unjudged run has no block and prints no relevance table, rather
    # than printing one full of zeroes that would read as "the judge found nothing relevant".
    if relevance is not None:
        print(render_titled_table(RELEVANCE_TABLE_TITLE, build_relevance_table(relevance)))
    failures = check_thresholds(overall_score, aggregate['metrics'])
    for failure in failures:
        logger.error(failure)
    if not failures:
        logger.info(LOG_THRESHOLDS_PASSED)
    return 1 if failures else 0


def main() -> int:
    args = parse_evaluation_args()
    logger = build_logger()
    # Mission 6 first, and it RETURNS: both stages read the frozen snapshot and the committed label
    # cache only, so evaluating would call retrieval and overwrite results/ for no gain.
    if run_human_review_stage(args.review_sample, args.agreement, logger):
        return 0
    examples, source_checksum = load_dataset()
    logger.info(LOG_LOADED_DATASET.format(count=len(examples), path=vars.DATASET_PATH))
    if args.limit is not None:
        examples = examples[:args.limit]
    # A limited run must not overwrite the cache with a partial scrape.
    ground_truth = load_ground_truth(examples, source_checksum, logger,
                                     rescrape=args.rescrape, persist=args.limit is None)
    evaluations = evaluate_dataset(examples, ground_truth, logger)
    # After every retrieval call and before any aggregation. It only fills in content for names
    # retrieval never returned, so no metric can see it - but it must land before write_results,
    # which is what serializes the content into summary.json and the three diff files.
    evaluations = enrich_missed_service_details(evaluations, logger)
    aggregate = aggregate_metrics(evaluations)
    overall_score = compute_overall_score(aggregate['metrics'])
    # Every base artifact lands here, before any network call and before any judgement exists. An
    # unjudged run writes summary.json exactly once, and this is that write.
    write_results(build_summary(aggregate, overall_score, evaluations))
    logger.info(LOG_WROTE_RESULTS.format(
        summary=vars.SUMMARY_JSON_PATH, csv=vars.PER_QUERY_CSV_PATH,
        diff=vars.SERVICE_DIFF_CSV_PATH, unexpected_json=vars.UNEXPECTED_RETRIEVED_JSON_PATH,
        missed_json=vars.MISSED_GROUND_TRUTH_JSON_PATH,
        mutual_json=vars.MUTUAL_RETRIEVED_JSON_PATH, html=vars.REPORT_HTML_PATH))
    # Judging LAST, and only on --judge: it reads the frozen snapshot, and everything above is
    # already safely on disk before the one stage that is expected to raise.
    relevance = judge_and_rewrite_summary(args.judge, args.judge_limit, aggregate, overall_score,
                                          evaluations, logger)
    return report_and_gate(aggregate, overall_score, relevance, logger)


if __name__ == '__main__':
    sys.exit(main())
