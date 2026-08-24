import pandas as pd

from transformers.generate import GENERATORS
from transformers.registry import COLUMN_OPS


def resolve_source_series(input_frame, result_frame, column_name):
    if column_name in input_frame.columns:
        return input_frame[column_name]
    if column_name in result_frame.columns:
        return result_frame[column_name]
    raise KeyError(f'Column "{column_name}" not found in input columns or previously built targets')


def resolve_source_data(input_frame, result_frame, source):
    if isinstance(source, list):
        return pd.DataFrame({
            column_name: resolve_source_series(input_frame, result_frame, column_name)
            for column_name in source
        })
    return resolve_source_series(input_frame, result_frame, source)


def is_source_missing(input_frame, result_frame, source):
    sources = source if isinstance(source, list) else [source]
    return any(name not in input_frame.columns and name not in result_frame.columns
               for name in sources)


def build_column(input_frame, result_frame, column_spec, context):
    if 'value' in column_spec:
        return pd.Series([column_spec['value']] * len(input_frame), index=input_frame.index)
    if 'generate' in column_spec:
        generated_value = GENERATORS[column_spec['generate']]()
        return pd.Series([generated_value] * len(input_frame), index=input_frame.index)
    if column_spec.get('optional') and is_source_missing(input_frame, result_frame, column_spec['source']):
        return pd.Series([None] * len(input_frame), index=input_frame.index)
    data = resolve_source_data(input_frame, result_frame, column_spec['source'])
    for transform_spec in column_spec.get('transforms', []):
        column_op = COLUMN_OPS[transform_spec['op']]
        params = {key: value for key, value in transform_spec.items() if key != 'op'}
        data = column_op(data, params, context)
    return data


def build_columns(input_frame, column_specs, context):
    result_frame = pd.DataFrame(index=input_frame.index)
    for column_spec in column_specs:
        result_frame[column_spec['target']] = build_column(
            input_frame, result_frame, column_spec, context
        )
    intermediate_targets = [spec['target'] for spec in column_specs if spec.get('intermediate')]
    return result_frame.drop(columns=intermediate_targets) if intermediate_targets else result_frame
