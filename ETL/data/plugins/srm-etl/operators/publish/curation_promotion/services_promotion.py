"""Promote curated Services into the main base (legacy from_curation, services block)."""
from conf import settings

from ..airtable.airtable_sync import sync_table_rows
from .curation_snapshot import CURATION_TABLE_FIELDS
from .link_remapping import build_fetched_row, remap_link_items
from .promotion_filters import (
    SERVICES_INACTIVE_STAT, SERVICES_NO_VALID_LINKS_STAT, SERVICES_REJECTED_STAT,
    filter_active_and_decided,
)


def promote_services(snapshot_rows, source_id, manual_fixes, stats, updated_organizations, updated_branches):
    table_fields = CURATION_TABLE_FIELDS[settings.AIRTABLE_SERVICE_TABLE]
    rows = filter_active_and_decided(snapshot_rows, stats, SERVICES_INACTIVE_STAT, SERVICES_REJECTED_STAT)
    rows = [manual_fixes.apply_to_row(row) for row in rows]
    rows = [remap_link_items(row, updated_organizations, ('organizations',)) for row in rows]
    rows = [remap_link_items(row, updated_branches, ('branches',)) for row in rows]
    rows = stats.filter_rows_with_stat(
        SERVICES_NO_VALID_LINKS_STAT, rows,
        lambda row: len(row['organizations'] or []) > 0 or len(row['branches'] or []) > 0,
    )
    fetched_rows = [build_fetched_row(row, table_fields) for row in rows]
    sync_table_rows(settings.AIRTABLE_SERVICE_TABLE, source_id, table_fields, fetched_rows)
