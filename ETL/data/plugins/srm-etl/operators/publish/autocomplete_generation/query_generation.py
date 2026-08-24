"""Per-card template expansion (legacy autocomplete.unwind_templates)."""
from itertools import product

from .query_filters import is_low_confidence, should_skip_combination
from .query_templates import STOP_WORDS, TEMPLATES

NONE_TEXT_IN_QUERY_MARKER = 'None'


def remove_stop_words(text):
    return ' '.join([word for word in text.split() if word not in STOP_WORDS])


def collect_organization_names(card):
    candidate_names = [
        card.get('branch_operating_unit'), card.get('organization_short_name'),
        card.get('organization_name'), card.get('organization_original_name'),
    ]
    organization_names = []
    for name in candidate_names:
        if name and name not in organization_names:
            organization_names.append(name)
    return organization_names


def template_dimensions(card, template):
    responses = card['responses_parents'] if '{response}' in template else [dict()]
    situations = card['situations_parents'] if '{situation}' in template else [dict()]
    if '{org_name}' in template or '{org_id}' in template:
        org_name = card.get('organization_short_name') or card.get('organization_name')
        org_names = collect_organization_names(card)
    else:
        org_name = None
        org_names = [None]
    org_id = card.get('organization_id') if org_name else None
    city_name = card.get('branch_city') if '{city_name}' in template else None
    return responses, situations, org_names, [org_id], [city_name]


def build_structured_query(response, situation, city_name, org_name):
    """Space-joined unique names + synonyms + city + org, stop-words removed.
    Sorted for determinism - the legacy order was hash-seed-dependent set order."""
    unique_parts = set([
        response.get('name'), situation.get('name'), city_name,
        *response.get('synonyms', []), *situation.get('synonyms', []), org_name,
    ])
    return ' '.join(remove_stop_words(part.strip()) for part in sorted(part for part in unique_parts if part))


def build_query_row(card, template, importance, combination):
    response, situation, org_name, org_id, city_name = combination
    template_values = dict(
        response=response.get('name'), situation=situation.get('name'),
        org_name=org_name, org_id=org_id, city_name=city_name,
    )
    query = template.format(**template_values)
    if NONE_TEXT_IN_QUERY_MARKER in query:
        return None
    return {
        'query': query,
        'query_heb': template.format(**dict(template_values, org_id=org_name)),
        'response': response.get('id'), 'situation': situation.get('id'),
        'org_id': org_id, 'org_name': org_name, 'city_name': city_name,
        'synonyms': response.get('synonyms', []) + situation.get('synonyms', []),
        'response_name': response.get('name'), 'situation_name': situation.get('name'),
        'structured_query': build_structured_query(response, situation, city_name, org_name),
        'visible': '{org_id}' not in template,
        'low': is_low_confidence(card, situation.get('id'), response.get('id'), org_name),
        'importance': importance,
    }


def generate_card_query_rows(card):
    rows = []
    for importance, template in enumerate(TEMPLATES):
        dimensions = template_dimensions(card, template)
        for combination in product(*dimensions):
            response, situation, _, org_id, city_name = combination
            if should_skip_combination(situation.get('id'), org_id, city_name):
                continue
            row = build_query_row(card, template, importance, combination)
            if row:
                rows.append(row)
    return rows


def generate_query_rows(cards):
    rows = []
    for card in cards:
        rows.extend(generate_card_query_rows(card))
    return rows
