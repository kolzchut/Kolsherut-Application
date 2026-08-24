import pandas as pd

from conf import settings
from extract import extract_data_from_airtable
from transformers.values import none_if_missing


def unpack_first_list_item(value):
    if isinstance(value, list):
        return str(value[0]).strip() if len(value) > 0 else None
    return str(value).strip() if none_if_missing(value) is not None else None


def apply_normalizations(name, normalizations):
    for source_text, target_text in normalizations.items():
        name = name.replace(source_text, target_text)
    return name


def build_organization_map(lookup_frame, lookup_field, normalizations):
    lookup_frame = lookup_frame.copy()
    lookup_frame[lookup_field] = lookup_frame[lookup_field].map(unpack_first_list_item)
    lookup_frame = lookup_frame.dropna(subset=[lookup_field])
    return {
        apply_normalizations(name, normalizations): record_id
        for name, record_id in zip(lookup_frame[lookup_field], lookup_frame['id'])
    }


def match_name(org_name, org_map, prefixes, normalizations):
    if not isinstance(org_name, str) or not org_name:
        return None
    clean_name = apply_normalizations(org_name.strip(), normalizations)
    if clean_name in org_map:
        return org_map[clean_name]
    matched_prefix = next((prefix for prefix in prefixes if clean_name.startswith(prefix)), None)
    if not matched_prefix:
        return None
    city_part = clean_name[len(matched_prefix):].strip()
    if '-' in city_part:
        candidate = f'{matched_prefix} {city_part.replace("-", " ")}'
    elif ' ' in city_part:
        candidate = f'{matched_prefix} {city_part.replace(" ", "-")}'
    else:
        return None
    return org_map.get(candidate)


def airtable_lookup_match(frame, params, context):
    lookup_frame = extract_data_from_airtable.load_airtable_as_dataframe(
        table_name=params['lookup_table'],
        base_id=getattr(settings, params['lookup_base']),
    )
    normalizations = params.get('normalizations', {})
    org_map = build_organization_map(lookup_frame, params['lookup_field'], normalizations)
    matched = frame[params['match_field']].map(
        lambda name: match_name(name, org_map, params['prefixes'], normalizations))
    result_frame = frame.copy()
    override_field = params['override_field']
    result_frame[override_field] = matched.combine_first(frame[override_field])
    return result_frame
