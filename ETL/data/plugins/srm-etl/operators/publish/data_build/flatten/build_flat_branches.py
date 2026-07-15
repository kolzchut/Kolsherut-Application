"""One row per branch with its location and organization inlined (legacy flat_branches_flow)."""
from ...airtable.stats_collector import filter_rows_and_count_removed
from ..pull.field_normalizers import validate_address
from .merge_duplicate_branches import merge_duplicate_branches

BRANCHES_NO_LOCATION_STAT = 'Processing: Branches: No Location'
BRANCHES_NO_ORGANIZATION_STAT = 'Processing: Branches: No Organization'
LOCATION_JOINED_FIELDS = ('geometry', 'address', 'resolved_city', 'location_accurate', 'national_service')
ADDRESS_CANDIDATE_FIELDS = ('address', 'orig_address', 'resolved_city')
BRANCH_FIELD_RENAMES = {
    'key': 'branch_key', 'id': 'branch_id', 'source': 'branch_source', 'name': 'branch_name',
    'operating_unit': 'branch_operating_unit', 'description': 'branch_description',
    'urls': 'branch_urls', 'phone_numbers': 'branch_phone_numbers',
    'email_address': 'branch_email_address', 'address': 'branch_address',
    'orig_address': 'branch_orig_address', 'resolved_city': 'branch_city',
    'geometry': 'branch_geometry', 'location_accurate': 'branch_location_accurate',
    'situations': 'branch_situations', 'last_modified': 'branch_last_modified',
}
ORGANIZATION_JOINED_FIELDS = {
    'organization_key': 'key', 'organization_id': 'id', 'organization_name': 'name',
    'organization_short_name': 'short_name', 'organization_description': 'description',
    'organization_purpose': 'purpose', 'organization_kind': 'kind', 'organization_urls': 'urls',
    'organization_phone_numbers': 'phone_numbers', 'organization_email_address': 'email_address',
    'organization_situations': 'situations',
}
FLAT_BRANCH_FIELDS = tuple(BRANCH_FIELD_RENAMES.values()) + tuple(ORGANIZATION_JOINED_FIELDS.keys()) + ('national_service',)


def select_address(row):
    for field_name in ADDRESS_CANDIDATE_FIELDS:
        if validate_address(row.get(field_name)):
            return row[field_name]
    return None


def join_location_onto_branch(row, locations_by_key):
    location = locations_by_key.get(row['location'][0], {})
    joined = {**row, **{name: location.get(name) for name in LOCATION_JOINED_FIELDS}}
    return {**joined, 'address': select_address(joined)}


def join_organization_onto_branch(row, organizations_by_key):
    organization = organizations_by_key.get(row['organization_key'])
    if organization is None:
        return None
    return {
        **row,
        **{target: organization.get(source) for target, source in ORGANIZATION_JOINED_FIELDS.items()},
    }


def rename_and_select_branch_fields(row):
    renamed = {new_name: row.get(old_name) for old_name, new_name in BRANCH_FIELD_RENAMES.items()}
    renamed.update({name: row.get(name) for name in row if name in FLAT_BRANCH_FIELDS})
    return {name: renamed.get(name) for name in FLAT_BRANCH_FIELDS}


def build_flat_branches(source_tables):
    """Return (flat branch rows, original branch_key -> merged branch_key mapping)."""
    locations_by_key = {location['key']: location for location in source_tables['locations']}
    organizations_by_key = {organization['key']: organization for organization in source_tables['organizations']}
    rows = [dict(branch, orig_address=branch.get('address')) for branch in source_tables['branches']]
    rows = filter_rows_and_count_removed(
        BRANCHES_NO_LOCATION_STAT, rows,
        lambda row: bool(row.get('location')) and len(row['location']) > 0,
    )
    rows = [join_location_onto_branch(row, locations_by_key) for row in rows]
    rows = [{**row, 'organization_key': (row.get('organization') or [None])[0]} for row in rows]
    rows = filter_rows_and_count_removed(
        BRANCHES_NO_ORGANIZATION_STAT, rows,
        lambda row: row['organization_key'] is not None,
    )
    rows = [joined for row in rows if (joined := join_organization_onto_branch(row, organizations_by_key))]
    rows = [rename_and_select_branch_fields(row) for row in rows]
    return merge_duplicate_branches(rows)
