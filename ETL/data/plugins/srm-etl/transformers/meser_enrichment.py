from transformers.enrich import resolve_source_frame
from transformers.meser_helpers import (
    extend_unique, frame_to_tag_map, is_empty, normalize_join_key)

LOOKUP_COLUMNS = ['ServiceTypeName', 'ServiceTypePublicName', 'ServiceTypePublicDetails',
                  'Implementation_process']


def build_program_lookup(program_texts_frame, program_ids_frame):
    texts = program_texts_frame.copy()
    ids = program_ids_frame.copy()
    texts['ServiceTypeNum'] = texts['ServiceTypeNum'].map(normalize_join_key)
    ids['ServiceTypeNum'] = ids['ServiceTypeNum'].map(normalize_join_key)
    ids['Misgeret_Id'] = ids['Misgeret_Id'].map(normalize_join_key)
    texts = texts.dropna(subset=['ServiceTypeNum']).drop_duplicates(subset='ServiceTypeNum', keep='first')
    ids = ids.dropna(subset=['Misgeret_Id']).drop_duplicates(subset='Misgeret_Id', keep='first')
    lookup = ids.merge(texts[['ServiceTypeNum'] + LOOKUP_COLUMNS], on='ServiceTypeNum', how='left')
    return lookup[['Misgeret_Id'] + LOOKUP_COLUMNS]


def build_description(public_name, public_details):
    if is_empty(public_name):
        return None
    if is_empty(public_details):
        return f'השירות הוא חלק מתכנית {public_name} של משרד הרווחה.'
    return f'השירות הוא חלק מתכנית {public_name} של משרד הרווחה:\n{public_details}'


def build_details(implementation_process):
    if is_empty(implementation_process):
        return None
    return f'אופן קבלת השירות:\n{implementation_process}'


def add_service_type_tagging(row, tag_map):
    if is_empty(row['ServiceTypeName']):
        return row
    enriched_row = row.copy()
    service_type_name = str(row['ServiceTypeName']).strip()
    tag_ids = tag_map.get(service_type_name, {})
    enriched_row['tagging'] = extend_unique(row['tagging'], [service_type_name])
    enriched_row['responses'] = extend_unique(row['responses'], tag_ids.get('response_ids'))
    enriched_row['situations'] = extend_unique(row['situations'], tag_ids.get('situation_ids'))
    return enriched_row


def meser_program_enrichment(frame, params, context):
    tag_map = frame_to_tag_map(resolve_source_frame(params['tags_source'], context))
    lookup = build_program_lookup(
        resolve_source_frame(params['texts_source'], context),
        resolve_source_frame(params['ids_source'], context))

    frame = frame.copy()
    input_row_count = len(frame)
    frame['_join_key'] = frame['meser_id'].map(normalize_join_key)
    frame = frame.merge(lookup, left_on='_join_key', right_on='Misgeret_Id',
                        how='left', validate='many_to_one')
    if len(frame) != input_row_count:
        raise ValueError(
            f'Program enrichment changed the services row count ({input_row_count} -> {len(frame)})')

    frame['service_name'] = frame.apply(
        lambda row: row['service_name'] if is_empty(row['ServiceTypePublicName'])
        else row['ServiceTypePublicName'], axis=1)
    frame['description'] = frame.apply(
        lambda row: build_description(row['ServiceTypePublicName'], row['ServiceTypePublicDetails']),
        axis=1)
    frame['details'] = frame['Implementation_process'].map(build_details)
    frame = frame.apply(lambda row: add_service_type_tagging(row, tag_map), axis=1)
    return frame.drop(columns=['_join_key', 'Misgeret_Id'] + LOOKUP_COLUMNS)
