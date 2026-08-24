"""Response category derivation (legacy safe_get_response_categories & friends)."""
from collections import Counter

from srm_tools.logger import logger


def safe_get_response_categories(card):
    """Segment #1 of each response id; malformed ids are logged and skipped."""
    categories = []
    for response in card.get('responses', []):
        if not response or 'id' not in response:
            continue
        parts = response['id'].split(':')
        if len(parts) > 1:
            categories.append(parts[1])
        else:
            logger.warning(
                "Malformed response ID '%s' found in Service ID: %s, row details: %s",
                response['id'], card.get('service_id'), card,
            )
    return categories


def most_common_category(response_categories):
    if len(response_categories) == 0:
        return None
    return Counter(response_categories).most_common(1)[0][0]


def reorder_responses_by_category(responses, category):
    """The responses of the main category come first (legacy safe_reorder_responses_by_category)."""
    if not responses:
        return []
    matches = []
    others = []
    for response in responses:
        parts = response.get('id', '').split(':')
        if len(parts) > 1 and parts[1] == category:
            matches.append(response)
        else:
            others.append(response)
    return matches + others


def add_response_category_fields(card):
    response_categories = safe_get_response_categories(card)
    return {
        **card,
        'response_categories': response_categories,
        'response_category': most_common_category(response_categories),
    }
