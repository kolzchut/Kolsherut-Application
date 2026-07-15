"""Promote curated Organizations into the main base (legacy from_curation, orgs block)."""
from conf import settings

from ..airtable.airtable_client import RECORD_ID_FIELD
from ..airtable.airtable_sync import sync_table_rows
from .curation_snapshot import CURATION_TABLE_FIELDS
from .link_remapping import build_fetched_row
from .promotion_filters import (
    ORGANIZATIONS_INACTIVE_STAT, ORGANIZATIONS_NO_SERVICES_STAT, ORGANIZATIONS_REJECTED_STAT,
    filter_active_and_decided, filter_rows_with_any_link,
)

ORGANIZATION_LINK_FIELDS = ('services', 'branch_services')


def promote_organizations(snapshot_rows, source_id, manual_fixes, stats):
    """Returns {curation record id: logical organization id} for the promoted rows."""
    table_fields = CURATION_TABLE_FIELDS[settings.AIRTABLE_ORGANIZATION_TABLE]
    rows = filter_active_and_decided(snapshot_rows, stats, ORGANIZATIONS_INACTIVE_STAT, ORGANIZATIONS_REJECTED_STAT)
    rows = filter_rows_with_any_link(rows, stats, ORGANIZATIONS_NO_SERVICES_STAT, ORGANIZATION_LINK_FIELDS)
    rows = [manual_fixes.apply_to_row(row) for row in rows]
    updated_organizations = {row[RECORD_ID_FIELD]: row['id'] for row in rows}
    fetched_rows = [build_fetched_row(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_ORGANIZATION_TABLE, source_id, table_fields, fetched_rows)
    return updated_organizations
