import io

import pandas as pd
import requests

from engine.fetchers.http_get import DEFAULT_TIMEOUT_SECONDS
from srm_tools.http_retry import request_with_retry

SPREADSHEET_CONTENT_TYPE_MARKER = 'spreadsheetml'
ERROR_BODY_PREVIEW_CHARS = 200


def download_xlsx_bytes(url, params, headers):
    response = request_with_retry(
        lambda: requests.get(url, params=params, headers=headers, timeout=DEFAULT_TIMEOUT_SECONDS),
        f'xlsx download {url}')
    response.raise_for_status()
    content_type = response.headers.get('content-type', '')
    if SPREADSHEET_CONTENT_TYPE_MARKER not in content_type:
        raise RuntimeError(
            f'Expected an xlsx file from {url} but got content-type "{content_type}": '
            f'{response.text[:ERROR_BODY_PREVIEW_CHARS]!r}')
    return io.BytesIO(response.content)


def fetch_xlsx(url, params, api_spec):
    xlsx_bytes = download_xlsx_bytes(url, params, api_spec.get('headers'))
    # dtype=str keeps phone numbers and ids as text, so leading zeros are not lost
    frame = pd.read_excel(xlsx_bytes, sheet_name=api_spec.get('sheet_name', 0), dtype=str)
    if frame.empty:
        raise RuntimeError(f'The xlsx downloaded from {url} has no rows')
    return {'frame': frame, 'payload': None}
