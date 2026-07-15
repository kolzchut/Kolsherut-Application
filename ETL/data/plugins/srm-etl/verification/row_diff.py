"""Row-diff engine shared by the verification checks.

Values are normalized before comparing (Decimal->float rounded, datetime->iso,
tuple/set->sorted list, ''->None) so type drift between the legacy CSV round
trip and the in-memory pipeline does not show up as noise. Fields listed in
set_compare_fields are compared as unordered sets.
"""
from datetime import date, datetime
from decimal import Decimal

FLOAT_PRECISION = 6


def normalize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return round(float(value), FLOAT_PRECISION)
    if isinstance(value, float):
        return round(value, FLOAT_PRECISION)
    if isinstance(value, (tuple, set)):
        return sorted(normalize_value(item) for item in value)
    if isinstance(value, list):
        return [normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: normalize_value(item) for key, item in value.items()}
    if value == '':
        return None
    return value


def normalize_field(value, field_name, set_compare_fields):
    normalized = normalize_value(value)
    if field_name in set_compare_fields and isinstance(normalized, list):
        return sorted(map(repr, normalized))
    return normalized


def diff_row_fields(legacy_row, new_row, set_compare_fields, ignore_fields):
    field_diffs = []
    for field_name in sorted(set(legacy_row) | set(new_row)):
        if field_name in ignore_fields:
            continue
        legacy_value = normalize_field(legacy_row.get(field_name), field_name, set_compare_fields)
        new_value = normalize_field(new_row.get(field_name), field_name, set_compare_fields)
        if legacy_value != new_value:
            field_diffs.append({'field': field_name, 'legacy': legacy_value, 'new': new_value})
    return field_diffs


def diff_keyed_rows(legacy_rows, new_rows, key_field, set_compare_fields=(), ignore_fields=()):
    legacy_by_key = {str(row[key_field]): row for row in legacy_rows}
    new_by_key = {str(row[key_field]): row for row in new_rows}
    summary = {'identical': 0, 'changed': 0, 'only_legacy': 0, 'only_new': 0}
    details = {'changed': [], 'only_legacy': [], 'only_new': []}
    for key in sorted(set(legacy_by_key) | set(new_by_key)):
        if key not in new_by_key:
            summary['only_legacy'] += 1
            details['only_legacy'].append(key)
        elif key not in legacy_by_key:
            summary['only_new'] += 1
            details['only_new'].append(key)
        else:
            field_diffs = diff_row_fields(legacy_by_key[key], new_by_key[key], set_compare_fields, ignore_fields)
            if field_diffs:
                summary['changed'] += 1
                details['changed'].append({'key': key, 'fields': field_diffs})
            else:
                summary['identical'] += 1
    return summary, details
