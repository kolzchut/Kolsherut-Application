"""In-memory run statistics, flushed once per run to the Airtable Stats table.

The legacy Stats class wrote one Airtable row per counter, mid-stream; this
module records counters in memory and performs a single batched write at the
end of the run (deliberate behavior change #2 of the publish rewrite).
State lives in the module-level collected_stats dict; run_publish_pipeline
resets it at the start of every run.
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import AIRTABLE_RECORD_ID_FIELD, fetch_rows_from_airtable, create_or_update_rows_in_airtable

collected_stats = {'counters': {}}


def reset_collected_stats():
    collected_stats['counters'] = {}


def set_stat(stat_name, value):
    collected_stats['counters'][stat_name] = value


def filter_rows_and_count_removed(stat_name, rows, predicate):
    """Filter rows like the legacy filter_with_stat: count the removed ones."""
    passing = [row for row in rows if predicate(row)]
    set_stat(stat_name, len(rows) - len(passing))
    return passing


def load_existing_stat_record_ids():
    rows = fetch_rows_from_airtable(settings.AIRTABLE_BASE, settings.AIRTABLE_STATS_TABLE)
    return {row['name']: row[AIRTABLE_RECORD_ID_FIELD] for row in rows if row.get('name') is not None}


def write_stats_to_airtable():
    if not collected_stats['counters']:
        return
    existing_record_ids = load_existing_stat_record_ids()
    stat_rows = [
        {'name': stat_name, 'value': value, AIRTABLE_RECORD_ID_FIELD: existing_record_ids.get(stat_name)}
        for stat_name, value in collected_stats['counters'].items()
    ]
    create_or_update_rows_in_airtable(settings.AIRTABLE_BASE, settings.AIRTABLE_STATS_TABLE, stat_rows)
    logger.info('Flushed %d stats to the Stats table', len(stat_rows))
    reset_collected_stats()
