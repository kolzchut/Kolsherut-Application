"""Check: legacy data/autocomplete baseline vs the new autocomplete rows, keyed by id.

Expected explainable diffs: rows kept with bounds=None (deliberate change #4)
and structured_query token order (sorted for determinism - compared as a set).
Usage: run_verification autocomplete_diff --legacy <autocomplete datapackage dir> --new <autocomplete.json>
"""
import argparse
import json

from .datapackage_loader import load_datapackage_resource
from .report_writer import diff_summary_lines, write_report
from .row_diff import diff_keyed_rows

CHECK_NAME = 'autocomplete_diff'
QUERY_KEY_FIELD = 'id'
SET_COMPARE_FIELDS = ('synonyms',)


def tokenize_structured_query(rows):
    for row in rows:
        structured_query = row.get('structured_query')
        if isinstance(structured_query, str):
            row['structured_query'] = sorted(structured_query.split())
    return rows


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--legacy', required=True, help='Legacy autocomplete datapackage dir')
    parser.add_argument('--new', required=True, help='autocomplete.json from run_build_on_fixture or --dump-dir')
    args = parser.parse_args(argv)
    legacy_rows = tokenize_structured_query(load_datapackage_resource(args.legacy, 'autocomplete'))
    with open(args.new, 'r', encoding='utf-8') as new_file:
        new_rows = tokenize_structured_query(json.load(new_file))
    summary, details = diff_keyed_rows(legacy_rows, new_rows, QUERY_KEY_FIELD, set_compare_fields=SET_COMPARE_FIELDS)
    write_report(CHECK_NAME, diff_summary_lines(CHECK_NAME, summary), details)
