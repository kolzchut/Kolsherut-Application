import csv
import json

from evaluation import vars
from evaluation.strings import (
    PER_QUERY_CSV_QUERY_HEADER, PER_QUERY_CSV_GT_SIZE_HEADER,
    PER_QUERY_CSV_EMPTY_GT_HEADER, PER_QUERY_CSV_HITS_HEADER_TEMPLATE,
)


def write_summary_json(summary: dict) -> None:
    vars.SUMMARY_JSON_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')


def build_per_query_header() -> list[str]:
    hits_headers = [PER_QUERY_CSV_HITS_HEADER_TEMPLATE.format(k=k) for k in vars.K_VALUES]
    return [PER_QUERY_CSV_QUERY_HEADER, PER_QUERY_CSV_GT_SIZE_HEADER, PER_QUERY_CSV_EMPTY_GT_HEADER, *hits_headers]


def build_per_query_row(entry: dict) -> list:
    hits = [entry['hits_by_k'][k] for k in vars.K_VALUES]
    return [entry['query'], entry['ground_truth_size'], entry['empty_ground_truth'], *hits]


def write_per_query_csv(summary: dict) -> None:
    with open(vars.PER_QUERY_CSV_PATH, 'w', encoding='utf-8', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(build_per_query_header())
        writer.writerows(build_per_query_row(entry) for entry in summary['per_query'])


def write_report_html(summary: dict) -> None:
    template = vars.DASHBOARD_TEMPLATE_PATH.read_text(encoding='utf-8')
    inlined_json = json.dumps(summary, ensure_ascii=False)
    report = template.replace(vars.DASHBOARD_DATA_PLACEHOLDER, inlined_json)
    vars.REPORT_HTML_PATH.write_text(report, encoding='utf-8')


def write_results(summary: dict) -> None:
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    write_summary_json(summary)
    write_per_query_csv(summary)
    write_report_html(summary)
