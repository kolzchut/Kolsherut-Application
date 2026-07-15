"""Stage 1 - copy approved rows from the Data-Import base into the main base
(legacy from_curation.py). Runs BEFORE the data build pull so the build sees
the copied data. Legacy disk snapshots are replaced by in-memory lists.
"""
from conf import settings
from srm_tools.logger import logger

from ..airtable.manual_fixes import load_manual_fixes, write_fix_statuses_to_airtable
from .copy_branches import copy_branches_to_main_base
from .fetch_data_import_tables import fetch_data_import_table_rows, flag_undecided_rows
from .convert_linked_record_ids import convert_to_main_record_ids, build_id_to_airtable_record_id_map
from .copy_organizations import copy_organizations_to_main_base
from .copy_services import copy_services_to_main_base

DATA_IMPORT_SOURCE_ID = 'entities'  # 'source' value marking main-base rows that came from the Data-Import base
TABLES_TO_COPY = (
    settings.AIRTABLE_ORGANIZATION_TABLE,
    settings.AIRTABLE_BRANCH_TABLE,
    settings.AIRTABLE_SERVICE_TABLE,
)


def fetch_all_data_import_tables(data_import_base):
    fetched_tables = {}
    for table_name in TABLES_TO_COPY:
        table_rows = fetch_data_import_table_rows(data_import_base, table_name)
        flag_undecided_rows(data_import_base, table_name, table_rows)
        fetched_tables[table_name] = table_rows
    return fetched_tables


def copy_all_tables_to_main_base(data_import_base, source_id):
    logger.info('Copying data from %s', data_import_base)
    fetched_tables = fetch_all_data_import_tables(data_import_base)
    load_manual_fixes()

    updated_organizations = copy_organizations_to_main_base(
        fetched_tables[settings.AIRTABLE_ORGANIZATION_TABLE], source_id,
    )
    organizations_conversion = build_id_to_airtable_record_id_map(
        settings.AIRTABLE_BASE, settings.AIRTABLE_ORGANIZATION_TABLE, require_id=True,
    )
    updated_organizations = convert_to_main_record_ids(updated_organizations, organizations_conversion)
    updated_locations = build_id_to_airtable_record_id_map(settings.AIRTABLE_BASE, settings.AIRTABLE_LOCATION_TABLE)

    updated_branches = copy_branches_to_main_base(
        fetched_tables[settings.AIRTABLE_BRANCH_TABLE], source_id,
        updated_organizations, updated_locations,
    )
    branches_conversion = build_id_to_airtable_record_id_map(settings.AIRTABLE_BASE, settings.AIRTABLE_BRANCH_TABLE)
    updated_branches = convert_to_main_record_ids(updated_branches, branches_conversion)

    copy_services_to_main_base(
        fetched_tables[settings.AIRTABLE_SERVICE_TABLE], source_id,
        updated_organizations, updated_branches,
    )
    write_fix_statuses_to_airtable()


def copy_approved_data_from_data_import():
    logger.info('Copying data from the Data-Import base')
    copy_all_tables_to_main_base(settings.AIRTABLE_DATA_IMPORT_BASE, DATA_IMPORT_SOURCE_ID)
    logger.info('Finished copying data from the Data-Import base')
