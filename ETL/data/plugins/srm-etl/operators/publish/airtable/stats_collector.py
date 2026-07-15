"""In-memory run statistics, flushed once per run to the Airtable Stats table.

The legacy Stats class wrote one Airtable row per counter, mid-stream; this
collector records counters in memory and performs a single batched write at the
end of the run (deliberate behavior change #2 of the publish rewrite).
"""
from conf import settings
from srm_tools.logger import logger

from .airtable_client import RECORD_ID_FIELD, list_table_rows, upsert_rows


class StatsCollector:

    def __init__(self):
        self.counters = {}

    def set_stat(self, stat_name, value):
        self.counters[stat_name] = value

    def filter_rows_with_stat(self, stat_name, rows, predicate):
        """Filter rows like the legacy filter_with_stat: count the removed ones."""
        passing = [row for row in rows if predicate(row)]
        self.set_stat(stat_name, len(rows) - len(passing))
        return passing

    def flush(self):
        if not self.counters:
            return
        existing_record_ids = self._load_existing_record_ids()
        stat_rows = [
            {'name': stat_name, 'value': value, RECORD_ID_FIELD: existing_record_ids.get(stat_name)}
            for stat_name, value in self.counters.items()
        ]
        upsert_rows(settings.AIRTABLE_BASE, settings.AIRTABLE_STATS_TABLE, stat_rows)
        logger.info('Flushed %d stats to the Stats table', len(stat_rows))
        self.counters = {}

    def _load_existing_record_ids(self):
        rows = list_table_rows(settings.AIRTABLE_BASE, settings.AIRTABLE_STATS_TABLE)
        return {row['name']: row[RECORD_ID_FIELD] for row in rows if row.get('name') is not None}
