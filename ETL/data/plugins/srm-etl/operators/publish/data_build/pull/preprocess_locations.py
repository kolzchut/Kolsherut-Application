"""Preprocess of the Locations table (legacy preprocess_locations). No ACTIVE filter."""
from operators.publish.shared.location_accuracy import ACCURATE_TYPES

from .preprocess_common import drop_dummy_rows, rename_record_id_to_key, select_row_fields

LOCATIONS_NO_LOCATION_STAT = 'Processing: Locations: No Location'
LOCATIONS_NO_LAT_STAT = 'Processing: Locations: No Lat'
LOCATIONS_NO_LON_STAT = 'Processing: Locations: No Lon'
NATIONAL_SERVICE_ACCURACY = 'NATIONAL_SERVICE'
LOCATION_FIELDS = (
    'key', 'id', 'status', 'provider', 'accuracy', 'alternate_address',
    'resolved_lat', 'resolved_lon', 'resolved_address', 'resolved_city', 'fixed_lat', 'fixed_lon',
)
COORDINATE_FIELD_GROUPS = (('resolved_lat', 'resolved_lon'), ('fixed_lat', 'fixed_lon'), ('national_service',))


def has_any_location(row):
    return any(
        all(row.get(field_name) for field_name in field_group)
        for field_group in COORDINATE_FIELD_GROUPS
    )


def add_location_fields(row):
    lat = row.get('fixed_lat') or row.get('resolved_lat')
    lon = row.get('fixed_lon') or row.get('resolved_lon')
    return {
        **row,
        'location_accurate': bool(
            (row.get('accuracy') in ACCURATE_TYPES) or all((row.get('fixed_lat'), row.get('fixed_lon')))
        ),
        'lat': lat,
        'lon': lon,
        'geometry': [lon, lat] if not row['national_service'] else None,
        'address': row.get('resolved_address') or row['id'],
    }


def preprocess_locations(raw_rows, stats):
    rows = drop_dummy_rows(raw_rows)
    rows = rename_record_id_to_key(rows)
    rows = [select_row_fields(row, LOCATION_FIELDS) for row in rows]
    rows = [
        {**row, 'national_service': row.get('accuracy') == NATIONAL_SERVICE_ACCURACY}
        for row in rows
    ]
    rows = stats.filter_rows_with_stat(LOCATIONS_NO_LOCATION_STAT, rows, has_any_location)
    rows = stats.filter_rows_with_stat(
        LOCATIONS_NO_LAT_STAT, rows,
        lambda row: any(row[field] for field in ('fixed_lat', 'resolved_lat', 'national_service')),
    )
    rows = stats.filter_rows_with_stat(
        LOCATIONS_NO_LON_STAT, rows,
        lambda row: any(row[field] for field in ('fixed_lon', 'resolved_lon', 'national_service')),
    )
    return [add_location_fields(row) for row in rows]
