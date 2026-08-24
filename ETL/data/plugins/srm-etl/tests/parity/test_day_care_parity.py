import copy
import importlib

import pandas as pd

import engine.outputs as engine_outputs
import engine.run_spec as engine_run_spec
import operators.day_care as old_module
from extract import extract_data_from_airtable

# the package __init__ shadows same-named submodules with the imported functions
old_update_branch = importlib.import_module('operators.day_care.update_branch')
old_update_organization = importlib.import_module('operators.day_care.update_organization')
old_update_service = importlib.import_module('operators.day_care.update_service')
old_foreign_key_module = importlib.import_module(
    'operators.meser.utilities.get_foreign_key_by_field')
from load import airtable as load_airtable_module
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_fake_get_airtable_table,
    make_upsert_capture,
    noop_status_check,
    payload_from_frame,
    union_fields,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'day_care'


def patch_airtable_access(monkeypatch, airtable_data, org_lookup_frame):
    fake_get_table = make_fake_get_airtable_table(airtable_data['tables'])
    monkeypatch.setattr(old_foreign_key_module, 'get_airtable_table', fake_get_table)
    monkeypatch.setattr(load_airtable_module, 'get_airtable_table', fake_get_table)
    monkeypatch.setattr(old_module, 'load_airtable_as_dataframe',
                        lambda table_name, base_id: org_lookup_frame.copy())
    monkeypatch.setattr(extract_data_from_airtable, 'load_airtable_as_dataframe',
                        lambda table_name, base_id: org_lookup_frame.copy())


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(old_module, 'fetch_as_df',
                        lambda: pd.DataFrame(copy.deepcopy(records)))
    for old_load_module in (old_update_branch, old_update_organization, old_update_service):
        monkeypatch.setattr(old_load_module, 'trigger_status_check', noop_status_check)
        monkeypatch.setattr(old_load_module, 'update_if_exists_if_not_create',
                            make_upsert_capture(captured_calls))
    old_module.run()
    return captured_calls


def run_new_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(engine_run_spec, 'run_apis',
                        lambda apis: {'fetch': pd.DataFrame(copy.deepcopy(records))})
    monkeypatch.setattr(engine_outputs, 'trigger_status_check', noop_status_check)
    monkeypatch.setattr(engine_outputs, 'update_if_exists_if_not_create',
                        make_upsert_capture(captured_calls))
    engine_run_spec.run(SPEC_NAME)
    return captured_calls


def test_day_care_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'datastore_records.json')
    airtable_data = load_fixture_records(SPEC_NAME, 'airtable_data.json')
    org_lookup_frame = pd.DataFrame(airtable_data['organizations_lookup_frame'])

    patch_airtable_access(monkeypatch, airtable_data, org_lookup_frame)
    old_captured = run_old_pipeline(monkeypatch, records)
    new_captured = run_new_pipeline(monkeypatch, records)

    assert set(old_captured) == set(new_captured)
    for table_name, old_call in old_captured.items():
        new_call = new_captured[table_name]
        fields = union_fields(old_call['frame'], new_call['frame'])
        assert_parity_and_report(
            SPEC_NAME, table_name.lower(),
            payload_from_frame(old_call['frame'], fields),
            payload_from_frame(new_call['frame'], fields))
        assert new_call['fields_to_update'] == old_call['fields_to_update']
