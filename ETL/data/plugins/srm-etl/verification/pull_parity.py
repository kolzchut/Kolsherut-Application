"""Check: legacy dataflows_airtable pull vs the new airtable_client pull.

The only place the pyairtable pull path is exercised before the end-to-end run.
Usage: run_verification pull_parity --base <base id> --table <name> [--table <name> ...]
"""
import argparse

import dataflows as DF
from dataflows_airtable import load_from_airtable

from conf import settings
from operators.publish.airtable.airtable_client import list_table_rows

from .report_writer import diff_summary_lines, write_report
from .row_diff import diff_keyed_rows

CHECK_NAME = 'pull_parity'
RECORD_ID_FIELD = '__airtable_id'


def legacy_pull(base_id, table_name):
    return DF.Flow(
        load_from_airtable(base_id, table_name, settings.AIRTABLE_VIEW, settings.AIRTABLE_API_KEY),
    ).results()[0][0]


def new_pull(base_id, table_name):
    return list_table_rows(base_id, table_name)


def align_field_sets(legacy_rows, new_rows):
    """The legacy loader materializes every schema field on every row; make both
    sides carry the union of field names so absent-vs-None is not noise."""
    field_names = {name for row in legacy_rows + new_rows for name in row}
    aligner = lambda row: {name: row.get(name) for name in field_names}
    return [aligner(row) for row in legacy_rows], [aligner(row) for row in new_rows]


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--base', required=True)
    parser.add_argument('--table', action='append', required=True)
    args = parser.parse_args(argv)
    summary_lines = []
    details = {}
    for table_name in args.table:
        legacy_rows, new_rows = align_field_sets(legacy_pull(args.base, table_name), new_pull(args.base, table_name))
        table_summary, table_details = diff_keyed_rows(legacy_rows, new_rows, RECORD_ID_FIELD)
        summary_lines += diff_summary_lines(f'{CHECK_NAME}: {table_name}', table_summary)
        details[table_name] = table_details
    write_report(CHECK_NAME, summary_lines, details)
