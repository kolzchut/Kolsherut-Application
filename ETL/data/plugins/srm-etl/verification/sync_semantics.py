"""Check: one-shot, offline validation of the airtable_sync change detection.

No Airtable access - the client functions are stubbed. Scenarios covered:
new row written, unchanged existing row skipped, changed row written, vanished
ACTIVE row written as INACTIVE, vanished INACTIVE row skipped.
Usage: run_verification sync_semantics
"""
from operators.publish.airtable import airtable_sync

from .report_writer import write_report

CHECK_NAME = 'sync_semantics'
TABLE_FIELDS = ['name', 'kind']
CURRENT_ROWS = [
    {'id': 'unchanged', 'name': 'same', 'kind': 'k', 'source': 'test', 'status': 'ACTIVE', '__airtable_id': 'rec1'},
    {'id': 'changed', 'name': 'old', 'kind': 'k', 'source': 'test', 'status': 'ACTIVE', '__airtable_id': 'rec2'},
    {'id': 'vanished-active', 'name': 'x', 'kind': 'k', 'source': 'test', 'status': 'ACTIVE', '__airtable_id': 'rec3'},
    {'id': 'vanished-inactive', 'name': 'y', 'kind': 'k', 'source': 'test', 'status': 'INACTIVE', '__airtable_id': 'rec4'},
    {'id': 'other-source', 'name': 'z', 'kind': 'k', 'source': 'other', 'status': 'ACTIVE', '__airtable_id': 'rec5'},
]
FETCHED_ROWS = [
    {'id': 'unchanged', 'data': {'name': 'same', 'kind': 'k'}},
    {'id': 'changed', 'data': {'name': 'new', 'kind': 'k'}},
    {'id': 'brand-new', 'data': {'name': 'n', 'kind': 'k'}},
]
EXPECTED_WRITTEN_IDS = {'changed': 'ACTIVE', 'brand-new': 'ACTIVE', 'vanished-active': 'INACTIVE'}


def run(_argv):
    written_rows = []
    airtable_sync.fetch_rows_from_airtable = lambda *args, **kwargs: [dict(row) for row in CURRENT_ROWS]
    airtable_sync.create_or_update_rows_in_airtable = lambda base, table, rows: written_rows.extend(rows)
    counts = airtable_sync.sync_table_rows('TestTable', 'test', TABLE_FIELDS, FETCHED_ROWS)
    written_statuses = {row['id']: row['status'] for row in written_rows}
    summary_lines = [
        f'{CHECK_NAME} report',
        f'  counts: {counts}',
        f'  written: {written_statuses}',
        f'  expected: {EXPECTED_WRITTEN_IDS}',
        f"  matches expectation: {written_statuses == EXPECTED_WRITTEN_IDS}",
    ]
    write_report(CHECK_NAME, summary_lines, {'written_rows': written_rows, 'counts': counts})
