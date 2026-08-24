import copy
import json
import math
import re
import types
from pathlib import Path

FIXTURES_DIRECTORY = Path(__file__).resolve().parent / 'fixtures'
# Fields built from Python sets in the old code have nondeterministic ordering,
# so joined strings and lists are compared order-insensitively (split on the join
# punctuation, stripped, as a sorted bag of parts).
MULTILINE_SPLIT_PATTERN = re.compile(r'[\n:,]')


def load_fixture_records(spec_name, fixture_file_name):
    fixture_path = FIXTURES_DIRECTORY / spec_name / fixture_file_name
    with open(fixture_path, encoding='utf-8') as fixture_file:
        return json.load(fixture_file)


def is_missing(value):
    # '' counts as missing: dataflows casts '' to None on output, and the Airtable
    # loaders skip both, so '' vs None is not a behavioral difference.
    return value is None or value == '' or (isinstance(value, float) and math.isnan(value))


def normalize_value(value):
    if is_missing(value):
        return None
    if isinstance(value, (list, set, tuple)):
        return sorted(str(normalize_value(item)) for item in value)
    if isinstance(value, str) and '\n' in value:
        return sorted(part.strip() for part in MULTILINE_SPLIT_PATTERN.split(value) if part.strip())
    return value


def comparable_from_records(records, table_fields):
    # 'id' is the record key itself — old operators exclude it from the data dict
    fields = [field for field in table_fields if field != 'id']
    return {
        record['id']: {field: normalize_value(record['data'].get(field)) for field in fields}
        for record in records
    }


def comparable_from_frame(frame, table_fields):
    fields = [field for field in table_fields if field != 'id']
    return {
        row['id']: {field: normalize_value(row.get(field)) for field in fields}
        for row in frame.to_dict(orient='records')
    }


def comparable_from_frames(frames, table_fields):
    combined = {}
    for frame in frames:
        combined.update(comparable_from_frame(frame, table_fields))
    return combined


def materialize_flow_records(fetch_data_flow):
    if isinstance(fetch_data_flow, (list, tuple)):
        return list(fetch_data_flow)
    import dataflows as DF
    return DF.Flow(fetch_data_flow).results()[0][0]


def make_airtable_updater_capture(captured_calls):
    def capture(table, source_id, table_fields, fetch_data_flow, update_data_flow, **kwargs):
        captured_calls[table] = {
            'table_fields': table_fields,
            'records': materialize_flow_records(fetch_data_flow),
        }
    return capture


def make_upsert_capture(captured_calls):
    def capture(df=None, table_name=None, base_id=None, airtable_key=None,
                batch_size=50, fields_to_update=None, fields_to_create=None):
        captured_calls[table_name] = {'frame': df.copy(), 'fields_to_update': fields_to_update}
        return 0
    return capture


def make_upsert_sequence_capture(captured_sequence):
    def capture(df=None, table_name=None, base_id=None, airtable_key=None,
                batch_size=50, fields_to_update=None, fields_to_create=None):
        captured_sequence.append({'table': table_name, 'frame': df.copy()})
        return 0
    return capture


def make_fake_get_airtable_table(tables_records):
    def get_fake_table(table_name, base_id):
        records = tables_records.get(table_name, [])
        return types.SimpleNamespace(all=lambda: copy.deepcopy(records))
    return get_fake_table


def noop_status_check(**kwargs):
    return 0


def union_fields(old_frame, new_frame):
    return sorted(set(old_frame.columns) | set(new_frame.columns))


def payload_from_records(records, table_fields):
    fields = [field for field in table_fields if field != 'id']
    return {
        record['id']: {field: record['data'].get(field) for field in fields}
        for record in records
    }


def payload_from_frame(frame, fields=None):
    if fields is None:
        fields = list(frame.columns)
    fields = [field for field in fields if field != 'id']
    return {
        row['id']: {field: row.get(field) for field in fields}
        for row in frame.to_dict(orient='records')
    }


def payload_from_frames(frames, fields=None):
    combined = {}
    for frame in frames:
        combined.update(payload_from_frame(frame, fields))
    return combined
