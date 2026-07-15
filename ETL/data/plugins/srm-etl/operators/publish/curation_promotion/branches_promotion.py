"""Promote curated Branches into the main base (legacy from_curation, branches block)."""
from conf import settings

from ..airtable.airtable_client import RECORD_ID_FIELD
from ..airtable.airtable_sync import sync_table_rows
from .curation_snapshot import CURATION_TABLE_FIELDS
from .link_remapping import build_fetched_row, remap_link_items
from .promotion_filters import (
    BRANCHES_INACTIVE_STAT, BRANCHES_NO_SERVICES_STAT, BRANCHES_NO_VALID_ORGANIZATION_STAT,
    BRANCHES_REJECTED_STAT, filter_active_and_decided, filter_rows_with_any_link,
)

BRANCH_LINK_FIELDS = ('services', 'org_services')


def remap_branch_location(row, updated_locations):
    """The curation location is a plain location id string; it becomes a one-item
    array remapped to the main-base record id (unmapped ids kept as-is)."""
    location = row.get('location')
    return {**row, 'location': [updated_locations.get(location, location)]}


def promote_branches(snapshot_rows, source_id, manual_fixes, stats, updated_organizations, updated_locations):
    """Returns {curation record id: logical branch id} for the promoted rows."""
    table_fields = CURATION_TABLE_FIELDS[settings.AIRTABLE_BRANCH_TABLE]
    rows = filter_active_and_decided(snapshot_rows, stats, BRANCHES_INACTIVE_STAT, BRANCHES_REJECTED_STAT)
    rows = filter_rows_with_any_link(rows, stats, BRANCHES_NO_SERVICES_STAT, BRANCH_LINK_FIELDS)
    rows = [manual_fixes.apply_to_row(row) for row in rows]
    rows = [remap_branch_location(row, updated_locations) for row in rows]
    rows = [remap_link_items(row, updated_organizations, ('organization',)) for row in rows]
    rows = stats.filter_rows_with_stat(
        BRANCHES_NO_VALID_ORGANIZATION_STAT, rows,
        lambda row: len(row['organization'] or []) > 0,
    )
    updated_branches = {row[RECORD_ID_FIELD]: row['id'] for row in rows}
    fetched_rows = [build_fetched_row(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_BRANCH_TABLE, source_id, table_fields, fetched_rows)
    return updated_branches
