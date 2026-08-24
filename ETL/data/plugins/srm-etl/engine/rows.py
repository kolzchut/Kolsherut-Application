from transformers.registry import ROW_OPS


def apply_row_transforms(frame, row_transform_specs, context):
    for transform_spec in row_transform_specs or []:
        row_op = ROW_OPS[transform_spec['op']]
        params = {key: value for key, value in transform_spec.items() if key != 'op'}
        frame = row_op(frame, params, context)
    return frame
