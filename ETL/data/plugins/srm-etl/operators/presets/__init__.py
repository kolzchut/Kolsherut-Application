"""Deprecated operator kept as a harmless stub for any Cronicle job still calling it.
The original body (presets + homepage publish to ES/CKAN) was unreachable dead code."""
from srm_tools.error_notifier import invoke_on
from srm_tools.logger import logger


def run(*args):
    logger.info("Deprecated operator called: Presets")


def operator(*_):
    invoke_on(run, 'Presets')
