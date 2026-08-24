import copy
import types

from conf import settings


def make_fake_guidestar_client(data):
    org_cache = data['guidestar_org_cache']

    def organizations(limit=None, regNums=None, filter=True, cacheOnly=True):
        for reg_num in (regNums if regNums else sorted(org_cache.keys())):
            if reg_num in org_cache:
                yield dict(id=reg_num, data=copy.deepcopy(org_cache[reg_num]))

    return types.SimpleNamespace(
        organizations=organizations,
        branches=lambda reg_num: copy.deepcopy(data['guidestar_branches'].get(reg_num, [])),
        services=lambda reg_num: copy.deepcopy(data['guidestar_services'].get(reg_num, [])),
        fetchCaches=lambda: None,
    )


def make_budgetkey_entities_router(data):
    def fetch(query):
        for entity_id, entity in data['budgetkey_entities'].items():
            if f"id='{entity_id}'" in query:
                return [copy.deepcopy(entity)]
        return []
    return fetch


def make_fake_load_from_airtable(data):
    routes = {
        settings.AIRTABLE_ORGANIZATION_TABLE: data['airtable_organizations'],
        settings.AIRTABLE_TAXONOMY_MAPPING_GUIDESTAR_TABLE: data['taxonomy_guidestar'],
        settings.AIRTABLE_TAXONOMY_MAPPING_SOPROC_TABLE: data['taxonomy_soproc'],
    }
    return lambda base, table, view, api_key: copy.deepcopy(routes[table])


def make_dump_capture(captured_dumps):
    def dump_to_airtable(mapping, apikey=None, **kwargs):
        (_, table) = list(mapping.keys())[0]
        rows_sink = captured_dumps.setdefault(table, [])

        def collect(rows):
            for row in rows:
                rows_sink.append(dict(row))
                yield row
        return collect
    return dump_to_airtable
