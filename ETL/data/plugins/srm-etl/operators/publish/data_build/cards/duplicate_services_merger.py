"""Card-level service deduplication (legacy merge_duplicate_services).

Cards are ordered so services with service_implements come first. An
organization that implements X registers it; later cards of the same
organization are skipped when their service_id occurs inside any implemented
value, or when they are a generic soproc: service superseded by the
organization's own curated one.
"""
from srm_tools.logger import logger

SOCIAL_PROCUREMENT_SERVICE_PREFIX = 'soproc:'  # "soproc" - the social-procurement data source


def should_skip_implemented_card(card, implemented_by_organization):
    organization_implements = implemented_by_organization.get(card['organization_id'])
    if not organization_implements:
        return None
    if any(card['service_id'] in implemented for implemented in organization_implements):
        return 'implementing'
    if card['service_id'].startswith(SOCIAL_PROCUREMENT_SERVICE_PREFIX):
        return 'soproc'
    return None


def merge_duplicate_services(cards):
    ordered_cards = sorted(cards, key=lambda card: 0 if card['service_implements'] else 1)
    implemented_by_organization = {}
    kept = []
    skip_counts = {'implementing': 0, 'soproc': 0}
    implementing_count = 0
    for card in ordered_cards:
        if card['service_implements']:
            implemented_by_organization.setdefault(card['organization_id'], set()).add(card['service_implements'])
            implementing_count += 1
            kept.append(card)
            continue
        skip_reason = should_skip_implemented_card(card, implemented_by_organization)
        if skip_reason:
            skip_counts[skip_reason] += 1
            continue
        kept.append(card)
    logger.info(
        'Service deduplication: implementing: %d, skipped implementing: %d, skipped soproc: %d',
        implementing_count, skip_counts['implementing'], skip_counts['soproc'],
    )
    return kept
