"""Check: isolate the merge's effect on the Data-Import copy.

Runs the copy twice - once with the production merge collapse, once with the old
keep-richest collapse - holding everything else constant, and diffs the collapse
OUTPUT per table (keyed by logical id). Because the collapse function is the only
variable, EVERY diff in this report is caused by the merge (README publish change
#11); there are no 'irrelevant' diffs here by construction. `changed` counts the
records the merge writes differently (unioned links / different scalar); link
fields are compared as unordered sets so union order is not noise.

Read-only: all Airtable writes are stubbed; the bases are only read. Requires a
configured environment (like pull_parity / es_corpus_diff).
Usage: run_verification merge_ab
"""
from operators.publish.airtable.merge_fetched_rows import merge_fetched_rows_by_id

from .keep_richest_baseline import keep_richest_rows_by_id
from .merge_ab_capture import capture_collapse_output
from .report_writer import diff_summary_lines, write_report
from .row_diff import diff_keyed_rows

CHECK_NAME = 'merge_ab'
ROW_KEY_FIELD = 'id'
LINK_SET_FIELDS = (
    'organizations', 'branches', 'organization', 'location',
    'situations', 'responses', 'urls', 'phone_numbers', 'data_sources',
)


def flatten_collapsed_rows(collapsed_rows):
    return [{'id': collapsed_row['id'], **collapsed_row['data']} for collapsed_row in collapsed_rows]


def diff_one_table(table_name, keep_richest_output, merge_output):
    return diff_keyed_rows(
        flatten_collapsed_rows(keep_richest_output.get(table_name, [])),
        flatten_collapsed_rows(merge_output.get(table_name, [])),
        ROW_KEY_FIELD, set_compare_fields=LINK_SET_FIELDS,
    )


def run(_argv):
    merge_output = capture_collapse_output(merge_fetched_rows_by_id)
    keep_richest_output = capture_collapse_output(keep_richest_rows_by_id)
    summary_lines = [f'{CHECK_NAME} report -- merge vs keep-richest; every diff below is caused by the merge']
    details = {}
    for table_name in sorted(set(merge_output) | set(keep_richest_output)):
        summary, table_details = diff_one_table(table_name, keep_richest_output, merge_output)
        summary_lines += diff_summary_lines(f'{CHECK_NAME}: {table_name}', summary)
        details[table_name] = table_details
    write_report(CHECK_NAME, summary_lines, details)
