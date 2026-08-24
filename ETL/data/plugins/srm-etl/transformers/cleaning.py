from transformers.references import resolve_named_data


def nullify_missing_values(frame, params, context):
    sentinel_values = resolve_named_data(params['values'], context)
    return frame.map(lambda value: None if value in sentinel_values else value)


def nullify_values(series, params, context):
    sentinel_values = resolve_named_data(params['values'], context)
    return series.map(lambda value: None if value in sentinel_values else value)


def replace_values(series, params, context):
    replacements = resolve_named_data(params['replacements'], context)
    return series.map(lambda value: replacements.get(value, value))
