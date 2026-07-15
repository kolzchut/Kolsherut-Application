"""Card build orchestration (legacy card_data_flow): pass A decides which cards
exist and what they are tagged with; pass B enriches them for search & display.
"""
from srm_tools.hash import hasher
from srm_tools.logger import logger

from .auto_tagging import apply_auto_tagging, fetch_auto_tagging_rules
from .duplicate_services_merger import merge_duplicate_services
from .geo_fields import is_card_location_valid
from .presentation_fields import add_presentation_fields
from .response_categories import add_response_category_fields, reorder_responses_by_category
from .rs_score_calculator import apply_rs_scores
from .taxonomy_lookup import build_taxonomy_lookup, copy_taxonomy_entry, merge_unique_sorted
from .taxonomy_normalization import fix_situations, map_taxonomy_ids, normalize_taxonomy_ids
from .taxonomy_parents import add_taxonomy_parent_fields

CARDS_NO_RESPONSES_STAT = 'Processing: Cards: No Responses'
CARDS_NO_RESPONSE_CATEGORY_STAT = 'Processing: Cards: No Response Category'
CARDS_INVALID_LOCATION_STAT = 'Processing: Cards: Invalid Location'
MESER_SERVICE_MARKER = 'meser-s-'
PASS_A_FIELDS_TO_DROP = (
    'service_situations', 'branch_situations', 'organization_situations', 'service_responses', 'auto_tagged',
)


def add_card_taxonomies(card, situations_lookup, responses_lookup):
    situation_ids = merge_unique_sorted(
        card['service_situations'], card['branch_situations'], card['organization_situations'],
    )
    situation_ids = normalize_taxonomy_ids(situation_ids)
    situation_ids = map_taxonomy_ids(situation_ids, situations_lookup)
    return {
        **card,
        'situation_ids': fix_situations(situation_ids),
        'response_ids': map_taxonomy_ids(merge_unique_sorted(card['service_responses']), responses_lookup),
    }


def run_pass_a(flat_table, situations_lookup, responses_lookup, stats):
    cards = [dict(row, card_id=hasher(row['branch_id'], row['service_id'])) for row in flat_table]
    cards = merge_duplicate_services(cards)
    cards = [add_card_taxonomies(card, situations_lookup, responses_lookup) for card in cards]
    cards = apply_auto_tagging(cards, fetch_auto_tagging_rules())
    return stats.filter_rows_with_stat(
        CARDS_NO_RESPONSES_STAT, cards, lambda card: bool(card['response_ids']),
    )


def attach_taxonomy_entries(card, situations_lookup, responses_lookup):
    return {
        **card,
        'situations': [copy_taxonomy_entry(situations_lookup[sid]) for sid in card['situation_ids']],
        'responses': [copy_taxonomy_entry(responses_lookup[rid]) for rid in card['response_ids']],
    }


def drop_pass_a_fields(card):
    return {name: value for name, value in card.items() if name not in PASS_A_FIELDS_TO_DROP}


def run_pass_b(cards, situations_lookup, responses_lookup, stats):
    cards = [attach_taxonomy_entries(card, situations_lookup, responses_lookup) for card in cards]
    cards = apply_rs_scores(cards)
    cards = [add_taxonomy_parent_fields(card, situations_lookup, responses_lookup) for card in cards]
    cards = [drop_pass_a_fields(card) for card in cards]
    cards = [add_response_category_fields(card) for card in cards]
    cards = stats.filter_rows_with_stat(
        CARDS_NO_RESPONSE_CATEGORY_STAT, cards, lambda card: bool(card['response_category']),
    )
    cards = [
        {**card, 'responses': reorder_responses_by_category(card['responses'], card['response_category'])}
        for card in cards
    ]
    cards = stats.filter_rows_with_stat(CARDS_INVALID_LOCATION_STAT, cards, is_card_location_valid)
    return [add_presentation_fields(card) for card in cards]


def log_meser_card_count(cards):
    meser_count = sum(1 for card in cards if MESER_SERVICE_MARKER in str(card.get('service_id', '')))
    logger.info("Found %d records with 'meser-s-' in service_id", meser_count)


def build_cards(snapshot, flat_table, stats):
    situations_lookup = build_taxonomy_lookup(snapshot['situations'])
    responses_lookup = build_taxonomy_lookup(snapshot['responses'])
    cards = run_pass_a(flat_table, situations_lookup, responses_lookup, stats)
    cards = run_pass_b(cards, situations_lookup, responses_lookup, stats)
    log_meser_card_count(cards)
    return cards
