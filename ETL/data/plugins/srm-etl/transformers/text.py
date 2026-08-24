import re

DEFAULT_PART_SPLITTER = '[.,\n]'
DEFAULT_SEPARATOR = '\n'


def regex_extract_join(series, params, context):
    pattern = re.compile(params['pattern'])
    separator = params.get('separator', DEFAULT_SEPARATOR)
    return series.map(
        lambda value: (separator.join(pattern.findall(str(value))) or None) if value else None
    )


def collect_labeled_part(values, min_len, splitter_pattern):
    snippets = []
    for value in values or []:
        if value:
            pieces = re.split(splitter_pattern, value)
            snippets.extend(piece.upper() for piece in pieces if len(piece) > min_len)
    return snippets


def build_labeled_text(row, parts, splitter_pattern):
    result = ''
    for part in parts:
        snippets = collect_labeled_part(row[part['field']], part.get('min_len', 0), splitter_pattern)
        if snippets:
            result += part['label'] + ': ' + ', '.join(sorted(set(snippets))) + '\n\n'
    return result or None


def labeled_concat(frame, params, context):
    splitter_pattern = params.get('splitter', DEFAULT_PART_SPLITTER)
    return frame.apply(lambda row: build_labeled_text(row, params['parts'], splitter_pattern), axis=1)


def join_address(frame, params, context):
    street_column, city_column = frame.columns[0], frame.columns[1]

    def join_one(row):
        street, city = row[street_column], row[city_column]
        if not city or (params.get('skip_city_if_contained') and city in street):
            return street
        return f'{street}, {city}'

    return frame.apply(join_one, axis=1)


def regex_search_first(series, params, context):
    pattern = re.compile(params['pattern'])

    def search(value):
        match = pattern.search(value) if value else None
        return match.group(0) if match else None

    return series.map(search)


def strip(series, params, context):
    return series.map(lambda value: value.strip() if isinstance(value, str) else value)


def cast(series, params, context):
    if params['to'] == 'string':
        return series.map(lambda value: str(value) if value else None)
    raise ValueError(f'Unsupported cast target: {params["to"]}')
