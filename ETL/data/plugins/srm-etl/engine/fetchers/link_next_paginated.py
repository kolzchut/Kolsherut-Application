from urllib.parse import urlparse

import pandas as pd

from engine.fetchers.http_get import http_get_json


def derive_base_url(url):
    parsed = urlparse(url)
    return f'{parsed.scheme}://{parsed.netloc}'


def collect_link_next_records(first_payload, base_url):
    records = []
    payload = first_payload
    while True:
        page_records = payload.get('result', {}).get('records') or []
        if not page_records:
            return records
        records.extend(page_records)
        next_path = payload['result'].get('_links', {}).get('next')
        if next_path is None:
            return records
        payload = http_get_json(base_url + next_path)


def fetch_link_next(url, params, api_spec):
    first_payload = http_get_json(url, params)
    records = collect_link_next_records(first_payload, derive_base_url(url))
    return {'frame': pd.DataFrame(records), 'payload': first_payload}
