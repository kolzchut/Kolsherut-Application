from engine.fetchers.http_get import http_get_json
from transform.json_to_dataframe import json_to_dataframe


def fetch_json(url, params, api_spec):
    payload = http_get_json(url, params, headers=api_spec.get('headers'))
    frame = json_to_dataframe(payload, api_spec.get('records_key'))
    return {'frame': frame, 'payload': payload}
