"""In-memory snapshot of a curation table + flagging of never-reviewed records
(legacy from_curation snapshot loop; the from-curation-* disk dumps are gone).

Rows whose decision is empty get decision='New' written back to the curation
base; the returned snapshot keeps the original (empty) value, like the legacy
local dump did.
"""
from conf import settings
from srm_tools.logger import logger

from ..airtable.airtable_client import RECORD_ID_FIELD, batch_update_rows, list_table_rows

CURATION_TABLE_FIELDS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: [
        'name', 'short_name', 'kind', 'urls', 'phone_numbers', 'email_address', 'description', 'purpose',
    ],
    settings.AIRTABLE_BRANCH_TABLE: [
        'name', 'organization', 'operating_unit', 'address', 'address_details', 'location',
        'description', 'phone_numbers', 'email_address', 'urls', 'situations',
    ],
    settings.AIRTABLE_SERVICE_TABLE: [
        'name', 'description', 'details', 'payment_required', 'payment_details', 'urls',
        'phone_numbers', 'email_address', 'implements', 'situations', 'responses',
        'organizations', 'branches', 'responses_manual', 'situations_manual', 'data_sources', 'boost',
    ],
}
CURATION_EXTRA_FIELDS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: ['services', 'branch_services'],
    settings.AIRTABLE_BRANCH_TABLE: ['services', 'org_services'],
    settings.AIRTABLE_SERVICE_TABLE: ['organizations', 'branches'],
}
SNAPSHOT_COMMON_FIELDS = ('decision', 'status', 'id', 'source', 'fixes')
NEW_DECISION = 'New'


def snapshot_field_names(table_name):
    return CURATION_TABLE_FIELDS[table_name] + list(SNAPSHOT_COMMON_FIELDS) + CURATION_EXTRA_FIELDS[table_name]


def fetch_curation_table(curation_base, table_name):
    field_names = snapshot_field_names(table_name)
    rows = list_table_rows(curation_base, table_name)
    return [
        {**{name: row.get(name) for name in field_names}, RECORD_ID_FIELD: row[RECORD_ID_FIELD]}
        for row in rows
    ]


def flag_undecided_rows(curation_base, table_name, snapshot_rows):
    undecided_rows = [
        {'id': row.get('id'), 'decision': NEW_DECISION, RECORD_ID_FIELD: row[RECORD_ID_FIELD]}
        for row in snapshot_rows if not row.get('decision')
    ]
    if undecided_rows:
        logger.info("Flagging %d undecided %s rows with decision='%s'", len(undecided_rows), table_name, NEW_DECISION)
        batch_update_rows(curation_base, table_name, undecided_rows)
