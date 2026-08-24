import re

from transformers.values import none_if_missing, normalize_scalar


def regex_replace(series, params, context):
    pattern = re.compile(params['pattern'])
    replacement = params.get('replacement', '')
    return series.map(
        lambda value: pattern.sub(replacement, str(value) if none_if_missing(value) is not None else '')
    )


def ensure_prefix(series, params, context):
    prefix = params['prefix']
    return series.map(
        lambda value: str(value) if str(value).startswith(prefix) else prefix + str(value)
    )


def strip_padded_id(series, params, context):
    padding_prefix = params['padding_prefix']
    min_len = params['min_len']
    cut = params.get('cut', len(padding_prefix))

    def strip_one(value):
        text = str(normalize_scalar(value))
        if len(text) >= min_len and text.startswith(padding_prefix):
            return text[cut:-cut]
        return text

    return series.map(strip_one)


def replace_by_prefix_rules(series, params, context):
    def replace_one(value):
        if none_if_missing(value) is None:
            return value
        name = str(value).strip()
        for rule in params['rules']:
            if name.startswith(tuple(rule['prefixes'])):
                for source_text, target_text in rule['replacements'].items():
                    name = name.replace(source_text, target_text)
                return name
        return name

    return series.map(replace_one)
