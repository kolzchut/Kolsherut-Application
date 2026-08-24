import pandas as pd

from engine.columns import build_columns
from engine.rows import apply_row_transforms

STATIC_DATA_PREFIX = 'static_data.'


def static_data_to_frame(static_data_value):
    records = list(static_data_value.values()) if isinstance(static_data_value, dict) else static_data_value
    return pd.DataFrame(records)


def resolve_derive_from(derive_from, fetched_frames, built_outputs, spec):
    if derive_from.startswith(STATIC_DATA_PREFIX):
        return static_data_to_frame(spec['static_data'][derive_from[len(STATIC_DATA_PREFIX):]])
    if derive_from in built_outputs:
        return built_outputs[derive_from]
    if derive_from in fetched_frames:
        return fetched_frames[derive_from]
    raise KeyError(f'Unknown derive_from source: "{derive_from}"')


def build_spec_context(spec):
    return {'lookups': spec.get('lookups', {}), 'static_data': spec.get('static_data', {})}


def build_output(output_spec, fetched_frames, built_outputs, spec, context):
    input_frame = resolve_derive_from(
        output_spec['derive_from'], fetched_frames, built_outputs, spec
    )
    output_context = dict(context, fetched_frames=fetched_frames, built_outputs=built_outputs)
    transformed_frame = apply_row_transforms(
        input_frame, output_spec.get('row_transforms'), output_context)
    return build_columns(transformed_frame, output_spec['columns'], output_context)


def build_outputs(spec, fetched_frames):
    context = build_spec_context(spec)
    built_outputs = {}
    for output_spec in spec['outputs']:
        built_outputs[output_spec['name']] = build_output(
            output_spec, fetched_frames, built_outputs, spec, context
        )
    return built_outputs
