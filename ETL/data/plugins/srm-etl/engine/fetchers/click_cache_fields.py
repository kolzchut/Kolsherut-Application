KEEP_FIELDS = ['cat', 'Name']
DT_SUFFIXES = dict((suffix, index) for index, suffix in enumerate(['', 'i', 'ss', 't', 's', 'base64', 'f', 'is']))
NO_LISTS = ['Short_Description']
SELECT_FIELDS = {
    'id': 'catalog_number',
    'data_sources': 'data_sources',
    'urls': 'urls',
    'parent_group_name': 'service_group',
    'group_name': 'unit',
    'FamilyName': 'name',
    'Service_Purpose': 'purpose',
    'Short_Description': 'description',
    'Description': 'details',
    'Normative_Source': 'normative_source',
    'Domin': 'service_subject',
    'Target_Population_A': 'target_populations_level_1',
    'Target_Population': 'target_populations_level_2',
    'Age_Minimum': 'age_min',
    'Age_Maximum': 'age_max',
    'Target_Community': 'target_community_text',
    'Duration_of_Service': 'service_duration_text',
    'Deducitable': 'payment_required',
    'Deductible': 'payment_details',
    'Implementaion_Process': 'implementation_details',
    'Link_to_Kolzchut': 'link_to_kolzchut',
    'Link_to_Molsa': 'link_to_molsa',
    'Link_to_TAAS': 'link_to_taas',
    'Causes_Referes': 'causes_referes',
    'Location': 'location',
    'Informational_Notes': 'notes',
}
DEDUCTIBLE_TYPE = {
    'אינו כרוך בהשתתפות עצמית': 'no',
    'בחלק מהמקרים תתכן השתתפות עצמית': 'sometimes',
    'כרוך בהשתתפות עצמית': 'yes',
}
FINAL_FIELDS = [
    'catalog_number', 'name', 'description', 'details', 'payment_required',
    'payment_details', 'data_sources', 'urls',
]


def build_concat_fields(docs):
    all_keys = set()
    for doc in docs:
        all_keys.update(key for key, value in doc.items() if value)
    config = dict()
    for key in all_keys:
        if key in KEEP_FIELDS:
            config[key] = [[key, key, '']]
        else:
            suffix = key.split('_')[-1]
            if suffix in DT_SUFFIXES:
                prefix = key[:-len(suffix) - 1]
                config.setdefault(prefix, []).append((prefix, key, suffix))
    concat_fields = dict()
    for key, suffixes in config.items():
        suffixes = sorted(suffixes, key=lambda item: DT_SUFFIXES[item[2]])
        while key in NO_LISTS and DT_SUFFIXES[suffixes[0][2]] < 3:
            suffixes.pop(0)
        prefix, key, _ = suffixes[0]
        concat_fields[prefix] = [key] if prefix != key else []
    return all_keys, concat_fields
