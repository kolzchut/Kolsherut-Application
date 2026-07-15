"""Join each (service, branch_key) row with its flat branch row and deduplicate
on (service_id, branch_id) - first occurrence wins (legacy flat_table_flow).

branch_last_modified never reaches the flat table: the legacy join did not copy
it and the legacy select silently ignored the missing name, so cards never
carry it - preserved here on purpose.
"""
BRANCH_JOINED_FIELDS = (
    'branch_id', 'branch_name', 'branch_operating_unit', 'branch_description', 'branch_urls',
    'branch_phone_numbers', 'branch_email_address', 'branch_geometry', 'branch_location_accurate',
    'branch_address', 'branch_orig_address', 'branch_situations', 'branch_city',
    'organization_key', 'organization_id', 'organization_name', 'organization_short_name',
    'organization_description', 'organization_purpose', 'organization_kind', 'organization_urls',
    'organization_phone_numbers', 'organization_email_address', 'organization_branch_count',
    'organization_situations', 'national_service',
)
FLAT_TABLE_FIELDS = (
    'service_key', 'organization_key', 'branch_key',
    'service_id', 'service_name', 'service_description', 'service_details',
    'service_payment_required', 'service_payment_details', 'service_urls',
    'service_phone_numbers', 'service_email_address', 'service_implements',
    'service_situations', 'service_responses', 'service_boost', 'data_sources',
    'organization_id', 'organization_name', 'organization_short_name',
    'organization_description', 'organization_purpose', 'organization_kind',
    'organization_urls', 'organization_phone_numbers', 'organization_email_address',
    'organization_branch_count', 'organization_situations',
    'branch_id', 'branch_name', 'branch_operating_unit', 'branch_description',
    'branch_urls', 'branch_phone_numbers', 'branch_email_address', 'branch_address',
    'branch_orig_address', 'branch_city', 'branch_geometry', 'branch_location_accurate',
    'branch_situations', 'service_last_modified', 'national_service',
)


def join_branch_onto_service_row(service_row, branch):
    joined = dict(service_row)
    for field_name in BRANCH_JOINED_FIELDS:
        joined[field_name] = branch.get(field_name)
    return {name: joined.get(name) for name in FLAT_TABLE_FIELDS}


def build_flat_table(flat_services, flat_branches):
    branches_by_key = {branch['branch_key']: branch for branch in flat_branches}
    rows = []
    seen_pairs = set()
    for service_row in flat_services:
        branch = branches_by_key.get(service_row['branch_key'])
        if branch is None:
            continue
        row = join_branch_onto_service_row(service_row, branch)
        pair = (row['service_id'], row['branch_id'])
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        rows.append(row)
    return rows
