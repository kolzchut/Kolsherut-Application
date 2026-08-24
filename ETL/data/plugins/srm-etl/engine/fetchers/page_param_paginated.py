import pandas as pd

from engine.fetchers.http_get import http_get_json

PAGE_PARAM_NAME = 'page'


def collect_page_param_records(url, params, records_key):
    # The BudgetKey-style page param clamps to the last page instead of erroring,
    # so termination is detected by a repeated first record.
    records, page_number, previous_first_record = [], 1, None
    while True:
        payload = http_get_json(url, {**(params or {}), PAGE_PARAM_NAME: page_number})
        page_records = payload.get(records_key) or []
        if not page_records or page_records[0] == previous_first_record:
            return records
        records.extend(page_records)
        previous_first_record = page_records[0]
        page_number += 1


def fetch_page_param(url, params, api_spec):
    records = collect_page_param_records(url, params, api_spec.get('records_key', 'rows'))
    return {'frame': pd.DataFrame(records), 'payload': None}
