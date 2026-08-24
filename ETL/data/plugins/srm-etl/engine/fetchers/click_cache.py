import codecs
import json
from pathlib import Path

import bleach
import dataflows as DF
import pandas as pd

from engine.fetchers.click_cache_fields import (
    DEDUCTIBLE_TYPE, FINAL_FIELDS, SELECT_FIELDS, build_concat_fields)

SPECS_DIRECTORY = Path(__file__).resolve().parent.parent.parent / 'specs'


def decode_and_clean(row):
    for key, value in row.items():
        if isinstance(value, str):
            try:
                value = codecs.decode(value.encode('ascii'), 'base64').decode('utf8')
            except Exception:
                pass
            value = bleach.clean(value, strip=True).replace('&nbsp;', ' ').replace('\xa0', ' ').replace('\r', '').strip()
            row[key] = None if value == 'NULL' else value


def load_click_documents(api_spec):
    cache_path = Path(api_spec.get('cache_file', 'click-cache.json'))
    if cache_path.exists():
        return json.load(cache_path.open())
    return json.load((SPECS_DIRECTORY / api_spec['backup_file']).open())


def build_details(row):
    detail_fields = ['description', 'details', 'implementation_details',
                     'target_community_text', 'service_duration_text']
    return ''.join(f'<p>{row[field].strip()}</p>' for field in detail_fields
                   if isinstance(row.get(field), str))


def fetch_click_cache(url, params, api_spec):
    documents = load_click_documents(api_spec)
    all_keys, concat_fields = build_concat_fields(documents)
    documents = (dict((key, doc.get(key)) for key in all_keys) for doc in documents)
    records = DF.Flow(
        documents,
        DF.concatenate(concat_fields),
        DF.update_resource(-1, name='click'),
        decode_and_clean,
        DF.filter_rows(lambda row: row.get('lang_code') == 'he'),
        DF.set_type('type', type='integer', on_error=DF.schema_validator.drop),
        DF.filter_rows(lambda row: row.get('type') == 1),
        DF.filter_rows(lambda row: row.get('group_id') is not None),
        DF.filter_rows(lambda row: row.get('distribution_channel') is not None
                       and row.get('distribution_channel')[0] == 1),
        DF.add_field('data_sources', 'string', None),
        DF.add_field('urls', 'string', None),
        DF.select_fields(list(SELECT_FIELDS.keys())),
        DF.rename_fields(SELECT_FIELDS),
        DF.set_type('details', transform=lambda _, row: build_details(row)),
        DF.set_type('name', type='string', transform=lambda value: ''.join(value).strip()),
        DF.set_type('payment_required', type='string', transform=lambda value: DEDUCTIBLE_TYPE.get(value)),
        DF.select_fields(FINAL_FIELDS),
    ).results()[0][0]
    return {'frame': pd.DataFrame(records), 'payload': None}
