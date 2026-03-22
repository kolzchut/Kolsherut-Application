"""Operator A — Curation & Cards.

Reads curated records from curation Airtable, applies manual fixes,
remaps cross-table IDs, and writes orgs/branches/services to the
staging Airtable base determined by settings.AIRTABLE_BASE.
"""
from conf import settings
from srm_tools.logger import logger
from srm_tools.error_notifier import invoke_on


def _run():
    logger.info('Starting derive_curation operator (AIRTABLE_BASE=%s)', settings.AIRTABLE_BASE)
    # Phase 6 will implement: from_curation pipeline + cards-to-AT
    raise NotImplementedError('derive_curation pipeline not yet implemented — see Phase 6')


def operator(*_):
    invoke_on(_run, 'Derive Curation (Operator A)')


if __name__ == '__main__':
    operator()
