"""Pure helper functions for the derive_es pipeline.

Ported from derive/helpers.py and derive/to_es.py. All functions work
with plain Python types (dicts, lists, strings) and pandas-compatible
row dicts. No dataflows imports.

AT ID Standard:
    AIRTABLE_ID_FIELD = "_airtable_id"  (single underscore)
    This replaces the old dataflows_airtable.AIRTABLE_ID_FIELD ("__airtable_id").
"""
from collections import Counter
from math import cos, pi, sin
from typing import Any, Callable, Optional
import re
import regex


# ── Constants ──────────────────────────────────────────────────────────

AIRTABLE_ID_FIELD = "_airtable_id"
"""Standardized Airtable record ID column name (single underscore).
Replaces the double-underscore __airtable_id from dataflows_airtable."""

ACCURATE_TYPES = (
    'ROOFTOP', 'RANGE_INTERPOLATED', 'STREET_MID_POINT',
    'ADDR_V1', 'ADDRESS_POINT', 'ADDRESS',
)

_DIGIT = re.compile(r'\d')
_ENGLISH = re.compile(r'[a-zA-Z+]')
_WHITESPACE = re.compile(r'\s+', re.UNICODE | re.MULTILINE)


# ── URL transforms ────────────────────────────────────────────────────

def transform_urls(urls: Optional[str]) -> Optional[list]:
    """Parse newline-separated URL strings into list of {href, title} dicts."""
    if not urls or not isinstance(urls, str):
        return None

    def _parse(s: str) -> dict:
        href, *title = s.rsplit('#', 1)
        return {'href': href, 'title': title[0] if title else 'קישור'}

    return list(map(_parse, urls.split('\n')))


# ── Phone transforms ──────────────────────────────────────────────────

def transform_phone_numbers(phone_numbers: Optional[str]) -> list:
    """Parse newline-separated phone string into formatted phone list."""
    phone_numbers = phone_numbers.split('\n') if isinstance(phone_numbers, str) and phone_numbers else []
    ret = []
    for number in phone_numbers:
        number = number.strip()
        digits = ''.join(_DIGIT.findall(number))
        if len(digits) > 10 and digits.startswith('972'):
            digits = digits[3:]
            if len(digits) < 10 and not digits.startswith('0'):
                digits = '0' + digits
        if len(digits) == 9 and digits.startswith('0'):
            digits = [digits[0:2], digits[2:5], digits[5:]]
        elif len(digits) == 10 and digits.startswith('0'):
            digits = [digits[0:3], digits[3:6], digits[6:]]
        elif len(digits) == 10 and digits.startswith('1'):
            digits = [digits[:1], digits[1:4], digits[4:]]
        else:
            digits = None
        if digits:
            number = '-'.join(digits)
        if number:
            ret.append(number)
    return ret


# ── Geometry / Location ───────────────────────────────────────────────

def calc_point_id(geometry: list) -> str:
    """Generate a string ID from [lon, lat] geometry."""
    return ''.join('{:08.5f}'.format(c) for c in geometry).replace('.', '')


def validate_geometry(geometry: Optional[list]) -> bool:
    """Check geometry is a valid [lon, lat] point within Israel bounds."""
    if isinstance(geometry, list) and len(geometry) == 2:
        # X (lon): 33-37, Y (lat): 29.3-33.3
        if 33 < geometry[0] < 37 and 29.3 < geometry[1] < 33.3:
            return True
    return False


def validate_address(address: Optional[str]) -> bool:
    """Return True if address has no English characters."""
    if address and isinstance(address, str):
        if len(_ENGLISH.findall(address)) == 0:
            return True
    return False


# ── Branch / Organization ─────────────────────────────────────────────

def calculate_branch_short_name(row: dict) -> str:
    """Return short display name for a branch."""
    osn = row.get('organization_short_name')
    if osn:
        return f'{osn}'
    return row.get('organization_name', '')


def remove_whitespaces(value: Any) -> Any:
    """Collapse whitespace in a string value. Non-strings pass through."""
    if isinstance(value, str):
        return _WHITESPACE.sub(' ', value).strip(' \t(\n-')
    return value


# ── Taxonomy ──────────────────────────────────────────────────────────

def update_taxonomy_with_parents(v: Optional[list]) -> list:
    """Expand taxonomy IDs to include all parent prefixes.

    E.g. ['human_services:food:meals'] ->
         ['human_services:food', 'human_services:food:meals']
    """
    ids = v or []
    ret = set()
    for id_ in ids:
        parts = id_.split(':')
        for i in range(2, len(parts) + 1):
            ret.add(':'.join(parts[:i]))
    return sorted(ret)


def reorder_responses_by_category(responses: list, category: str) -> list:
    """Move responses matching a category to the front."""
    return (
        [r for r in responses if r['id'].split(':')[1] == category]
        + [r for r in responses if r['id'].split(':')[1] != category]
    )


def reorder_records_by_category(records: list, category: str) -> list:
    """Move records matching a category to the front."""
    return (
        [r for r in records if r['response_category'] == category]
        + [r for r in records if r['response_category'] != category]
    )


def most_common_category(row: dict) -> Optional[str]:
    """Return the most common response_category from a row's list."""
    response_categories = row.get('response_categories', [])
    if not response_categories:
        return None
    return Counter(response_categories).most_common(1)[0][0]


# ── Address / Org Name Parsing ────────────────────────────────────────

def address_parts(row: dict) -> dict:
    """Parse structured address parts from a card row.

    Returns dict with keys: primary, secondary, (optionally national).
    """
    resolved_address = row.get('branch_address', '') or ''
    resolved_address = resolved_address if isinstance(resolved_address, str) else ''
    orig_address = row.get('branch_orig_address', '') or ''
    orig_address = orig_address if isinstance(orig_address, str) else ''
    accurate: bool = bool(row.get('branch_location_accurate'))
    national: bool = bool(row.get('national_service'))

    if national:
        return dict(primary='שירות ארצי', secondary=None, national=True)

    address = (resolved_address if accurate else orig_address) or orig_address
    raw_city = row.get('branch_city') or ''
    city: str = (raw_city if isinstance(raw_city, str) else '').replace('-', ' ')

    if not city:
        if accurate:
            return dict(primary=address, secondary=None)
        return dict(primary=address, secondary='(במיקום לא מדויק)')

    cc = regex.compile(r'\m(%s){e<2}' % city)
    m = cc.search(address.replace('-', ' '))
    if m:
        prefix = address[:m.start()].strip(' -,\n\t')
        suffix = address[m.end():].strip(' -,\n\t')
        if len(suffix) < 4:
            street_address = prefix
        else:
            street_address = prefix + ', ' + suffix
        if not accurate:
            street_address += ' (במיקום לא מדויק)'
        street_address = street_address.strip(' -,\n\t')
        return dict(primary=city, secondary=street_address)
    else:
        if accurate:
            return dict(primary=address, secondary=None)
        else:
            return dict(primary=address, secondary='(במיקום לא מדויק)')


def org_name_parts(row: dict) -> dict:
    """Parse structured org name parts (primary=short, secondary=remainder)."""
    name = row.get('organization_name', '') or ''
    name = name if isinstance(name, str) else ''
    short_name = row.get('organization_short_name', '') or ''
    short_name = short_name if isinstance(short_name, str) else ''
    m = None
    if short_name:
        short_name = short_name.split('(')[0].replace(')', '').strip()
        if short_name:
            cc = regex.compile(r'\m(%s){e<2}' % short_name)
            m = cc.search(name)
    if m:
        prefix = name[:m.start()].strip(' -,\n\t')
        suffix = name[m.end():].strip(' -,\n\t')
        remainder = (prefix + ' ' + suffix).strip() or None
        return dict(primary=short_name, secondary=remainder)
    else:
        return dict(primary=name, secondary=None)


# ── Point Offsets ─────────────────────────────────────────────────────

def point_offset_table() -> list:
    """Lookup table for positioning up to seven overlapping branch points."""
    diameters = [(d / 2 - 0.5) for d in [2, 2.15470, 2.41421, 2.70130, 3.00000]]
    first = [[1, [[0.0, 0.0]]]]
    generated = [
        [
            n,
            [
                [round(d * sin(i / n * 2 * pi), 3), -round(d * cos(i / n * 2 * pi), 3)]
                for i in range(n)
            ],
        ]
        for n, d in zip([2, 3, 4, 5, 6], diameters)
    ]
    last = [[7, [[0.0, 0.0]] + generated[4][1]]]
    return first + generated + last


POINT_OFFSETS = dict(point_offset_table())


def generate_offset(item_key: str, siblings_key: str) -> Callable:
    """Return a function that computes the offset string for a point within a cluster."""
    def func(r: dict) -> Optional[str]:
        count = len(r[siblings_key])
        index = r[siblings_key].index(r[item_key]) + 1
        offset = f'{count}-{index}' if count in POINT_OFFSETS else None
        return offset
    return func


# ── Card Scoring ──────────────────────────────────────────────────────

def card_score(row: dict) -> float:
    """Compute ES search relevance score for a card.

    Ported from derive/to_es.py -> card_score().
    Factors: meser prefix, description presence, national service,
    phone number type, branch count, org kind, boost.
    """
    branch_count = row.get('organization_branch_count') or 1
    national_service = bool(row.get('national_service'))
    service_id = row.get('service_id', '')
    is_meser = service_id.startswith('meser-') if service_id else False
    service_desc = row.get('service_description') or ''
    has_description = len(service_desc) > 5

    score = 1.0
    if not is_meser:
        score *= 10
    if has_description:
        score *= 10
    if national_service:
        score *= 10
        phone_numbers = list(filter(None,
            (row.get('service_phone_numbers') or [])
            + (row.get('organization_phone_numbers') or [])
        ))
        if phone_numbers:
            phone_number = phone_numbers[0]
            if len(phone_number) <= 5 or phone_number.startswith('1'):
                score *= 5
    else:
        if branch_count > 100:
            score *= branch_count / 10
        else:
            score *= branch_count ** 0.5

    organization_kind = row.get('organization_kind', '')
    if organization_kind in ('משרד ממשלתי', 'רשות מקומית', 'תאגיד סטטוטורי'):
        score *= 5

    score = max(score, 1.0)
    boost = float(row.get('service_boost') or 0)
    boost = 10 ** boost
    score *= boost

    return score
