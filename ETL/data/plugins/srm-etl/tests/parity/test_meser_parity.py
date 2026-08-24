import copy
import importlib

import pandas as pd

import engine.outputs as engine_outputs
import engine.run_spec as engine_run_spec
import operators.meser as old_module
from load import airtable as load_airtable_module
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_fake_get_airtable_table,
    make_upsert_sequence_capture,
    noop_status_check,
    payload_from_frame,
    union_fields,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'meser'
old_program_tables = importlib.import_module('operators.meser.program_enrichment.load_program_tables')
old_local_authorities = importlib.import_module('operators.meser.local_authorities')
old_update_modules = [
    importlib.import_module(f'operators.meser.update_{name}')
    for name in ('organization', 'branch', 'service')
]
old_foreign_key_module = importlib.import_module(
    'operators.meser.utilities.get_foreign_key_by_field')


def build_frames(data):
    return {
        'fetch': pd.DataFrame(copy.deepcopy(data['datagovil_records'])),
        'tags': pd.DataFrame(copy.deepcopy(data['tags'])),
        'program_texts': pd.DataFrame(copy.deepcopy(data['program_texts'])),
        'program_ids': pd.DataFrame(copy.deepcopy(data['program_ids'])),
    }


def route_drive_file(data):
    def download(drive_service, file_name):
        key = 'program_texts' if 'טקסטים' in file_name else 'program_ids'
        return pd.DataFrame(copy.deepcopy(data[key]))
    return download


def run_old_pipeline(monkeypatch, data):
    captured_sequence = []
    frames = build_frames(data)
    monkeypatch.setattr(old_module, 'datagovil_fetch_and_transform_to_dataframe',
                        lambda: frames['fetch'].copy())
    monkeypatch.setattr(old_module, 'load_airtable_as_dataframe',
                        lambda **kwargs: frames['tags'].copy())
    monkeypatch.setattr(old_program_tables, 'create_drive_service', lambda: None)
    monkeypatch.setattr(old_program_tables, 'download_xlsx_as_dataframe', route_drive_file(data))
    monkeypatch.setattr(old_foreign_key_module, 'get_airtable_table',
                        make_fake_get_airtable_table(data['tables']))
    monkeypatch.setattr(old_local_authorities, 'update_if_exists_if_not_create',
                        make_upsert_sequence_capture(captured_sequence))
    for update_module in old_update_modules:
        monkeypatch.setattr(update_module, 'trigger_status_check', noop_status_check)
        monkeypatch.setattr(update_module, 'update_if_exists_if_not_create',
                            make_upsert_sequence_capture(captured_sequence))
    old_module.run()
    return captured_sequence


def run_new_pipeline(monkeypatch, data):
    captured_sequence = []
    frames = build_frames(data)
    monkeypatch.setattr(engine_run_spec, 'run_apis', lambda apis: frames)
    monkeypatch.setattr(load_airtable_module, 'get_airtable_table',
                        make_fake_get_airtable_table(data['tables']))
    monkeypatch.setattr(engine_outputs, 'trigger_status_check', noop_status_check)
    monkeypatch.setattr(engine_outputs, 'update_if_exists_if_not_create',
                        make_upsert_sequence_capture(captured_sequence))
    engine_run_spec.run(SPEC_NAME)
    return captured_sequence


def test_meser_parity(monkeypatch):
    data = load_fixture_records(SPEC_NAME, 'meser_data.json')
    old_sequence = run_old_pipeline(monkeypatch, data)
    new_sequence = run_new_pipeline(monkeypatch, data)

    assert [call['table'] for call in new_sequence] == [call['table'] for call in old_sequence]
    for load_index, (old_call, new_call) in enumerate(zip(old_sequence, new_sequence), start=1):
        fields = union_fields(old_call['frame'], new_call['frame'])
        assert_parity_and_report(
            SPEC_NAME, f'{load_index}-{old_call["table"].lower()}',
            payload_from_frame(old_call['frame'], fields),
            payload_from_frame(new_call['frame'], fields))
