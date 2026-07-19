"""Run the Data-Import copy read-only, capturing each collapse variant's output.

All Airtable writes are stubbed (main-base upsert, the Data-Import decision='New'
flagging, and the manual-fix status write-back); the bases are only read. The
collapse function is wrapped so its per-table output is recorded, then the real
copy pipeline runs unchanged.
"""
import functools

from operators.publish.airtable import airtable_sync, manual_fixes
from operators.publish.copy_from_data_import import fetch_data_import_tables
from operators.publish.copy_from_data_import.copy_from_data_import_main import copy_approved_data_from_data_import

NOOP = lambda *args, **kwargs: None


def stub_all_airtable_writes():
    airtable_sync.create_or_update_rows_in_airtable = NOOP
    fetch_data_import_tables.update_rows_in_airtable = NOOP
    manual_fixes.update_rows_in_airtable = NOOP


def record_collapse_output(collapse_function, captured_rows, fetched_rows, table_name):
    collapsed_rows = collapse_function(fetched_rows, table_name)
    captured_rows.setdefault(table_name, []).extend(collapsed_rows)
    return collapsed_rows


def capture_collapse_output(collapse_function):
    captured_rows = {}
    stub_all_airtable_writes()
    airtable_sync.merge_fetched_rows_by_id = functools.partial(record_collapse_output, collapse_function, captured_rows)
    copy_approved_data_from_data_import()
    return captured_rows
