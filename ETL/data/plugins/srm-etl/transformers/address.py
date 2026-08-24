from openlocationcode import openlocationcode as olc
from pyproj import Transformer

from transformers.values import none_if_missing, normalize_scalar

WGS84_CRS = 'EPSG:4326'
DEFAULT_PLUSCODE_PRECISION = 11


def address_cascade(frame, params, context):
    def compose(row):
        role_values = {
            role: normalize_scalar(row.get(column)) or ''
            for role, column in params['fields'].items()
        }
        for case in params['cases']:
            if all(role_values[role] for role in case.get('require', [])):
                return case['format'].format(**role_values) or None
        return None

    return frame.apply(compose, axis=1)


def pluscode_location(frame, params, context):
    from_crs = params.get('from_crs')
    transformer = Transformer.from_crs(from_crs, WGS84_CRS, always_xy=True) if from_crs else None
    precision = params.get('precision', DEFAULT_PLUSCODE_PRECISION)

    def locate(row):
        latitude = none_if_missing(row.get(params['lat_field']))
        longitude = none_if_missing(row.get(params['lon_field']))
        if latitude and longitude:
            if transformer:
                longitude, latitude = transformer.transform(int(longitude), int(latitude))
            return olc.encode(latitude, longitude, precision)
        return none_if_missing(row.get(params['fallback_field']))

    return frame.apply(locate, axis=1)
