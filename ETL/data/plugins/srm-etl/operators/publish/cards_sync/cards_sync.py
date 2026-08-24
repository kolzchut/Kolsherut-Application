"""Stage 4 - Cards table write-back (the live half of legacy to_sql.py).

Pushes only the eight summary fields per card, upserted by card_id with the
full airtable_sync status lifecycle: hash-diffed writes only, vanished cards
become INACTIVE and are never deleted. Like the legacy stage, it records no
stats - write counts are logged by airtable_sync.
"""
from conf import settings
from srm_tools.logger import logger

from ..airtable.airtable_sync import sync_table_rows

CARDS_SOURCE_ID = 'card'
CARDS_TABLE_FIELDS = [
    'organization_id', 'service_id', 'branch_id', 'situation_ids', 'response_ids',
    'service_boost', 'organization_branch_count', 'branch_location_accurate',
]


def build_card_rows_for_sync(cards):
    return [
        {
            'id': card.get('card_id'),
            'data': {field_name: card.get(field_name) for field_name in CARDS_TABLE_FIELDS},
        }
        for card in cards
    ]


def sync_cards_to_airtable(data):
    logger.info('Starting Cards Sync Flow')
    fetched_rows = build_card_rows_for_sync(data.cards)
    sync_table_rows(settings.AIRTABLE_CARDS_TABLE, CARDS_SOURCE_ID, CARDS_TABLE_FIELDS, fetched_rows)
    logger.info('Finished Cards Sync Flow')
