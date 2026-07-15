"""Value-level normalizers shared by the table preprocess modules (legacy helpers.py)."""
import re

DIGIT_PATTERN = re.compile(r'\d')
ENGLISH_LETTER_PATTERN = re.compile(r'[a-zA-Z+]')
WHITESPACE_PATTERN = re.compile(r'\s+', re.UNICODE | re.MULTILINE)
DEFAULT_URL_TITLE = 'קישור'
ISRAEL_COUNTRY_PREFIX = '972'


def transform_urls(urls):
    if not urls:
        return None
    transformed = []
    for line in urls.split('\n'):
        href, *title = line.rsplit('#', 1)
        transformed.append({'href': href, 'title': title[0] if title else DEFAULT_URL_TITLE})
    return transformed


def strip_country_prefix(digits):
    if len(digits) > 10 and digits.startswith(ISRAEL_COUNTRY_PREFIX):
        digits = digits[3:]
        if len(digits) < 10 and not digits.startswith('0'):
            digits = '0' + digits
    return digits


def format_phone_digits(digits):
    if len(digits) == 9 and digits.startswith('0'):
        return '-'.join([digits[0:2], digits[2:5], digits[5:]])
    if len(digits) == 10 and digits.startswith('0'):
        return '-'.join([digits[0:3], digits[3:6], digits[6:]])
    if len(digits) == 10 and digits.startswith('1'):
        return '-'.join([digits[:1], digits[1:4], digits[4:]])
    return None


def transform_phone_numbers(phone_numbers):
    lines = phone_numbers.split('\n') if phone_numbers else []
    transformed = []
    for line in lines:
        line = line.strip()
        digits = ''.join(DIGIT_PATTERN.findall(line))
        formatted = format_phone_digits(strip_country_prefix(digits))
        line = formatted or line
        if line:
            transformed.append(line)
    return transformed


def remove_whitespaces(value):
    if isinstance(value, str):
        return WHITESPACE_PATTERN.sub(' ', value).strip(' \t(\n-')
    return value


def validate_address(address):
    return bool(address) and len(ENGLISH_LETTER_PATTERN.findall(address)) == 0


def split_lines(value):
    return value.split('\n') if value else []
