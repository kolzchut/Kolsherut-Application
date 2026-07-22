"""Auto-tagging rules from the Data-Entry base (legacy autotagging.py).

A rule matches a card field when the field value ends with the rule query or
contains the query followed by a space. Added ids are also recorded on the
card's auto_tagged list, which zeroes their RS score later.
"""
from conf import settings

from ...airtable.airtable_client import fetch_rows_from_airtable

AUTO_TAGGING_TABLE = 'Auto Tagging'
RULE_FIELD_FLAGS = (
    ('In Org Name', 'organization_name'),
    ('In Org Purpose', 'organization_purpose'),
    ('In Service Name', 'service_name'),
)


def fetch_auto_tagging_rules():
    rows = fetch_rows_from_airtable(settings.AIRTABLE_DATAENTRY_BASE, AUTO_TAGGING_TABLE)
    return [
        {
            'query': row.get('Query'),
            'fields': [field_name for flag_name, field_name in RULE_FIELD_FLAGS if row.get(flag_name)],
            'situation_ids': row.get('situation_ids'),
            'response_ids': row.get('response_ids'),
        }
        for row in rows
    ]


def rule_matches_card(rule, card):
    for field_name in rule['fields']:
        value = card.get(field_name)
        if value and isinstance(value, str):
            if value.endswith(rule['query']) or rule['query'] + ' ' in value:
                return True
    return False


def merge_unique(values, additions):
    merged = list(values)
    for addition in additions or []:
        if addition not in merged:
            merged.append(addition)
    return merged


def apply_rule_to_card(card, rule):
    if not rule_matches_card(rule, card):
        return card
    return {
        **card,
        'situation_ids': merge_unique(card['situation_ids'], rule['situation_ids']),
        'response_ids': merge_unique(card['response_ids'], rule['response_ids']),
        'auto_tagged': merge_unique(card['auto_tagged'], (rule['situation_ids'] or []) + (rule['response_ids'] or [])),
    }


def apply_auto_tagging(cards, rules):
    tagged_cards = []
    for card in cards:
        card = {**card, 'auto_tagged': card.get('auto_tagged') or []}
        for rule in rules:
            card = apply_rule_to_card(card, rule)
        tagged_cards.append(card)
    return tagged_cards
