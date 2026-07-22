def create_service_from_card(service_source: dict) -> dict:
    return {
        'id': service_source.get('service_id'),
        'service_name': service_source.get('service_name'),
        'service_description': service_source.get('service_description'),
        'responses': service_source.get('responses') or [],
        'situations': service_source.get('situations') or [],
        'organizations': [],
        'service_boost': service_source.get('service_boost') or 0,
        'score': service_source.get('score') or 1,
        'organization_phone_numbers': service_source.get('organization_phone_numbers') or [],
        'service_phone_numbers': service_source.get('service_phone_numbers') or [],
        'organization_kind': service_source.get('organization_kind') or '',
    }
