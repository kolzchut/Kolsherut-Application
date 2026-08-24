import copy
import types

import pandas as pd

import engine.outputs as engine_outputs
import engine.run_spec as engine_run_spec
import operators.entities as old_module
import transformers.guidestar_branches as new_branches_module
import transformers.guidestar_orgs as new_orgs_module
import transformers.guidestar_services as new_services_module
import transformers.guidestar_taxonomy as new_taxonomy_module
from conf import settings
from tests.parity.entities_fakes import (
    make_budgetkey_entities_router,
    make_dump_capture,
    make_fake_guidestar_client,
    make_fake_load_from_airtable,
)
from tests.parity.parity_helpers import (
    load_fixture_records,
    make_airtable_updater_capture,
    make_upsert_sequence_capture,
    noop_status_check,
    payload_from_frame,
    payload_from_records,
)
from tests.parity.report import assert_parity_and_report

SPEC_NAME = 'entities'


def run_old_pipeline(monkeypatch, data):
    updater_calls, dumped_rows = {}, {}
    monkeypatch.setattr(old_module, 'GuidestarAPI', lambda: make_fake_guidestar_client(data))
    monkeypatch.setattr(old_module, 'Stats',
                        lambda: types.SimpleNamespace(increase=lambda *a: None, save=lambda: None))
    monkeypatch.setattr(old_module, 'load_from_airtable', make_fake_load_from_airtable(data))
    monkeypatch.setattr(old_module, 'dump_to_airtable', make_dump_capture(dumped_rows))
    monkeypatch.setattr(old_module, 'fetch_from_budgetkey', make_budgetkey_entities_router(data))
    monkeypatch.setattr(old_module, 'airtable_updater', make_airtable_updater_capture(updater_calls))
    old_module.scrapeGuidestarEntities()
    return updater_calls, dumped_rows


def run_new_pipeline(monkeypatch, data):
    captured_sequence, registered_tags = [], []
    fake_client = make_fake_guidestar_client(data)
    frames = {
        'guidestar_orgs': pd.DataFrame(
            [{'id': reg_num} for reg_num in sorted(data['guidestar_org_cache'].keys())]),
        'airtable_orgs': pd.DataFrame(copy.deepcopy(data['airtable_organizations'])).drop(
            columns=['__airtable_id']),
        'taxonomy_guidestar': pd.DataFrame(copy.deepcopy(data['taxonomy_guidestar'])),
        'taxonomy_soproc': pd.DataFrame(copy.deepcopy(data['taxonomy_soproc'])),
    }
    monkeypatch.setattr(engine_run_spec, 'run_apis', lambda apis: frames)
    for consumer_module in (new_orgs_module, new_branches_module, new_services_module):
        monkeypatch.setattr(consumer_module, 'get_guidestar_client', lambda: fake_client)
    monkeypatch.setattr(new_orgs_module, 'fetch_from_budgetkey', make_budgetkey_entities_router(data))
    monkeypatch.setattr(new_taxonomy_module, 'register_unmapped_taxonomy', registered_tags.append)
    monkeypatch.setattr(engine_outputs, 'trigger_status_check', noop_status_check)
    monkeypatch.setattr(engine_outputs, 'update_if_exists_if_not_create',
                        make_upsert_sequence_capture(captured_sequence))
    engine_run_spec.run(SPEC_NAME)
    return captured_sequence, registered_tags


def assert_updater_matches_frame(table_label, updater_call, new_frame):
    table_fields = updater_call['table_fields']
    assert_parity_and_report(
        SPEC_NAME, table_label,
        payload_from_records(updater_call['records'], table_fields),
        payload_from_frame(new_frame, table_fields))


def test_entities_parity(monkeypatch):
    data = load_fixture_records(SPEC_NAME, 'entities_data.json')
    old_updater_calls, old_dumped_rows = run_old_pipeline(monkeypatch, data)
    new_sequence, new_registered_tags = run_new_pipeline(monkeypatch, data)

    assert [call['table'] for call in new_sequence] == [
        settings.AIRTABLE_ORGANIZATION_TABLE, settings.AIRTABLE_ORGANIZATION_TABLE,
        settings.AIRTABLE_BRANCH_TABLE, settings.AIRTABLE_SERVICE_TABLE]

    assert_updater_matches_frame(
        'organizations-last-tag-date',
        old_updater_calls[settings.AIRTABLE_ORGANIZATION_TABLE], new_sequence[0]['frame'])

    old_org_details = pd.DataFrame(old_dumped_rows[settings.AIRTABLE_ORGANIZATION_TABLE])
    detail_fields = sorted(
        (set(old_org_details.columns) | set(new_sequence[1]['frame'].columns)) - {'__airtable_id'})
    assert_parity_and_report(
        SPEC_NAME, 'organizations-details',
        payload_from_frame(old_org_details, detail_fields),
        payload_from_frame(new_sequence[1]['frame'], detail_fields))

    assert_updater_matches_frame(
        'branches', old_updater_calls[settings.AIRTABLE_BRANCH_TABLE], new_sequence[2]['frame'])
    assert_updater_matches_frame(
        'services', old_updater_calls[settings.AIRTABLE_SERVICE_TABLE], new_sequence[3]['frame'])

    old_registered_tags = [row['name'] for row in old_dumped_rows.get(
        settings.AIRTABLE_TAXONOMY_MAPPING_GUIDESTAR_TABLE, [])]
    assert_parity_and_report(
        SPEC_NAME, 'taxonomy-registrations',
        {tag_name: {'name': tag_name} for tag_name in old_registered_tags},
        {tag_name: {'name': tag_name} for tag_name in new_registered_tags})
