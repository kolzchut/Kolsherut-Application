from app.services.service_hierarchy.create_branch_from_card import create_branch_from_card


def find_organization(service: dict, organization_id: str) -> dict | None:
    for organization in service['organizations']:
        if organization['id'] == organization_id:
            return organization
    return None


def add_branch_to_service(service: dict, branch_source: dict) -> None:
    branch = create_branch_from_card(branch_source)
    organization = find_organization(service, branch_source.get('organization_id'))
    if organization is None:
        service['organizations'].append({
            'id': branch_source.get('organization_id'),
            'name': branch_source.get('organization_name'),
            'branches': [branch],
        })
        return
    if not any(existing['id'] == branch['id'] for existing in organization['branches']):
        organization['branches'].append(branch)
