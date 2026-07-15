"""address_parts presentation field (legacy helpers.address_parts).

Fuzzy-locates the city inside the address (up to 2 errors), splits street vs
city, and appends an inaccuracy note when the location is not accurate.
"""
import regex

NATIONAL_SERVICE_PRIMARY = 'שירות ארצי'
INACCURATE_LOCATION_SUFFIX = ' (במיקום לא מדויק)'
INACCURATE_LOCATION_SECONDARY = '(במיקום לא מדויק)'
STRIP_CHARACTERS = ' -,\n\t'
MINIMUM_SUFFIX_LENGTH = 4
CITY_FUZZY_PATTERN = r'\m(%s){e<2}'


def split_address_by_city(address, city, accurate):
    city_pattern = regex.compile(CITY_FUZZY_PATTERN % city)
    match = city_pattern.search(address.replace('-', ' '))
    if not match:
        return None
    prefix = address[:match.start()].strip(STRIP_CHARACTERS)
    suffix = address[match.end():].strip(STRIP_CHARACTERS)
    street_address = prefix if len(suffix) < MINIMUM_SUFFIX_LENGTH else prefix + ', ' + suffix
    if not accurate:
        street_address += INACCURATE_LOCATION_SUFFIX
    return dict(primary=city, secondary=street_address.strip(STRIP_CHARACTERS))


def address_parts(card):
    if card['national_service']:
        return dict(primary=NATIONAL_SERVICE_PRIMARY, secondary=None, national=True)
    resolved_address = card['branch_address']
    orig_address = card['branch_orig_address']
    accurate = card['branch_location_accurate']
    address = (resolved_address if accurate else orig_address) or orig_address
    city = card['branch_city'].replace('-', ' ')
    parts = split_address_by_city(address, city, accurate)
    if parts:
        return parts
    if accurate:
        return dict(primary=address, secondary=None)
    return dict(primary=address, secondary=INACCURATE_LOCATION_SECONDARY)
