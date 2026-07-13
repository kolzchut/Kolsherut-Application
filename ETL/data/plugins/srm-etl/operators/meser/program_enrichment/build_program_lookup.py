from operators.meser.program_enrichment.empty_values import is_empty

LOOKUP_COLUMNS = ['ServiceTypeName', 'ServiceTypePublicName', 'ServiceTypePublicDetails', 'Implementation_process']


def normalize_join_key(value):
    if is_empty(value):
        return None
    key = str(value).strip()
    if key.endswith('.0'):
        key = key[:-2]
    return None if is_empty(key) else key


def build_program_lookup(program_texts_df, program_ids_df):
    texts = program_texts_df.copy()
    ids = program_ids_df.copy()

    texts['ServiceTypeNum'] = texts['ServiceTypeNum'].map(normalize_join_key)
    ids['ServiceTypeNum'] = ids['ServiceTypeNum'].map(normalize_join_key)
    ids['Misgeret_Id'] = ids['Misgeret_Id'].map(normalize_join_key)

    texts = texts.dropna(subset=['ServiceTypeNum']).drop_duplicates(subset='ServiceTypeNum', keep='first')
    ids = ids.dropna(subset=['Misgeret_Id']).drop_duplicates(subset='Misgeret_Id', keep='first')

    lookup = ids.merge(texts[['ServiceTypeNum'] + LOOKUP_COLUMNS], on='ServiceTypeNum', how='left')
    return lookup[['Misgeret_Id'] + LOOKUP_COLUMNS]
