"""Skip rules and the low-confidence flag for generated queries (legacy unwind_templates)."""
from operators.publish.shared.organization_id_validation import VERIFY_ORG_ID

from .query_templates import (
    IGNORE_SITUATIONS, IMPORTANT_TWO_LEVEL_SITUATIONS, MINIMUM_SITUATION_SEGMENTS, VERIFY_CITY_NAME,
)

LOW_CONFIDENCE_BRANCH_COUNT = 5


def should_skip_combination(situation_id, org_id, city_name):
    if situation_id in IGNORE_SITUATIONS:
        return True
    if org_id and VERIFY_ORG_ID.match(org_id) is None:
        return True
    if city_name and VERIFY_CITY_NAME.match(city_name) is None:
        return True
    return (
        situation_id is not None
        and len(situation_id.split(':')) < MINIMUM_SITUATION_SEGMENTS
        and situation_id not in IMPORTANT_TWO_LEVEL_SITUATIONS
    )


def is_low_confidence(card, situation_id, response_id, org_name):
    """Low (score 0.5) when the response/situation is only an ancestor, not directly
    on the card, or when the organization has few branches."""
    if situation_id is not None and situation_id not in card['situation_ids']:
        return True
    if response_id is not None and response_id not in card['response_ids']:
        return True
    return bool(org_name) and card['organization_branch_count'] < LOW_CONFIDENCE_BRANCH_COUNT
