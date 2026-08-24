from engine.fetchers.airtable_source import fetch_airtable_table
from engine.fetchers.budgetkey_query import fetch_budgetkey
from engine.fetchers.click_cache import fetch_click_cache
from engine.fetchers.google_drive import fetch_google_drive_xlsx
from engine.fetchers.guidestar_orgs import fetch_guidestar_organizations
from engine.fetchers.gov_batch_paginated import fetch_gov_batch
from engine.fetchers.html_table_fetch import fetch_html_table
from engine.fetchers.json_fetch import fetch_json
from engine.fetchers.link_next_paginated import fetch_link_next
from engine.fetchers.page_param_paginated import fetch_page_param

FETCHER_REGISTRY = {
    ('json', 'none'): fetch_json,
    ('json', 'link_next'): fetch_link_next,
    ('json', 'gov_batch'): fetch_gov_batch,
    ('json', 'page_param'): fetch_page_param,
    ('json', 'budgetkey'): fetch_budgetkey,
    ('html_table', 'none'): fetch_html_table,
    ('click_cache', 'none'): fetch_click_cache,
    ('airtable', 'none'): fetch_airtable_table,
    ('google_drive_xlsx', 'none'): fetch_google_drive_xlsx,
    ('guidestar_orgs', 'none'): fetch_guidestar_organizations,
}


def get_fetcher(format_name, paginate):
    fetcher = FETCHER_REGISTRY.get((format_name, paginate))
    if fetcher is None:
        raise ValueError(f'No fetcher registered for format "{format_name}" with pagination "{paginate}"')
    return fetcher
