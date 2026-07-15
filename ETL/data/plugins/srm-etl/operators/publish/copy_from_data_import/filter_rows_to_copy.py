"""Status/decision/link filters deciding which Data-Import rows get copied.

The stat names replicate the legacy ones exactly, including the trailing
space on the Inactive counters - they are keys in the Stats Airtable table.

Unlike legacy from_curation, these filters (and the manual fixes) apply ONLY
to the rows fetched from the Data-Import base - never to the main-base 'current'
table (README deliberate change #8; the legacy behavior was a duplicate-creating bug).
"""
from ..airtable.stats_collector import filter_rows_and_count_removed

ORGANIZATIONS_INACTIVE_STAT = 'Data Import: Organizations: Inactive '
ORGANIZATIONS_REJECTED_STAT = 'Data Import: Organizations: Rejected/Suspended'
ORGANIZATIONS_NO_SERVICES_STAT = 'Data Import: Organizations: No Services/Branch services'
BRANCHES_INACTIVE_STAT = 'Data Import: Branches: Inactive '
BRANCHES_REJECTED_STAT = 'Data Import: Branches: Rejected/Suspended'
BRANCHES_NO_SERVICES_STAT = 'Data Import: Branches: No Services/Org services'
BRANCHES_NO_VALID_ORGANIZATION_STAT = 'Data Import: Branches: No Valid Organization'
SERVICES_INACTIVE_STAT = 'Data Import: Services: Inactive '
SERVICES_REJECTED_STAT = 'Data Import: Services: Rejected/Suspended'
SERVICES_NO_VALID_LINKS_STAT = 'Data Import: Services: No Valid Organization/Branch'
ACTIVE_STATUS = 'ACTIVE'
REJECTED_DECISIONS = ('Rejected', 'Suspended')


def filter_active_and_decided(rows, inactive_stat_name, rejected_stat_name):
    rows = filter_rows_and_count_removed(
        inactive_stat_name, rows, lambda row: row.get('status') == ACTIVE_STATUS,
    )
    return filter_rows_and_count_removed(
        rejected_stat_name, rows, lambda row: row.get('decision') not in REJECTED_DECISIONS,
    )


def filter_rows_with_any_link(rows, stat_name, link_field_names):
    return filter_rows_and_count_removed(
        stat_name, rows,
        lambda row: any(row.get(field_name) for field_name in link_field_names),
    )
