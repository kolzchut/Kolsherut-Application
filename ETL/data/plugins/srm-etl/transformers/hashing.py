import hashlib

from slugify import slugify

HASH_LENGTH = 8


def hash_row_fields(row, prefix, separator):
    joined = separator.join(filter(None, (str(value) if value is not None else None for value in row)))
    return prefix + hashlib.sha1(joined.encode('utf-8')).hexdigest()[:HASH_LENGTH]


def hash_fields(frame, params, context):
    prefix = params.get('prefix', '')
    separator = params.get('separator', '|')
    return frame.apply(lambda row: hash_row_fields(list(row), prefix, separator), axis=1)


def hash_slice(series, params, context):
    prefix = params.get('prefix', '')
    last_chars = params['last_chars']

    def hash_one(value):
        sliced = str(value)[-last_chars:]
        return prefix + hashlib.sha1(sliced.encode('utf-8')).hexdigest()[:HASH_LENGTH]

    return series.map(hash_one)


def slugify_with_prefix(series, params, context):
    prefix = params.get('prefix', '')
    return series.map(lambda value: prefix + slugify(value))
