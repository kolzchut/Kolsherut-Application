"""Load a legacy dataflows datapackage (datapackage.json + CSV) without dataflows.

CSV cells are coerced back per the schema field types so the legacy baseline
compares cleanly against in-memory rows: arrays/objects/geopoints are JSON
parsed, numbers become floats, booleans become bools, '' becomes None.
"""
import csv
import json
import os

JSON_TYPED_FIELDS = ('array', 'object', 'geopoint')


def coerce_cell(value, field_type):
    if value == '' or value is None:
        return None
    if field_type in JSON_TYPED_FIELDS:
        return json.loads(value)
    if field_type == 'number':
        return float(value)
    if field_type == 'integer':
        return int(value)
    if field_type == 'boolean':
        return value.lower() == 'true'
    return value


def load_datapackage_resource(datapackage_dir, resource_name=None):
    with open(os.path.join(datapackage_dir, 'datapackage.json'), 'r', encoding='utf-8') as descriptor_file:
        descriptor = json.load(descriptor_file)
    resources = descriptor['resources']
    resource = next(
        (res for res in resources if res['name'] == resource_name), resources[0],
    ) if resource_name else resources[0]
    field_types = {field['name']: field['type'] for field in resource['schema']['fields']}
    csv_path = os.path.join(datapackage_dir, resource['path'])
    with open(csv_path, 'r', encoding='utf-8', newline='') as csv_file:
        return [
            {name: coerce_cell(value, field_types.get(name, 'string')) for name, value in row.items()}
            for row in csv.DictReader(csv_file)
        ]
