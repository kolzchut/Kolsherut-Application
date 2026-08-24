"""Fetch a Data-Import table into memory + flag never-reviewed records
(legacy from_curation snapshot loop; the from-curation-* disk dumps are gone).

Rows whose decision is empty get decision='New' written back to the Data-Import
base; the returned rows keep the original (empty) value, like the legacy
local dump did.
"""
from conf import settings
from srm_tools.logger import logger

from ..airtable.airtable_client import AIRTABLE_RECORD_ID_FIELD, update_rows_in_airtable, fetch_rows_from_airtable

DATA_IMPORT_TABLE_FIELDS = {
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
DATA_IMPORT_EXTRA_FIELDS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: ['services', 'branch_services'],
    settings.AIRTABLE_BRANCH_TABLE: ['services', 'org_services'],
    settings.AIRTABLE_SERVICE_TABLE: ['organizations', 'branches'],
}
COMMON_TABLE_FIELDS = ('decision', 'status', 'id', 'source', 'fixes')
NEW_DECISION = 'New'


def table_field_names(table_name):
    return DATA_IMPORT_TABLE_FIELDS[table_name] + list(COMMON_TABLE_FIELDS) + DATA_IMPORT_EXTRA_FIELDS[table_name]


def fetch_data_import_table_rows(data_import_base, table_name):
    field_names = table_field_names(table_name)
    rows = fetch_rows_from_airtable(data_import_base, table_name)
    return [
        {**{name: row.get(name) for name in field_names}, AIRTABLE_RECORD_ID_FIELD: row[AIRTABLE_RECORD_ID_FIELD]}
        for row in rows
    ]


def flag_undecided_rows(data_import_base, table_name, table_rows):
    undecided_rows = [
        {'id': row.get('id'), 'decision': NEW_DECISION, AIRTABLE_RECORD_ID_FIELD: row[AIRTABLE_RECORD_ID_FIELD]}
        for row in table_rows if not row.get('decision')
    ]
    if undecided_rows:
        logger.info("Flagging %d undecided %s rows with decision='%s'", len(undecided_rows), table_name, NEW_DECISION)
        update_rows_in_airtable(data_import_base, table_name, undecided_rows)
