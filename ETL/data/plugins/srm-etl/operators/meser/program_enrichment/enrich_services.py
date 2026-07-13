from operators.meser.program_enrichment.build_program_lookup import (
    LOOKUP_COLUMNS,
    build_program_lookup,
    normalize_join_key,
)
from operators.meser.program_enrichment.empty_values import is_empty


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


def extend_unique(base_list, extra_items):
    result = list(base_list) if isinstance(base_list, list) else []
    extras = extra_items if isinstance(extra_items, list) else []
    for item in extras:
        if item is not None and item not in result:
            result.append(item)
    return result


def add_service_type_tagging(row, tags):
    if is_empty(row['ServiceTypeName']):
        return row
    enriched_row = row.copy()
    service_type_name = str(row['ServiceTypeName']).strip()
    tag_ids = tags.get(service_type_name, {})
    enriched_row['tagging'] = extend_unique(row['tagging'], [service_type_name])
    enriched_row['responses'] = extend_unique(row['responses'], tag_ids.get('response_ids'))
    enriched_row['situations'] = extend_unique(row['situations'], tag_ids.get('situation_ids'))
    return enriched_row


def enrich_services_with_program_data(df, tags, program_tables):
    program_texts_df, program_ids_df = program_tables
    lookup = build_program_lookup(program_texts_df, program_ids_df)

    df = df.copy()
    input_row_count = len(df)
    df['_join_key'] = df['meser_id'].map(normalize_join_key)
    df = df.merge(lookup, left_on='_join_key', right_on='Misgeret_Id', how='left', validate='many_to_one')
    if len(df) != input_row_count:
        raise ValueError(f'Program enrichment changed the services row count ({input_row_count} -> {len(df)})')

    df['service_name'] = df.apply(
        lambda row: row['service_name'] if is_empty(row['ServiceTypePublicName']) else row['ServiceTypePublicName'],
        axis=1,
    )
    df['description'] = df.apply(
        lambda row: build_description(row['ServiceTypePublicName'], row['ServiceTypePublicDetails']),
        axis=1,
    )
    df['details'] = df['Implementation_process'].map(build_details)
    df = df.apply(lambda row: add_service_type_tagging(row, tags), axis=1)

    return df.drop(columns=['_join_key', 'Misgeret_Id'] + LOOKUP_COLUMNS)
