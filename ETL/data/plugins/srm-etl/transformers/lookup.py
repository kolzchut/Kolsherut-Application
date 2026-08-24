from transformers.references import resolve_named_data
from transformers.values import none_if_missing, normalize_scalar


def lookup_map(series, params, context):
    mapping = resolve_named_data(params['lookup'], context)
    default_value = params.get('default')
    return series.map(lambda value: mapping.get(value, default_value))


def find_record(records, key, default_key):
    record = records.get(key) if key is not None else None
    if record is None and default_key is not None:
        return records.get(default_key)
    return record


def lookup_field(series, params, context):
    records = resolve_named_data(params['lookup'], context)
    default_key = params.get('default_key')

    def lookup_one(key):
        record = find_record(records, key, default_key)
        return record.get(params['path']) if record else None

    return series.map(lookup_one)


def lookup_flag_union(series, params, context):
    mapping = resolve_named_data(params['lookup'], context)
    flag_map = params['flag_map']

    def build(key):
        record = mapping.get(str(normalize_scalar(key))) or {}
        flagged = [flag_map[column] for column, flag in record.items() if flag and column in flag_map]
        return flagged + [item for item in params.get('always_include', []) if item not in flagged]

    return series.map(build)


def lookup_override(frame, params, context):
    mapping = resolve_named_data(params['lookup'], context)

    def override(row):
        overridden = mapping.get(str(normalize_scalar(row[params['key_field']])))
        if isinstance(overridden, dict):
            overridden = overridden.get(params['path'])
        if none_if_missing(overridden) is not None:
            return overridden
        return none_if_missing(row[params['value_field']])

    return frame.apply(override, axis=1)


def lookup_union(series, params, context):
    mapping = resolve_named_data(params['lookup'], context)
    prepend = params.get('prepend', [])

    def union_for_keys(keys):
        collected = set(item for key in (keys or []) for item in mapping.get(key, []))
        return list(prepend) + sorted(collected - set(prepend))

    return series.map(union_for_keys)
