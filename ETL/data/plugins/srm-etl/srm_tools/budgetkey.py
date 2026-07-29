import requests

from conf import settings
from srm_tools.debug_cache import cache_get, cache_set

CACHE_KEY_PREFIX = 'bk:'
QUERY_FAILED_MESSAGE = 'BudgetKey query API returned success=false.\nSQL: {sql}\nResponse: {payload}'


def fetch_budgetkey_query_page(sql, page_number):
    response = requests.get(
        settings.BUDGETKEY_QUERY_API,
        params=dict(query=sql, page=page_number),
        timeout=settings.BUDGETKEY_QUERY_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        raise ValueError(QUERY_FAILED_MESSAGE.format(sql=sql, payload=payload))
    return payload


def fetch_all_budgetkey_query_pages(sql):
    # The API clamps an out-of-range page to the last one instead of returning
    # an empty set, so the page count must come from the response itself.
    first_page = fetch_budgetkey_query_page(sql, 0)
    rows = list(first_page['rows'])
    for page_number in range(1, first_page['pages']):
        rows.extend(fetch_budgetkey_query_page(sql, page_number)['rows'])
    return rows


def fetch_from_budgetkey(sql):
    cache_key = CACHE_KEY_PREFIX + sql
    cached_rows = cache_get(cache_key)
    if cached_rows:
        return cached_rows
    rows = fetch_all_budgetkey_query_pages(sql)
    cache_set(cache_key, rows)
    return rows
