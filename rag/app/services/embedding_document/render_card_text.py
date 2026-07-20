import re

from app.services.embedding_document.format_field_value import format_field_value

EMPTY_PARENTHESES_PATTERN = re.compile(r'\(\s*\)')
REPEATED_PERIOD_PATTERN = re.compile(r'\.(\s*\.)+')
SPACE_BEFORE_PUNCTUATION_PATTERN = re.compile(r'\s+([,.])')
DANGLING_SEPARATOR_PATTERN = re.compile(r'([:(])\s*[,.]+')
REPEATED_COMMA_PATTERN = re.compile(r'(,\s*){2,}')
MULTIPLE_WHITESPACE_PATTERN = re.compile(r'[ \t]{2,}')


def normalize_rendered_text(text: str) -> str:
    text = EMPTY_PARENTHESES_PATTERN.sub('', text)
    text = REPEATED_PERIOD_PATTERN.sub('.', text)
    text = SPACE_BEFORE_PUNCTUATION_PATTERN.sub(r'\1', text)
    text = DANGLING_SEPARATOR_PATTERN.sub(r'\1', text)
    text = REPEATED_COMMA_PATTERN.sub(', ', text)
    text = MULTIPLE_WHITESPACE_PATTERN.sub(' ', text)
    return text.strip()


def render_card_text(card: dict, template: str, field_macros: dict) -> str:
    rendered = template
    for field_name, macro in field_macros.items():
        rendered = rendered.replace(macro, format_field_value(card.get(field_name)))
    return normalize_rendered_text(rendered)
