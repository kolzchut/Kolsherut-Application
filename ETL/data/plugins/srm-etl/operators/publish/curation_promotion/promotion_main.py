"""Stage 1 - promote the Data-Import (curation) base into the main base
(legacy from_curation.py). Runs BEFORE the data build pull so the build sees
promoted data. Disk snapshots are replaced by in-memory lists.
"""
from conf import settings
from srm_tools.logger import logger

from ..airtable.manual_fixes import ManualFixes
from .branches_promotion import promote_branches
from .curation_snapshot import fetch_curation_table, flag_undecided_rows
from .link_remapping import convert_to_main_record_ids, load_logical_to_record_id
from .organizations_promotion import promote_organizations
from .services_promotion import promote_services

ENTITIES_SOURCE_ID = 'entities'
PROMOTED_TABLES = (
    settings.AIRTABLE_ORGANIZATION_TABLE,
    settings.AIRTABLE_BRANCH_TABLE,
    settings.AIRTABLE_SERVICE_TABLE,
)


def snapshot_curation_tables(curation_base):
    snapshots = {}
    for table_name in PROMOTED_TABLES:
        snapshot_rows = fetch_curation_table(curation_base, table_name)
        flag_undecided_rows(curation_base, table_name, snapshot_rows)
        snapshots[table_name] = snapshot_rows
    return snapshots


def copy_from_curation_base(curation_base, source_id, stats):
    logger.info('Copying data from %s', curation_base)
    snapshots = snapshot_curation_tables(curation_base)
    manual_fixes = ManualFixes()

    updated_organizations = promote_organizations(
        snapshots[settings.AIRTABLE_ORGANIZATION_TABLE], source_id, manual_fixes, stats,
    )
    organizations_conversion = load_logical_to_record_id(
        settings.AIRTABLE_BASE, settings.AIRTABLE_ORGANIZATION_TABLE, require_id=True,
    )
    updated_organizations = convert_to_main_record_ids(updated_organizations, organizations_conversion)
    updated_locations = load_logical_to_record_id(settings.AIRTABLE_BASE, settings.AIRTABLE_LOCATION_TABLE)

    updated_branches = promote_branches(
        snapshots[settings.AIRTABLE_BRANCH_TABLE], source_id, manual_fixes, stats,
        updated_organizations, updated_locations,
    )
    branches_conversion = load_logical_to_record_id(settings.AIRTABLE_BASE, settings.AIRTABLE_BRANCH_TABLE)
    updated_branches = convert_to_main_record_ids(updated_branches, branches_conversion)

    promote_services(
        snapshots[settings.AIRTABLE_SERVICE_TABLE], source_id, manual_fixes, stats,
        updated_organizations, updated_branches,
    )
    manual_fixes.finalize()


def promote_curation_data(stats):
    logger.info('Copying data from curation tables')
    copy_from_curation_base(settings.AIRTABLE_DATA_IMPORT_BASE, ENTITIES_SOURCE_ID, stats)
    logger.info('Finished Copying data from curation tables')
