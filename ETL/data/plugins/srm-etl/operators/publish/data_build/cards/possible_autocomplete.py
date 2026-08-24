"""possible_autocomplete phrase variants per card (legacy to_dp.possible_autocomplete)."""
from ...autocomplete_generation.query_templates import IGNORE_SITUATIONS

RESPONSE_FOR_SITUATION = '{} עבור {}'
SERVICES_FOR_SITUATION_IN_CITY = 'שירותים עבור {} ב{}'
RESPONSE_FOR_SITUATION_IN_CITY = '{} עבור {} ב{}'
RESPONSE_IN_CITY = '{} ב{}'
UNNAMED_SITUATION_CATEGORIES = ('age_group', 'language')


def collect_situation_phrases(response, situation, city, phrases):
    if situation['id'] not in IGNORE_SITUATIONS:
        if situation['id'].split(':')[1] not in UNNAMED_SITUATION_CATEGORIES:
            phrases.add(situation['name'])
        phrases.add(RESPONSE_FOR_SITUATION.format(response['name'], situation['name']))
    if city:
        phrases.add(SERVICES_FOR_SITUATION_IN_CITY.format(situation['name'], city))
        phrases.add(RESPONSE_FOR_SITUATION_IN_CITY.format(response['name'], situation['name'], city))


def possible_autocomplete(card):
    phrases = set()
    city = card['branch_city']
    for response in card['responses']:
        phrases.add(response['name'])
        for situation in card['situations']:
            collect_situation_phrases(response, situation, city, phrases)
        if city:
            phrases.add(RESPONSE_IN_CITY.format(response['name'], city))
    return sorted(set(filter(None, phrases)))
