def sort_organizations_by_branch_count(service: dict) -> dict:
    sorted_organizations = sorted(
        service['organizations'], key=lambda organization: len(organization['branches']), reverse=True
    )
    return {**service, 'organizations': sorted_organizations}
