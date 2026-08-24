from transformers.values import none_if_missing, normalize_scalar


def pluck_where(series, params, context):
    def pluck(items):
        if not isinstance(items, list):
            return []
        return [
            item[params['item_key']] for item in items
            if item.get(params['where_key']) == params['where_value']
        ]

    return series.map(pluck)


def resolve_source_frame(source_name, context):
    if source_name in context.get('fetched_frames', {}):
        return context['fetched_frames'][source_name]
    return context['built_outputs'][source_name]


def enrich_from_source(frame, params, context):
    source_frame = resolve_source_frame(params['source'], context)
    source_key_field = params.get('source_key_field', params['key_field'])
    records_by_key = {
        str(normalize_scalar(record[source_key_field])): record
        for record in source_frame.to_dict(orient='records')
        if none_if_missing(record.get(source_key_field)) is not None
    }
    result_frame = frame.copy()
    for field in params['fields']:
        if field not in result_frame.columns:
            result_frame[field] = None

    def enrich_row(row):
        record = records_by_key.get(str(normalize_scalar(row[params['key_field']])))
        if record is None:
            return row
        for field in params['fields']:
            row[field] = record.get(field)
        return row

    return result_frame.apply(enrich_row, axis=1)
