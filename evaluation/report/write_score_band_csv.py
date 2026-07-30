import csv

from evaluation import relevance_report_vars, relevance_strings, relevance_vars, vars
from evaluation.report.render_table import render_titled_table


def build_score_band_header() -> list[str]:
    """The fixed four columns, then a count and a share per verdict - the verdict vocabulary in
    relevance_vars.py is the only definition of which verdict columns exist."""
    verdict_headers = [
        f'{verdict}{suffix}'
        for verdict in relevance_vars.VERDICTS
        for suffix in (relevance_report_vars.BAND_TABLE_COUNT_SUFFIX,
                       relevance_report_vars.BAND_TABLE_SHARE_SUFFIX)
    ]
    return [
        relevance_strings.SCORE_BAND_CSV_SCORE_COLUMN_HEADER,
        relevance_strings.SCORE_BAND_CSV_BAND_START_HEADER,
        relevance_strings.SCORE_BAND_CSV_BAND_END_HEADER,
        relevance_strings.SCORE_BAND_CSV_COUNT_HEADER,
        *verdict_headers,
    ]


def build_score_band_row(band_record: dict, header: list[str]) -> list:
    """The record's values in header order, so the CSV and the console table cannot disagree."""
    return [band_record[column] for column in header]


def format_console_cell(value) -> str:
    """Counts stay counts; floats get four decimals. Display only - the CSV keeps full precision,
    because a share read off the console picks the operating point but is not the record of it."""
    return f'{value:.4f}' if isinstance(value, float) else str(value)


def build_score_band_console_table(band_records: list[dict]) -> dict:
    header = build_score_band_header()
    return {
        'headers': header,
        'rows': [[format_console_cell(value) for value in build_score_band_row(band_record, header)]
                 for band_record in band_records],
    }


def write_score_band_csv(band_records: list[dict]) -> int:
    header = build_score_band_header()
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(relevance_report_vars.RELEVANCE_BY_SCORE_BAND_CSV_PATH, 'w', encoding='utf-8',
              newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(header)
        writer.writerows(build_score_band_row(record, header) for record in band_records)
    return len(band_records)


def render_score_band_table(band_records: list[dict]) -> str:
    return render_titled_table(relevance_strings.SCORE_BAND_TABLE_TITLE,
                               build_score_band_console_table(band_records))
