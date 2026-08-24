import copy

import pandas as pd

import operators.tipat as old_module
from conf import settings
from engine.pipeline import build_outputs
from engine.spec_loader import load_spec
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_airtable_updater_capture,
    payload_from_frames,
    payload_from_records,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'tipat'


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(old_module.DF, 'load', lambda *args, **kwargs: copy.deepcopy(records))
    monkeypatch.setattr(old_module, 'airtable_updater', make_airtable_updater_capture(captured_calls))
    old_module.run()
    return captured_calls


def test_tipat_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'api_records.json')
    old_captured = run_old_pipeline(monkeypatch, records)
    spec = load_spec(SPEC_NAME)
    new_outputs = build_outputs(spec, {'fetch': pd.DataFrame(copy.deepcopy(records))})

    branches_call = old_captured[settings.AIRTABLE_BRANCH_TABLE]
    assert_parity_and_report(
        SPEC_NAME, 'branches',
        payload_from_records(branches_call['records'], branches_call['table_fields']),
        payload_from_frames([new_outputs['branch'], new_outputs['national_branch']],
                            branches_call['table_fields']))

    services_call = old_captured[settings.AIRTABLE_SERVICE_TABLE]
    assert_parity_and_report(
        SPEC_NAME, 'services',
        payload_from_records(services_call['records'], services_call['table_fields']),
        payload_from_frames([new_outputs['service']], services_call['table_fields']))
