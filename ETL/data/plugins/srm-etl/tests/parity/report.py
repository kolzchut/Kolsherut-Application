import json
import math
from pathlib import Path

from tests.parity.parity_helpers import normalize_value

RESULTS_DIRECTORY = Path(__file__).resolve().parent / 'results'


def to_jsonable(value):
    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_jsonable(item) for item in value]
    if hasattr(value, 'item'):
        value = value.item()
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def compute_diff(old_payload, new_payload):
    diff = {}
    for record_id in sorted(set(old_payload) | set(new_payload), key=str):
        old_record = old_payload.get(record_id)
        new_record = new_payload.get(record_id)
        if old_record is None:
            diff[str(record_id)] = {'record_missing_in': 'old'}
            continue
        if new_record is None:
            diff[str(record_id)] = {'record_missing_in': 'new'}
            continue
        field_diffs = {
            field: {'old': to_jsonable(old_record.get(field)), 'new': to_jsonable(new_record.get(field))}
            for field in sorted(set(old_record) | set(new_record))
            if normalize_value(old_record.get(field)) != normalize_value(new_record.get(field))
        }
        if field_diffs:
            diff[str(record_id)] = field_diffs
    return diff


def write_json(file_path, payload):
    file_path.write_text(
        json.dumps(to_jsonable(payload), ensure_ascii=False, indent=2, default=str),
        encoding='utf-8')


def assert_parity_and_report(operator_name, table_label, old_payload, new_payload):
    """Save what old and new would load into Airtable plus their differences,
    then fail if any difference exists."""
    results_directory = RESULTS_DIRECTORY / operator_name
    results_directory.mkdir(parents=True, exist_ok=True)
    write_json(results_directory / f'{table_label}.old.json', old_payload)
    write_json(results_directory / f'{table_label}.new.json', new_payload)
    diff = compute_diff(old_payload, new_payload)
    write_json(results_directory / f'{table_label}.diff.json', diff)
    assert not diff, (
        f'{operator_name}/{table_label}: {len(diff)} record(s) differ between old and new - '
        f'see {results_directory / (table_label + ".diff.json")}')
