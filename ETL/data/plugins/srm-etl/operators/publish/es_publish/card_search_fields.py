"""Search-only card enrichments (legacy to_es.data_api_es_flow): the ES
relevance base score and the airtable_last_modified date. These never leak
into the Airtable-facing card rows.

Note: branch_last_modified never reaches the cards (the legacy flat table
dropped it - see build_flat_table), so airtable_last_modified is effectively
the service's last_modified; the max() is kept for exact legacy parity.
"""
from datetime import datetime

MESER_SERVICE_PREFIX = 'meser-'  # "meser" (מס"ר) - the national welfare data source
MINIMUM_DESCRIPTION_LENGTH = 5
HOTLINE_MAX_PHONE_LENGTH = 5
HOTLINE_PHONE_PREFIX = '1'
LARGE_ORGANIZATION_BRANCH_COUNT = 100
GOVERNMENTAL_ORGANIZATION_KINDS = ('משרד ממשלתי', 'רשות מקומית', 'תאגיד סטטוטורי')


def national_service_score_factor(card):
    factor = 10
    phone_numbers = list(filter(None, (card['service_phone_numbers'] or []) + (card['organization_phone_numbers'] or [])))
    if phone_numbers:
        phone_number = phone_numbers[0]
        if len(phone_number) <= HOTLINE_MAX_PHONE_LENGTH or phone_number.startswith(HOTLINE_PHONE_PREFIX):
            factor *= 5
    return factor


def branch_count_score_factor(branch_count):
    if branch_count > LARGE_ORGANIZATION_BRANCH_COUNT:
        return branch_count / 10
    return branch_count ** 0.5


def card_score(card):
    branch_count = card['organization_branch_count'] or 1
    score = 1
    if not card['service_id'].startswith(MESER_SERVICE_PREFIX):
        score *= 10
    if card['service_description'] and len(card['service_description']) > MINIMUM_DESCRIPTION_LENGTH:
        score *= 10
    if bool(card['national_service']):
        score *= national_service_score_factor(card)
    else:
        score *= branch_count_score_factor(branch_count)
    if card['organization_kind'] in GOVERNMENTAL_ORGANIZATION_KINDS:
        score *= 5
    score = max(score, 1)
    boost = float(card['service_boost']) or 0
    return score * 10 ** boost


def parse_date(value):
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    if isinstance(value, datetime):
        return value
    return None


def airtable_last_modified(card):
    if not (card.get('service_last_modified') or card.get('branch_last_modified')):
        return None
    return max(filter(None, [
        parse_date(card.get('service_last_modified')),
        parse_date(card.get('branch_last_modified')),
    ]))


def add_card_search_fields(card):
    return {
        **card,
        'score': card_score(card),
        'airtable_last_modified': airtable_last_modified(card),
    }
