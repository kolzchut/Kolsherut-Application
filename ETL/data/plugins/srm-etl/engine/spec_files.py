import json

import pandas as pd

from transformers.values import normalize_scalar


def read_data_file(file_path, file_reference):
    if file_path.suffix == '.csv':
        dtype = str if file_reference.get('dtype') == 'str' else None
        return pd.read_csv(file_path, dtype=dtype).to_dict(orient='records')
    if file_path.suffix == '.json':
        with open(file_path, encoding='utf-8') as data_file:
            return json.load(data_file)
    raise ValueError(f'Unsupported spec data file type: {file_path}')


def key_records_by_column(records, key_column):
    return {
        str(normalize_scalar(record[key_column])): {
            column: value for column, value in record.items() if column != key_column
        }
        for record in records
    }


def load_data_file(specs_directory, file_reference):
    records = read_data_file(specs_directory / file_reference['file'], file_reference)
    key_column = file_reference.get('key')
    return key_records_by_column(records, key_column) if key_column else records


def resolve_file_references(spec, specs_directory):
    for block_name in ('lookups', 'static_data'):
        block = spec.get(block_name) or {}
        for entry_name, entry_value in block.items():
            if isinstance(entry_value, dict) and 'file' in entry_value:
                block[entry_name] = load_data_file(specs_directory, entry_value)
    return spec
