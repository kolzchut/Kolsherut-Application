import csv
import json

from evaluation import vars
from evaluation.report.build_per_query_rows import build_per_query_header, build_per_query_row
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
    write_report_html(summary)
