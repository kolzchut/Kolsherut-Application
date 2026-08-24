import copy

import engine.fetchers.budgetkey_query as engine_budgetkey_fetcher
import engine.outputs as engine_outputs
import engine.run_spec as engine_run_spec
import operators.soproc as old_module
from conf import settings
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_airtable_updater_capture,
    make_upsert_capture,
    noop_status_check,
    payload_from_frame,
    payload_from_records,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'soproc'
TABLE_LABELS = {
    settings.AIRTABLE_ORGANIZATION_TABLE: 'organizations',
    settings.AIRTABLE_SERVICE_TABLE: 'services',
}


def make_budgetkey_router(budgetkey_data):
    def fetch(query):
        key = 'suppliers' if 'suppliers' in query else 'activities'
        return copy.deepcopy(budgetkey_data[key])
    return fetch


def run_old_pipeline(monkeypatch, budgetkey_data):
    captured_calls = {}
    monkeypatch.setattr(old_module, 'fetch_from_budgetkey', make_budgetkey_router(budgetkey_data))
    monkeypatch.setattr(old_module, 'airtable_updater', make_airtable_updater_capture(captured_calls))
    old_module.run()
    return captured_calls


def run_new_pipeline(monkeypatch, budgetkey_data):
    captured_calls = {}
    monkeypatch.setattr(engine_budgetkey_fetcher, 'fetch_from_budgetkey',
                        make_budgetkey_router(budgetkey_data))
    monkeypatch.setattr(engine_outputs, 'trigger_status_check', noop_status_check)
    monkeypatch.setattr(engine_outputs, 'update_if_exists_if_not_create',
                        make_upsert_capture(captured_calls))
    engine_run_spec.run(SPEC_NAME)
    return captured_calls


def test_soproc_parity(monkeypatch):
    budgetkey_data = load_fixture_records(SPEC_NAME, 'budgetkey_data.json')
    old_captured = run_old_pipeline(monkeypatch, budgetkey_data)
    new_captured = run_new_pipeline(monkeypatch, budgetkey_data)

    for table_name, table_label in TABLE_LABELS.items():
        old_call = old_captured[table_name]
        assert_parity_and_report(
            SPEC_NAME, table_label,
            payload_from_records(old_call['records'], old_call['table_fields']),
            payload_from_frame(new_captured[table_name]['frame'], old_call['table_fields']))
