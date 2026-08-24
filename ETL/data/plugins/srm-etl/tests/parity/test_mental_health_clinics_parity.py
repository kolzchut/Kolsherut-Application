import copy
import types

import dataflows as DF
import pandas as pd

import operators.mental_health_clinics as old_module
from conf import settings
from engine.pipeline import build_outputs
from engine.spec_loader import load_spec
from tests.parity.parity_helpers import (
    load_fixture_records,
    payload_from_frame,
    payload_from_records,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'mental_health_clinics'
OUTPUT_TABLE_BY_NAME = {
    'organization': settings.AIRTABLE_ORGANIZATION_TABLE,
    'branch': settings.AIRTABLE_BRANCH_TABLE,
    'service': settings.AIRTABLE_SERVICE_TABLE,
}


def stub_stats():
    def filter_with_stat(stat, filter_func, passing=False, resources=None, report=None):
        return DF.filter_rows(filter_func, resources=resources)

    return types.SimpleNamespace(filter_with_stat=filter_with_stat)


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}

    def capture_airtable_updater(table, source_id, table_fields, fetched_records,
                                 update_flow, airtable_base=None):
        captured_calls[table] = {'table_fields': table_fields, 'records': list(fetched_records)}

    monkeypatch.setattr(old_module, 'fetch_datagovil_datastore',
                        lambda dataset, resource: iter(copy.deepcopy(records)))
    monkeypatch.setattr(old_module, 'airtable_updater', capture_airtable_updater)
    monkeypatch.setattr(old_module, 'Stats', stub_stats)
    old_module.run()
    return captured_calls


def run_new_pipeline(records):
    spec = load_spec(SPEC_NAME)
    fetched_frames = {'fetch': pd.DataFrame(copy.deepcopy(records))}
    return build_outputs(spec, fetched_frames)


def test_mental_health_clinics_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'datastore_records.json')
    old_captured = run_old_pipeline(monkeypatch, records)
    new_outputs = run_new_pipeline(records)
    for output_name, table_name in OUTPUT_TABLE_BY_NAME.items():
        captured_call = old_captured[table_name]
        assert_parity_and_report(
            SPEC_NAME, output_name,
            payload_from_records(captured_call['records'], captured_call['table_fields']),
            payload_from_frame(new_outputs[output_name], captured_call['table_fields']))
