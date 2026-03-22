"""Operator B — ES Pipeline.

Pulls 6 Airtable tables from the staging base (settings.AIRTABLE_BASE),
denormalizes into card_data, generates autocomplete suggestions, loads
all 6 ES indexes with revision-based atomic swap.

Pipeline: to_dp() → autocomplete → to_es()
"""
from conf import settings
from srm_tools.logger import logger
from srm_tools.error_notifier import invoke_on

from operators.derive_es.to_dp import to_dp
from operators.derive_es.autocomplete import generate_autocomplete
from operators.derive_es.to_es import load_all_indexes

AIRTABLE_BASE = settings.AIRTABLE_BASE


def _run():
    logger.info('Starting derive_es operator (AIRTABLE_BASE=%s)', AIRTABLE_BASE)

    # Stage 1: Denormalize AT data → card_data DataFrame
    card_data = to_dp()

    # Stage 2: Generate autocomplete suggestions
    autocomplete_df = generate_autocomplete(card_data)

    # Stage 3: Load all 6 ES indexes
    load_all_indexes(card_data, autocomplete_df)

    logger.info('derive_es operator complete: %d cards, %d autocomplete',
                len(card_data), len(autocomplete_df))


def operator(*_):
    invoke_on(_run, 'Derive ES (Operator B)')


if __name__ == '__main__':
    operator()
