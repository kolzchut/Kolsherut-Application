"""Organization name presentation fields (legacy helpers.org_name_parts + card_data_flow)."""
import regex

from srm_tools.data_cleaning import clean_org_name

STRIP_CHARACTERS = ' -,\n\t'
SHORT_NAME_FUZZY_PATTERN = r'\m(%s){e<2}'


def org_name_parts(card):
    name = card['organization_name']
    short_name = card['organization_short_name']
    match = None
    if short_name:
        short_name = short_name.split('(')[0].replace(')', '').strip()
        if short_name:
            short_name_pattern = regex.compile(SHORT_NAME_FUZZY_PATTERN % short_name)
            match = short_name_pattern.search(name)
    if not match:
        return dict(primary=name, secondary=None)
    prefix = name[:match.start()].strip(STRIP_CHARACTERS)
    suffix = name[match.end():].strip(STRIP_CHARACTERS)
    remainder = (prefix + ' ' + suffix).strip() or None
    return dict(primary=short_name, secondary=remainder)


def organization_resolved_name(card):
    if card.get('branch_operating_unit'):
        return list(filter(None, [card.get('branch_operating_unit')]))
    return list(filter(None, [card.get('organization_short_name'), card.get('organization_name')]))


def add_organization_name_fields(card):
    card = {
        **card,
        'organization_original_name': card['organization_name'],
        'organization_name': clean_org_name(card['organization_name']),
        'organization_short_name': clean_org_name(card['organization_short_name']),
    }
    return {
        **card,
        'organization_name_parts': org_name_parts(card),
        'organization_resolved_name': organization_resolved_name(card),
    }
