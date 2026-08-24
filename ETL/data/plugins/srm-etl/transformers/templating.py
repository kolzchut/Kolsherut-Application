from transformers.values import none_if_missing, normalize_scalar


def template(frame, params, context):
    empty_missing = params.get('empty_missing', False)

    def format_row(row):
        values = {}
        for column in frame.columns:
            value = normalize_scalar(row[column])
            values[column] = '' if value is None and empty_missing else value
        return params['template'].format(**values) or None

    return frame.apply(format_row, axis=1)


def conditional_template(series, params, context):
    def build(value):
        if value == params['when_equals']:
            return params.get('then_value', '')
        return params['else_template'].format(value=value)

    return series.map(build)


def wrap_in_list(series, params, context):
    return series.map(lambda value: [none_if_missing(value)])


def drop_last_segment(series, params, context):
    separator = params.get('separator', '-')

    def drop_one(value):
        if none_if_missing(value) is None:
            return None
        return separator.join(str(value).split(separator)[:-1])

    return series.map(drop_one)
