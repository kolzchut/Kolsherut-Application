def extract_path(value, path):
    for step in path:
        if value is None:
            return None
        if isinstance(step, int):
            value = value[step] if isinstance(value, (list, tuple)) and len(value) > step else None
        elif isinstance(value, dict):
            value = value.get(step)
        else:
            return None
    return value


def flatten_nested_field(frame, params, context):
    result_frame = frame.copy()
    for target_column, path in params['fields'].items():
        source_column, nested_path = path[0], path[1:]
        result_frame[target_column] = frame[source_column].map(
            lambda value: extract_path(value, nested_path)
        )
    return result_frame


def dedupe_rows(frame, params, context):
    return frame.drop_duplicates(subset=params['by'])
