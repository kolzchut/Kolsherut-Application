import pandas as pd

from srm_tools.data_cleaning import clean_org_name
from srm_tools.logger import logger
from transformers.guidestar_address import build_language_situations, calc_address, calc_location_key
from transformers.guidestar_client import get_guidestar_client
from transformers.values import none_if_missing

NATIONAL_DISCLAIMER = ('שימו לב, ייתכן כי המיקום המוצג אינו מדויק וכי קיימים סניפים נוספים '
                       'שבהם ניתן לקבל את השירות. מומלץ ליצור קשר ישירות עם הארגון לקבלת מידע מדויק ומעודכן.')
NON_FALLBACK_KINDS = ('עמותה', 'חל"צ', 'הקדש')


def branch_org_name(org_row):
    # Airtable-sourced org rows carry float NaN for a missing short_name, which is truthy.
    return none_if_missing(org_row.get('short_name')) or none_if_missing(org_row.get('name'))


def build_branch_row(org_row, branch):
    row = {
        'id': 'guidestar:' + branch['branchId'],
        'name': branch.get('placeNickname') or f'{branch_org_name(org_row)} - {branch["cityName"]}',
        'address': calc_address(branch),
        'address_details': branch.get('drivingInstructions'),
        'description': None,
        'urls': None,
        'phone_numbers': branch.get('phone'),
        'organization': [org_row['id']],
    }
    row['location'] = calc_location_key(branch, row['address'])
    if branch.get('language'):
        row['situations'] = build_language_situations(branch['language'])
    return row


def build_no_branch_fallback(org_row, client):
    org_records = list(client.organizations(regNums=[org_row['id']], cacheOnly=True))
    if org_records and org_records[0]['data'].get('fullAddress'):
        full_address = org_records[0]['data']['fullAddress']
        return {'id': 'guidestar:' + org_row['id'], 'name': org_row['name'],
                'address': full_address, 'location': full_address, 'organization': [org_row['id']]}
    if org_records and org_row['kind'] not in NON_FALLBACK_KINDS:
        cleaned_name = clean_org_name(org_row['name'])
        return {'id': 'budgetkey:' + org_row['id'], 'name': org_row['name'],
                'address': cleaned_name, 'location': cleaned_name, 'organization': [org_row['id']]}
    return None


def build_national_row(org_row):
    return {
        'id': 'national:' + org_row['id'],
        'organization': [org_row['id']],
        'name': '',
        'address': 'שירות ארצי',
        'location': 'שירות ארצי',
        'description': NATIONAL_DISCLAIMER,
    }


def deduplicate_rows_by_id(rows):
    seen, deduplicated = set(), []
    for row in rows:
        if row['id'] in seen:
            logger.warning(f'Skipped duplicate: {row["id"]}')
            continue
        seen.add(row['id'])
        deduplicated.append(row)
    return deduplicated


def guidestar_unwind_branches(frame, params, context):
    client = get_guidestar_client()
    all_rows = []
    for org_row in frame.to_dict(orient='records'):
        branches = client.branches(org_row['id'])
        branch_ids = [branch['branchId'] for branch in branches]
        if len(branch_ids) != len(set(branch_ids)):
            logger.warning(f'Warning: duplicate branch IDs in fetched data {org_row["id"]}: {branch_ids}')
        for branch in branches:
            all_rows.append(build_branch_row(org_row, branch))
        if not branches:
            fallback_row = build_no_branch_fallback(org_row, client)
            if fallback_row is not None:
                all_rows.append(fallback_row)
        all_rows.append(build_national_row(org_row))
    return pd.DataFrame(deduplicate_rows_by_id(all_rows))
