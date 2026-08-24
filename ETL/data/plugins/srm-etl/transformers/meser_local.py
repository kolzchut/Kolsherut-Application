import pandas as pd

from transformers.meser_helpers import clean_city_name
from transformers.references import resolve_named_data

LOCAL_AUTHORITY_PATTERN = r'רשות מקומית'


def override_local_authority_organizations(local_frame, city_council_map_frame):
    local_frame = local_frame.copy()
    map_frame = city_council_map_frame.copy()
    local_frame['City_Name'] = clean_city_name(local_frame['City_Name'])
    map_frame['city'] = clean_city_name(map_frame['city'])
    local_frame = local_frame.merge(
        map_frame[['city', 'counsil_id']], left_on='City_Name', right_on='city', how='left')
    local_frame['organization_id'] = local_frame['counsil_id']
    local_frame = local_frame.drop(columns=['counsil_id'])
    return local_frame.dropna(subset=['organization_id'])


def meser_local_authority_override(frame, params, context):
    city_council_records = resolve_named_data(params['city_council_map'], context)
    city_council_map_frame = pd.DataFrame(city_council_records)
    local_mask = frame['Owner_Code_Descr'].str.contains(LOCAL_AUTHORITY_PATTERN, regex=True, na=False)
    local_frame = override_local_authority_organizations(frame[local_mask], city_council_map_frame)
    return pd.concat([local_frame, frame[~local_mask]], ignore_index=True)
