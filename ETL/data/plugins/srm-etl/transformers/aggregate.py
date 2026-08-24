import pandas as pd


def unique_join(values, separator='\n'):
    joined = separator.join(str(value) for value in values if value)
    parts = set(part for part in joined.split(separator) if part)
    return separator.join(sorted(parts))


def join_comma_nonzero(values):
    return ', '.join(
        str(value) for value in values
        if not pd.isna(value) and str(value).strip() not in ('', '0'))


AGGREGATORS = {
    'first': lambda values: values[0] if values else None,
    'unique_list': lambda values: sorted(set(value for value in values if value is not None)),
    'unique_join': unique_join,
    'flatten_unique': lambda values: list({item for inner in values for item in inner if item}),
    'join_comma_nonzero': join_comma_nonzero,
}


def aggregate_column(group, aggregate_spec):
    if isinstance(aggregate_spec, dict):
        source_values = list(group[aggregate_spec['source_field']])
        return AGGREGATORS[aggregate_spec['op']](source_values)
    return AGGREGATORS[aggregate_spec](list(group))


def aggregate_group(group_frame, params):
    aggregated_row = {key: group_frame[key].iloc[0] for key in params['by']}
    for target_column, aggregate_spec in params['aggregate'].items():
        source = group_frame if isinstance(aggregate_spec, dict) else group_frame[target_column]
        aggregated_row[target_column] = aggregate_column(source, aggregate_spec)
    return aggregated_row


def groupby_aggregate(frame, params, context):
    grouped = frame.groupby(params['by'], sort=False, dropna=False)
    aggregated_rows = [aggregate_group(group_frame, params) for _, group_frame in grouped]
    return pd.DataFrame(aggregated_rows)
