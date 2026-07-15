"""Geometry validation and geo presentation fields (legacy helpers + card_data_flow)."""
ISRAEL_LON_RANGE = (33, 37)
ISRAEL_LAT_RANGE = (29.3, 33.3)
NATIONAL_SERVICE_POINT_ID = 'national_service'
NATIONAL_SERVICE_LABEL = 'ארצי'
POINT_ID_COORDINATE_FORMAT = '{:08.5f}'


def validate_geometry(geometry):
    if geometry and len(geometry) == 2:
        lon_in_range = ISRAEL_LON_RANGE[0] < geometry[0] < ISRAEL_LON_RANGE[1]
        lat_in_range = ISRAEL_LAT_RANGE[0] < geometry[1] < ISRAEL_LAT_RANGE[1]
        return lon_in_range and lat_in_range
    return False


def calc_point_id(geometry):
    """Geometry serialized to a fixed-width string; groups cards at the same map point."""
    return ''.join(POINT_ID_COORDINATE_FORMAT.format(coordinate) for coordinate in geometry).replace('.', '')


def is_card_location_valid(card):
    return validate_geometry(card['branch_geometry']) or bool(card['national_service'])


def add_geo_fields(card):
    national = card['national_service']
    geometry = card['branch_geometry']
    return {
        **card,
        'point_id': NATIONAL_SERVICE_POINT_ID if national else calc_point_id(geometry),
        'national_service_details': NATIONAL_SERVICE_LABEL if national else None,
        'coords': '[{},{}]'.format(*geometry) if geometry else None,
    }
