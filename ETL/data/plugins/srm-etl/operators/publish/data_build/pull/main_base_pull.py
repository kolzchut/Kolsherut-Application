"""The single pull of the six main-base Airtable tables the build consumes."""
from conf import settings

from ...airtable.airtable_client import list_table_rows

MAIN_BASE_TABLES = (
    settings.AIRTABLE_RESPONSE_TABLE,
    settings.AIRTABLE_SITUATION_TABLE,
    settings.AIRTABLE_ORGANIZATION_TABLE,
    settings.AIRTABLE_LOCATION_TABLE,
    settings.AIRTABLE_BRANCH_TABLE,
    settings.AIRTABLE_SERVICE_TABLE,
)


def pull_main_base_tables():
    return {
        table_name: list_table_rows(settings.AIRTABLE_BASE, table_name)
        for table_name in MAIN_BASE_TABLES
    }
