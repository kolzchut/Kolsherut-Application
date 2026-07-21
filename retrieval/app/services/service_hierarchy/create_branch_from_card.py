def create_branch_from_card(branch_source: dict) -> dict:
    return {
        'id': branch_source.get('card_id'),
        'name': branch_source.get('branch_name'),
        'address': branch_source.get('branch_address'),
        'address_parts': branch_source.get('address_parts'),
        'branch_operating_unit': branch_source.get('branch_operating_unit'),
        'isNational': branch_source.get('national_service'),
        'isAccurate': branch_source.get('branch_location_accurate'),
        'geometry': branch_source.get('branch_geometry'),
        'responses': branch_source.get('responses') or [],
        'situations': branch_source.get('situations') or [],
    }
