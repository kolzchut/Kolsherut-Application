import csv
import json
from pathlib import Path

from evaluation import vars
from evaluation.report.build_per_query_rows import build_per_query_header, build_per_query_row
from evaluation.report.build_service_diff_json import build_missed_payload, build_unexpected_payload
from evaluation.report.build_service_diff_rows import (
    build_service_diff_header, build_service_diff_rows,
)


def write_summary_json(summary: dict) -> None:
    vars.SUMMARY_JSON_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')


def write_per_query_csv(summary: dict) -> None:
    with open(vars.PER_QUERY_CSV_PATH, 'w', encoding='utf-8', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(build_per_query_header())
        writer.writerows(build_per_query_row(entry) for entry in summary['per_query'])


def write_service_diff_csv(summary: dict) -> None:
    """One row per query x diffed service - the names behind per_query.csv's two diff counts."""
    with open(vars.SERVICE_DIFF_CSV_PATH, 'w', encoding='utf-8', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(build_service_diff_header())
        for entry in summary['per_query']:
            writer.writerows(build_service_diff_rows(entry))


def write_diff_json(payload: dict, path: Path) -> None:
    """One side of the service diff, scores attached - what a relevance judge reads."""
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def write_unexpected_retrieved_json(summary: dict) -> None:
    """The false positives, each carrying the scores that got it returned."""
    write_diff_json(build_unexpected_payload(summary), vars.UNEXPECTED_RETRIEVED_JSON_PATH)


def write_missed_ground_truth_json(summary: dict) -> None:
    """The recall failures. Same schema, five null scores - nothing ever scored these."""
    write_diff_json(build_missed_payload(summary), vars.MISSED_GROUND_TRUTH_JSON_PATH)


def write_report_html(summary: dict) -> None:
    template = vars.DASHBOARD_TEMPLATE_PATH.read_text(encoding='utf-8')
    inlined_json = json.dumps(summary, ensure_ascii=False)
    report = template.replace(vars.DASHBOARD_DATA_PLACEHOLDER, inlined_json)
    vars.REPORT_HTML_PATH.write_text(report, encoding='utf-8')


def write_results(summary: dict) -> None:
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    write_summary_json(summary)
    write_per_query_csv(summary)
    write_service_diff_csv(summary)
    write_unexpected_retrieved_json(summary)
    write_missed_ground_truth_json(summary)
    write_report_html(summary)


def rewrite_summary_artifacts(summary: dict) -> None:
    """Re-emit the two artifacts that are pure renders of the summary payload, and only those.

    Used for the second write of a judged run, once the `relevance` block exists. The four CSV and
    diff-JSON artifacts are untouched because no judgement changes them, so a judged run rewrites
    the minimum: the payload itself, and the self-contained HTML that inlines it.
    """
    write_summary_json(summary)
    write_report_html(summary)
