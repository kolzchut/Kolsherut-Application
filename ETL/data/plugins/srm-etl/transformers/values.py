import math


def none_if_missing(value):
    if value is None or value == '':
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def normalize_scalar(value):
    # Pandas turns nullable int columns into floats (12 -> 12.0); restore
    # integral values so formatted text matches the raw source value.
    value = none_if_missing(value)
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value
