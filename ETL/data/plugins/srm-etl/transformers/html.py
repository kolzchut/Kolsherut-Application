import bleach

from transformers.values import none_if_missing

NEWLINE_CLOSING_TAGS = ('p', 'li')
NBSP_ENTITY = '&nbsp;'


def insert_newlines_after_blocks(text):
    for tag in NEWLINE_CLOSING_TAGS:
        text = text.replace(f'</{tag}>', f'</{tag}>\n')
    return text.strip()


def strip_html(series, params, context):
    def clean(value):
        value = none_if_missing(value)
        if not value:
            return None
        cleaned = bleach.clean(
            insert_newlines_after_blocks(value), tags=tuple(), strip=True
        ).replace(NBSP_ENTITY, ' ')
        return cleaned or None

    return series.map(clean)
