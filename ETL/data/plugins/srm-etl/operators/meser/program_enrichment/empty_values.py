import pandas as pd


def is_empty(value):
    if value is None:
        return True
    if not isinstance(value, str) and pd.isna(value):
        return True
    return str(value).strip().lower() in ('', 'none', 'nan')
