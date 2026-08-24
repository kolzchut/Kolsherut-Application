import copy

import pandas as pd

import operators.revaha as old_module
from conf import settings
from engine.pipeline import build_outputs
from engine.spec_loader import load_spec
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_airtable_updater_capture,
    payload_from_frame,
    payload_from_records,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'revaha'


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(old_module, 'fetch_datagovil_datastore',
                        lambda dataset, resource: iter(copy.deepcopy(records)))
    monkeypatch.setattr(old_module, 'airtable_updater', make_airtable_updater_capture(captured_calls))
    old_module.run()
    return captured_calls


def old_branches_after_update_flow(branch_records):
    # The urls override runs in the old operator's UPDATE flow (after the join),
    # so apply that same old code to the captured fetch records before comparing.
    expanded_rows = [{'id': record['id'], **record['data']} for record in branch_records]
    return list(old_module.update_urls_from_db()(expanded_rows))


def test_revaha_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'datastore_records.json')
    old_captured = run_old_pipeline(monkeypatch, records)
    spec = load_spec(SPEC_NAME)
    new_outputs = build_outputs(spec, {'fetch': pd.DataFrame(copy.deepcopy(records))})

    branches_call = old_captured[settings.AIRTABLE_BRANCH_TABLE]
    old_branch_rows = old_branches_after_update_flow(branches_call['records'])
    assert_parity_and_report(
        SPEC_NAME, 'branches',
        payload_from_frame(pd.DataFrame(old_branch_rows), branches_call['table_fields']),
        payload_from_frame(new_outputs['branch'], branches_call['table_fields']))

    services_call = old_captured[settings.AIRTABLE_SERVICE_TABLE]
    assert_parity_and_report(
        SPEC_NAME, 'services',
        payload_from_records(services_call['records'], services_call['table_fields']),
        payload_from_frame(new_outputs['service'], services_call['table_fields']))
