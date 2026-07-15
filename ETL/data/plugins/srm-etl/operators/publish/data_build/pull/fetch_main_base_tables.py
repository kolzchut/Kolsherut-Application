"""The single pull of the six main-base Airtable tables the build consumes."""
from conf import settings

from ...airtable.airtable_client import fetch_rows_from_airtable

MAIN_BASE_TABLES = (
    settings.AIRTABLE_RESPONSE_TABLE,
    settings.AIRTABLE_SITUATION_TABLE,
    settings.AIRTABLE_ORGANIZATION_TABLE,
    settings.AIRTABLE_LOCATION_TABLE,
    settings.AIRTABLE_BRANCH_TABLE,
    settings.AIRTABLE_SERVICE_TABLE,
)


def fetch_main_base_tables_from_airtable():
    return {
        table_name: fetch_rows_from_airtable(settings.AIRTABLE_BASE, table_name)
        for table_name in MAIN_BASE_TABLES
    }
