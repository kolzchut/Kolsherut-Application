import re

import pandas as pd


def is_empty(value):
    if value is None:
        return True
    if not isinstance(value, str) and pd.isna(value):
        return True
    return str(value).strip().lower() in ('', 'none', 'nan')


def flatten_and_deduplicate_list_of_lists(list_of_lists):
    seen, result = set(), []
    for inner_list in list_of_lists:
        if inner_list is None:
            continue
        if not isinstance(inner_list, list):
            inner_list = [inner_list]
        for item in inner_list:
            if item is None or item == 'None':
                continue
            if item not in seen:
                seen.add(item)
                result.append(item)
    return result


def safe_list(value):
    return value if isinstance(value, list) else []


def remove_numbers_and_spaces(text):
    if text is None:
        return ''
    text = re.sub(r'\d+', '', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()


def create_address_clean(street_address, city_name):
    def clean(value):
        text = str(value).strip()
        return text if pd.notna(value) and text.lower() not in ['none', 'nan', ''] else None

    address, city = clean(street_address), remove_numbers_and_spaces(clean(city_name))
    if address and city and address.lower() == city.lower():
        address = None
    return ' '.join(str(item).strip() for item in [address, city] if item and str(item).strip())


def normalize_join_key(value):
    if is_empty(value):
        return None
    key = str(value).strip()
    if key.endswith('.0'):
        key = key[:-2]
    return None if is_empty(key) else key


def extend_unique(base_list, extra_items):
    result = list(base_list) if isinstance(base_list, list) else []
    extras = extra_items if isinstance(extra_items, list) else []
    for item in extras:
        if item is not None and item not in result:
            result.append(item)
    return result


def frame_to_tag_map(tags_frame):
    filtered = tags_frame[~tags_frame['tag'].isin([None, 'dummy'])]
    return {
        row['tag']: {'response_ids': row['response_ids'], 'situation_ids': row['situation_ids']}
        for _, row in filtered[['tag', 'response_ids', 'situation_ids']].iterrows()
    }


def clean_city_name(city_series):
    city_series = city_series.str.replace(r'[-"\'`]', '', regex=True)
    city_series = city_series.str.replace(r'\s+', ' ', regex=True)
    return city_series.str.strip()
