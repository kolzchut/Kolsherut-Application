from conf import settings
from load import airtable


def build_record_id_map(table_name, base_id, airtable_key):
    table = airtable.get_airtable_table(table_name, base_id)
    return {
        record['fields'][airtable_key]: record['id']
        for record in table.all()
        if airtable_key in record.get('fields', {})
    }


def build_existing_links_map(table_name, base_id, linked_field, airtable_key):
    table = airtable.get_airtable_table(table_name, base_id)
    existing_links = {}
    for record in table.all():
        key = record.get('fields', {}).get(airtable_key)
        if key:
            existing_links[str(key)] = set(record.get('fields', {}).get(linked_field, []))
    return existing_links


def map_values_to_record_ids(value, record_id_map):
    if isinstance(value, list):
        return [record_id_map[item] for item in value if item in record_id_map]
    if value in record_id_map:
        return [record_id_map[value]]
    return []


def resolve_foreign_key(frame, params, context):
    airtable_key = params.get('airtable_key', 'id')
    record_id_map = build_record_id_map(
        params['source_table'], getattr(settings, params['base']), airtable_key)
    existing_links = build_existing_links_map(
        params['current_table'], getattr(settings, params['base']),
        params['target_field'], airtable_key)
    result_frame = frame.copy()
    mapped = frame[params['base_field']].map(
        lambda value: map_values_to_record_ids(value, record_id_map))
    # A frame without the key column merges with nothing (matches the old row.get behavior)
    row_keys = frame[airtable_key] if airtable_key in frame.columns else [None] * len(frame)
    result_frame[params['target_field']] = [
        list(existing_links.get(str(row_key), set()).union(new_links))
        for row_key, new_links in zip(row_keys, mapped)
    ]
    return result_frame
