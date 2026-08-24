import pandas as pd

from transformers.enrich import resolve_source_frame
from transformers.meser_helpers import (
    create_address_clean, flatten_and_deduplicate_list_of_lists, frame_to_tag_map, safe_list)

TAGGING_COLUMNS = ['Type_Descr', 'Target_Population_Descr', 'Second_Classific',
                   'Gender_Descr', 'Head_Department']
GROUP_KEYS = ['service_name', 'phone_numbers', 'address', 'organization_id']
DEFAULT_ORGANIZATION_ID = '500106406'


def sanitize_columns(frame, params, context):
    frame = frame.copy()
    for column in frame.columns:
        if column in params.get('numeric_fields', []):
            frame[column] = pd.to_numeric(frame[column], errors='coerce').fillna(0).astype(int)
        elif column in params.get('date_fields', []):
            frame[column] = pd.to_datetime(frame[column], dayfirst=True, errors='coerce')
            frame[column] = frame[column].dt.strftime('%Y-%m-%d')
            frame[column] = frame[column].where(frame[column].notna(), None)
        else:
            frame[column] = frame[column].astype(str).replace(params.get('missing_values', []), None)
    return frame


def derive_base_fields(frame):
    frame['service_name'] = frame['Name'].str.strip()
    frame['branch_name'] = frame['Type_Descr'].str.strip()
    frame = frame.rename(columns={'Misgeret_Id': 'meser_id'})
    frame['organization_id'] = frame['ORGANIZATIONS_BUSINES_NUM'].combine_first(
        frame['Registered_Business_Id'])
    frame['organization_id'] = frame['organization_id'].fillna(DEFAULT_ORGANIZATION_ID)
    frame['Adrees'] = frame['Adrees'].astype(str).str.replace('999', '', regex=False).str.strip()
    frame.loc[frame['Adrees'] == frame['City_Name'], 'Adrees'] = None
    frame['address'] = frame.apply(
        lambda row: create_address_clean(row['Adrees'], row['City_Name']), axis=1).str.strip()
    frame['phone_numbers'] = frame['Telephone'].apply(
        lambda value: '' if pd.isna(value) or str(value).strip() in ['', '0']
        else ('0' + str(value) if str(value)[0] != '0' else str(value)))
    frame['tagging'] = frame[TAGGING_COLUMNS].apply(
        lambda row: [value for value in row if value not in [None, 'None', '']], axis=1)
    frame['branch_id'] = frame['meser_id'].map(lambda meser_id: 'meser-b-' + meser_id)
    frame['service_id'] = frame['meser_id'].map(lambda meser_id: 'meser-s-' + meser_id)
    return frame


def group_duplicate_services(frame):
    return frame.groupby(GROUP_KEYS, dropna=False).agg({
        'service_id': 'first',
        'branch_id': 'first',
        'branch_name': 'first',
        'meser_id': 'first',
        'Owner_Code_Descr': 'first',
        'City_Name': 'first',
        'tagging': lambda values: flatten_and_deduplicate_list_of_lists(values),
    }).reset_index()


def add_tag_derived_fields(frame, tag_map):
    frame['responses'] = frame['tagging'].apply(
        lambda tag_list: flatten_and_deduplicate_list_of_lists(
            safe_list(tag_map.get(tag.strip(), {}).get('response_ids')) for tag in tag_list))
    frame['situations'] = frame['tagging'].apply(
        lambda tag_list: flatten_and_deduplicate_list_of_lists(
            safe_list(tag_map.get(tag.strip(), {}).get('situation_ids')) for tag in tag_list))
    return frame


def meser_core_transform(frame, params, context):
    tag_map = frame_to_tag_map(resolve_source_frame(params['tags_source'], context))
    frame = derive_base_fields(frame.copy())
    grouped = group_duplicate_services(frame)
    return add_tag_derived_fields(grouped, tag_map)
