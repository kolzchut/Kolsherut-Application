from transformers.values import none_if_missing, normalize_scalar


def join_nonempty(frame, params, context):
    separator = params.get('separator', '\n')

    def join_row(row):
        values = [none_if_missing(value) for value in row]
        joined = separator.join(str(value) for value in values if value)
        return joined or None

    return frame.apply(join_row, axis=1)


def split_concat_fields(frame, params, context):
    split_on = params.get('split_on', ',')
    join_with = params.get('join_with', '\n')
    remove = params.get('remove', ' ')

    def build(row):
        parts = []
        for column in frame.columns:
            value = none_if_missing(row[column])
            parts.extend((str(value) if value is not None else '').split(split_on))
        return join_with.join(parts).replace(remove, '')

    return frame.apply(build, axis=1)


def join_present_fields(frame, params, context):
    separator = params.get('separator', ' ')

    def join_row(row):
        values = [normalize_scalar(row[column]) for column in frame.columns]
        return separator.join(str(value).strip() for value in values if value)

    return frame.apply(join_row, axis=1)


def labeled_lines(frame, params, context):
    def build(row):
        result = ''
        for part in params['parts']:
            value = normalize_scalar(row.get(part['field']))
            skip_values = part.get('skip_values')
            if skip_values is not None and value in skip_values:
                continue
            result += f'{part["label"]}: {value}\n'
        return result or None

    return frame.apply(build, axis=1)
