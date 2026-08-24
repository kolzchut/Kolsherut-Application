import pandas as pd

from srm_tools.url_utils import fix_url
from transformers.guidestar_client import get_guidestar_client
from transformers.guidestar_service_details import (
    add_date_details, add_remote_details, add_when_details, apply_payment, build_area_details)
from transformers.guidestar_taxonomy import build_taxonomy, has_rejected_tag, update_from_taxonomy

DATA_SOURCE_TEXT = ('מידע נוסף אפשר למצוא ב<a target="_blank" href="{url}">'
                    'גיידסטאר - אתר העמותות של ישראל</a>')


def collect_service_tags(data, related_service):
    tags = []
    if 'serviceTypeNum' in data:
        tags.append(data.pop('serviceTypeNum'))
    if 'serviceTypeName' in data:
        tags.append(data.pop('serviceTypeName'))
    tags.extend((data.pop('serviceTargetAudience') or '').split(';'))
    tags.append('soproc:' + related_service.get('serviceGovId', ''))
    return tags


def apply_contact_fields(row, data):
    url = fix_url(data.pop('url'))
    if url:
        row['urls'] = f'{url}#מידע נוסף על השירות'
    phone_numbers = data.pop('Phone', data.pop('phone', None))
    if phone_numbers:
        row['phone_numbers'] = phone_numbers
    email_address = data.pop('Email', data.pop('email', None))
    if email_address:
        row['email_address'] = email_address


def process_service(row, taxonomy, rejected_names):
    data = row['data']
    responses, situations = set(), set()
    row['name'] = data.pop('serviceName')
    row['description'] = data.pop('voluntaryDescription') or data.pop('description')
    data_source_url = f'https://www.guidestar.org.il/organization/{data["organization_id"]}/services'
    row['data_sources'] = DATA_SOURCE_TEXT.format(url=data_source_url)
    org_id = data.pop('organization_id')
    actual_branch_ids = data.pop('actual_branch_ids')
    row['branches'] = ['guidestar:' + branch['branchId'] for branch in (data.pop('branches') or [])
                       if branch['branchId'] in actual_branch_ids]
    row['organizations'] = []
    assert data.pop('recordType') == 'GreenInfo'
    for key in list(data.keys()):
        if key.startswith('youth'):
            data.pop(key)
    related_service = data.pop('relatedMalkarService') or {}
    tags = collect_service_tags(data, related_service)
    if has_rejected_tag(tags, rejected_names):
        return None
    if 'נדרש סיוע' in (data.get('serviceName') or ''):
        return None
    update_from_taxonomy(tags, taxonomy, responses, situations)
    apply_payment(row, data)
    details, national = build_area_details(row, data, actual_branch_ids)
    if national:
        row['branches'].append(f'national:{org_id}')
    if len(row['branches']) == 0:
        return None
    add_when_details(details, data, row)
    add_remote_details(details, data)
    if related_service.get('serviceGovId') and related_service.get('serviceOffice'):
        row['implements'] = f'soproc:{related_service["serviceGovId"]}#{related_service["serviceOffice"]}'
    add_date_details(details, data)
    row['details'] = '\n<br/>\n'.join(details)
    apply_contact_fields(row, data)
    for key in ('isForCoronaVirus', 'lastModifiedDate', 'serviceId', 'isForBranch'):
        data.pop(key)
    row['situations'] = sorted(situations)
    row['responses'] = sorted(responses)
    assert all(value in (None, '0') for value in data.values()), repr(data_source_url) + ':' + repr(data)
    return row


def unwind_org_services(org_row, client, taxonomy, rejected_names):
    services = client.services(org_row['id'])
    gov_services = {service['relatedMalkarService']: service for service in services
                    if service.get('serviceGovName') is not None
                    and service.get('relatedMalkarService') is not None}
    branch_ids = [branch['branchId'] for branch in client.branches(org_row['id'])]
    for service in services:
        if service['serviceId'] in gov_services:
            service['relatedMalkarService'] = gov_services.get(service['serviceId'])
        row = dict(org_row)
        row['data'] = service
        service['organization_id'] = org_row['id']
        service['actual_branch_ids'] = branch_ids
        row['id'] = 'guidestar:' + service['serviceId']
        processed_row = process_service(row, taxonomy, rejected_names)
        if processed_row:
            yield {key: value for key, value in processed_row.items()
                   if key not in ('data', 'source', 'status')}


def guidestar_unwind_services(frame, params, context):
    client = get_guidestar_client()
    taxonomy, rejected_names = build_taxonomy(params, context)
    output_rows = []
    for org_row in frame.to_dict(orient='records'):
        output_rows.extend(unwind_org_services(org_row, client, taxonomy, rejected_names))
    return pd.DataFrame(output_rows)
