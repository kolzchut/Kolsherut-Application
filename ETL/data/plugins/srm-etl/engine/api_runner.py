import datetime
import re

from engine.fetchers import get_fetcher
from engine.fetchers.extractors import EXTRACTORS

PROVIDED_VALUE_PATTERN = re.compile(r'^\$\{([^.}]+)\.([^}]+)\}$')
URL_MACRO_GENERATORS = {
    'current_year_plus_one': lambda: str(datetime.datetime.now().year + 1),
}


def apply_url_macros(url, url_macros):
    for macro_text, generator_name in (url_macros or {}).items():
        url = url.replace(macro_text, URL_MACRO_GENERATORS[generator_name]())
    return url


def resolve_param_value(value, provided_values):
    match = PROVIDED_VALUE_PATTERN.match(str(value))
    if match is None:
        return value
    call_name, provided_name = match.groups()
    return provided_values[call_name][provided_name]


def resolve_params(params, provided_values):
    return {
        param_name: resolve_param_value(param_value, provided_values)
        for param_name, param_value in (params or {}).items()
    }


def extract_provided_value(api_spec, payload):
    provides_spec = api_spec['provides']
    extractor = EXTRACTORS[provides_spec['extract']['op']]
    return {provides_spec['name']: extractor(payload, provides_spec['extract'])}


def run_apis(api_specs):
    fetched_frames, provided_values = {}, {}
    for api_spec in api_specs or []:
        fetcher = get_fetcher(api_spec.get('format', 'json'), api_spec.get('paginate', 'none'))
        url = apply_url_macros(api_spec['url'], api_spec.get('url_macros'))
        result = fetcher(url, resolve_params(api_spec.get('params'), provided_values), api_spec)
        fetched_frames[api_spec['name']] = result['frame']
        if 'provides' in api_spec:
            provided_values[api_spec['name']] = extract_provided_value(api_spec, result['payload'])
    return fetched_frames
