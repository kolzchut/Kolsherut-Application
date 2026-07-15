"""Explode services x branches (legacy flat_services_flow).

Each service is unwound per linked organization, collects the organization's
branches (soproc-filtered), merges them with its direct branch links (remapped
through the dedup branch mapping), and yields one row per (service, branch_key).
"""
SOPROC_SERVICE_PREFIX = 'soproc:'
SOPROC_ORG_BRANCHES_LIMIT = 5
NATIONAL_BRANCH_ID_PREFIX = 'national'
SERVICE_FIELD_RENAMES = {
    'key': 'service_key', 'id': 'service_id', 'name': 'service_name',
    'description': 'service_description', 'details': 'service_details',
    'payment_required': 'service_payment_required', 'payment_details': 'service_payment_details',
    'urls': 'service_urls', 'phone_numbers': 'service_phone_numbers',
    'email_address': 'service_email_address', 'implements': 'service_implements',
    'situation_ids': 'service_situations', 'response_ids': 'service_responses',
    'boost': 'service_boost', 'last_modified': 'service_last_modified',
}
FLAT_SERVICE_FIELDS = (
    'service_key', 'service_id', 'service_name', 'service_description', 'service_details',
    'service_payment_required', 'service_payment_details', 'service_urls', 'service_phone_numbers',
    'service_email_address', 'service_situations', 'service_responses', 'service_implements',
    'data_sources', 'branch_key', 'service_boost', 'service_last_modified',
)


def group_branch_keys_by_organization(flat_branches):
    grouped = {}
    for branch in flat_branches:
        grouped.setdefault(branch['organization_key'], []).append(branch['branch_key'])
    return grouped


def filter_soproc_branches(branch_keys, service_id, branch_id_by_key, non_national_branch_keys):
    """soproc services with many org branches keep only 'national*' branches when any exist;
    otherwise (and for all other services) only non-national branches are kept."""
    branch_keys = branch_keys or []
    is_soproc = isinstance(service_id, str) and service_id.startswith(SOPROC_SERVICE_PREFIX)
    if is_soproc and len(branch_keys) > SOPROC_ORG_BRANCHES_LIMIT:
        national_id_branches = [
            branch_key for branch_key in branch_keys
            if str(branch_id_by_key.get(branch_key, '')).lower().startswith(NATIONAL_BRANCH_ID_PREFIX)
        ]
        if national_id_branches:
            return national_id_branches
    return [branch_key for branch_key in branch_keys if branch_key in non_national_branch_keys]


def merge_service_branch_keys(service, organization_key, branch_context):
    direct_branches = sorted(set(filter(None, (
        branch_context['branch_mapping'].get(branch_key)
        for branch_key in (service.get('branches') or [])
    ))))
    organization_branches = filter_soproc_branches(
        branch_context['branches_by_organization'].get(organization_key),
        service.get('id'),
        branch_context['branch_id_by_key'],
        branch_context['non_national_branch_keys'],
    )
    return sorted(set(direct_branches) | set(organization_branches))


def rename_and_select_service_fields(service, branch_key):
    row = {new_name: service.get(old_name) for old_name, new_name in SERVICE_FIELD_RENAMES.items()}
    row['data_sources'] = service.get('data_sources')
    row['branch_key'] = branch_key
    return {name: row.get(name) for name in FLAT_SERVICE_FIELDS}


def unwind_service_organization_keys(service):
    """Replica of the legacy unwind semantics: None -> one row with organization_key=None,
    an empty list -> no rows at all (the service vanishes)."""
    organizations = service.get('organizations')
    return [None] if organizations is None else organizations


def build_flat_services(snapshot, flat_branches, branch_mapping):
    branch_context = {
        'branch_mapping': branch_mapping,
        'branch_id_by_key': {branch['branch_key']: branch['branch_id'] for branch in flat_branches},
        'non_national_branch_keys': {
            branch['branch_key'] for branch in flat_branches if not branch.get('national_service')
        },
        'branches_by_organization': group_branch_keys_by_organization(flat_branches),
    }
    rows = []
    for service in snapshot['services']:
        for organization_key in unwind_service_organization_keys(service):
            for branch_key in merge_service_branch_keys(service, organization_key, branch_context):
                rows.append(rename_and_select_service_fields(service, branch_key))
    return rows
