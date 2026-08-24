from io import StringIO

import pandas as pd

from engine.fetchers.http_get import http_get_text


def promote_first_row_to_header(frame):
    frame.columns = frame.iloc[0]
    frame = frame[1:]
    frame.reset_index(drop=True, inplace=True)
    return frame


def fetch_html_table(url, params, api_spec):
    html_text = http_get_text(url, params, headers=api_spec.get('headers'))
    tables = pd.read_html(StringIO(html_text), flavor=api_spec.get('flavor'))
    frame = tables[api_spec.get('table_index', 0)]
    if api_spec.get('promote_first_row_header'):
        frame = promote_first_row_to_header(frame)
    return {'frame': frame, 'payload': None}
