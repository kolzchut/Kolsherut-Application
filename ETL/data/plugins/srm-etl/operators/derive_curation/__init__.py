"""Operator A — Curation & Cards.

Reads curated records from curation Airtable, applies manual fixes,
remaps cross-table IDs, and writes orgs/branches/services to the
staging Airtable base determined by settings.AIRTABLE_BASE.

WARNING: This operator writes to Airtable. AIRTABLE_BASE env var
determines the target — ensure it points to staging, not production.
"""
from conf import settings
from srm_tools.logger import logger
from srm_tools.error_notifier import invoke_on

from operators.derive_curation.from_curation import copy_from_curation_base

AIRTABLE_BASE = settings.AIRTABLE_BASE


def _run():
    logger.info('Starting derive_curation operator (AIRTABLE_BASE=%s)', AIRTABLE_BASE)
    copy_from_curation_base(
        curation_base=settings.AIRTABLE_DATA_IMPORT_BASE,
        source_id='entities',
    )
    logger.info('derive_curation operator complete')


def operator(*_):
    invoke_on(_run, 'Derive Curation (Operator A)')


if __name__ == '__main__':
    operator()
