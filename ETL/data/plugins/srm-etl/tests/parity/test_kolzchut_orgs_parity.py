import copy
import types

import pandas as pd

import operators.kolzchut_orgs as old_module
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

SPEC_NAME = 'kolzchut_orgs'


def run_old_pipeline(monkeypatch, records):
    captured_calls = {}
    monkeypatch.setattr(
        old_module.requests, 'get',
        lambda url: types.SimpleNamespace(json=lambda: copy.deepcopy(records)))
    monkeypatch.setattr(old_module, 'airtable_updater', make_airtable_updater_capture(captured_calls))
    old_module.fetchKZOrgData()
    return captured_calls


def test_kolzchut_orgs_parity(monkeypatch):
    records = load_fixture_records(SPEC_NAME, 'api_records.json')
    old_captured = run_old_pipeline(monkeypatch, records)
    spec = load_spec(SPEC_NAME)
    new_outputs = build_outputs(spec, {'fetch': pd.DataFrame(copy.deepcopy(records))})

    organizations_call = old_captured[settings.AIRTABLE_ORGANIZATION_TABLE]
    assert_parity_and_report(
        SPEC_NAME, 'organizations',
        payload_from_records(organizations_call['records'], organizations_call['table_fields']),
        payload_from_frame(new_outputs['organization'], organizations_call['table_fields']))
