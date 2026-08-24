def template_field(frame, params, context):
    result_frame = frame.copy()
    result_frame[params['target']] = frame.apply(
        lambda row: params['template'].format(**row.to_dict()), axis=1
    )
    return result_frame
