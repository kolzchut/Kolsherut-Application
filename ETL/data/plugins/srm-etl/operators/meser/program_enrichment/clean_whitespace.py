import re


def clean_text_value(value):
    if not isinstance(value, str):
        return value
    collapsed_spaces = re.sub(r'[ \t]+', ' ', value)
    trimmed_line_breaks = re.sub(r' ?\n ?', '\n', collapsed_spaces)
    return trimmed_line_breaks.strip()


def clean_dataframe_whitespace(df):
    return df.apply(
        lambda column: column.map(clean_text_value) if column.dtype == object else column
    )
