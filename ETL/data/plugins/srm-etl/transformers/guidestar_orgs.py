import pandas as pd

from srm_tools.budgetkey import fetch_from_budgetkey
from srm_tools.logger import logger
from srm_tools.url_utils import fix_url
from transformers.guidestar_client import get_guidestar_client

NAME_SUFFIXES_TO_STRIP = [' (חל"צ)', ' (ע"ר)']


def fetch_entity_from_budgetkey(registration_number):
    entities = list(fetch_from_budgetkey(f"select * from entities where id='{registration_number}'"))
    if not entities:
        return None
    entity = entities[0]
    name, purpose = entity['name'], entity['details'].get('goal')
    if registration_number.startswith('50'):
        purpose = purpose or name
        name = name.split('/')[0].strip()
    return dict(name=name, kind=entity['kind_he'], purpose=purpose)


def apply_guidestar_org_data(row, data):
    row['name'] = data['name']
    row['short_name'] = data.get('abbreviatedOrgName')
    kind = data.get('malkarType')
    row['kind'] = 'חברה פרטית' if kind == 'חברה' else kind
    row['description'] = None
    row['purpose'] = data.get('orgGoal')
    website = fix_url(data['website']) if data.get('website') else None
    row['urls'] = '\n'.join([website + '#אתר הבית'] if website else [])
    row['phone_numbers'] = '\n'.join(data[key] for key in ('tel1', 'tel2') if data.get(key))
    if data.get('email'):
        row['email_address'] = data['email']


def enrich_org_row(row, client):
    if row['id'].startswith('srm'):
        return row
    for guidestar_record in client.organizations(regNums=[row['id']], cacheOnly=True):
        try:
            apply_guidestar_org_data(row, guidestar_record['data'])
            break
        except Exception as error:
            print('BAD DATA RECEIVED', str(error), [row['id']], guidestar_record)
    else:
        entity_data = fetch_entity_from_budgetkey(row['id'])
        if entity_data is not None:
            row.update(entity_data)
        else:
            logger.warning(f'Entities: unknown organization id {row["id"]}')
    if 'name' in row:
        for suffix in NAME_SUFFIXES_TO_STRIP:
            row['name'] = row['name'].replace(suffix, '')
    return row


def guidestar_org_enrichment(frame, params, context):
    client = get_guidestar_client()
    enriched_rows = [enrich_org_row(dict(row), client) for row in frame.to_dict(orient='records')]
    return pd.DataFrame(enriched_rows)
