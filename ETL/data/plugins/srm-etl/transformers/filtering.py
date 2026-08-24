PREDICATES = {
    'not_null': lambda series, params: series.notna(),
    'not_contains': lambda series, params: ~series.fillna('').astype(str).str.contains(params['value'], regex=False),
    'equals': lambda series, params: series == params['value'],
    'in_list': lambda series, params: series.isin(params['values']),
    'not_equals': lambda series, params: series != params['value'],
    'str_len_between': lambda series, params: series.astype(str).str.len().between(
        params.get('min', 0), params.get('max', 10 ** 9)),
}


def filter_rows(frame, params, context):
    predicate = PREDICATES[params['predicate']]
    keep_mask = predicate(frame[params['field']], params)
    return frame[keep_mask]
