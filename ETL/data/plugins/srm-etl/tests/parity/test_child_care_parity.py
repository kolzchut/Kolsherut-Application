import copy
import importlib

import pandas as pd

import engine.outputs as engine_outputs
import engine.run_spec as engine_run_spec
import operators.child_care as old_module

# the package __init__ shadows same-named submodules with the imported functions
old_update_service = importlib.import_module('operators.child_care.update_service')
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_upsert_capture,
    noop_status_check,
    payload_from_frame,
    union_fields,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'child_care'


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(old_module, 'fetch_as_df',
                        lambda: pd.DataFrame(copy.deepcopy(records)))
    monkeypatch.setattr(old_update_service, 'trigger_status_check', noop_status_check)
    monkeypatch.setattr(old_update_service, 'update_if_exists_if_not_create',
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


def test_child_care_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'html_table_records.json')
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
