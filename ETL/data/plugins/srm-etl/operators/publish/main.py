"""SRM publish operator - a single entry point with five internal stages.

Stage order matters: curation promotion mutates the main Airtable base that the
data build pulls from, so it must run first. cards_sync deliberately runs
BEFORE es_publish (legacy ran ES first) - see README deliberate change #9.
Preflight (deliberate change #10): the frozen index mappings and the ES
connection are validated before any external write, so a broken ES setup
aborts the run before the curation promotion. Stats collected by any stage are
flushed once, at the end, even when a stage fails mid-run.
"""
from srm_tools.logger import logger

from .airtable.stats_collector import StatsCollector
from .curation_promotion.promotion_main import promote_curation_data
from .data_build.build_main import build_pipeline_data
from .autocomplete_generation.autocomplete_main import generate_autocomplete
from .cards_sync.cards_sync import sync_cards_to_airtable
from .es_publish.es_connection import verify_elasticsearch_connection
from .es_publish.es_publish_main import publish_to_elasticsearch
from .es_publish.mappings.index_mappings import load_all_index_mappings
from .shared.debug_dump import dump_stage_output


def run_publish_pipeline(dump_directory=None):
    logger.info('Starting Publish Flow')
    index_mappings = load_all_index_mappings()
    verify_elasticsearch_connection()
    stats = StatsCollector()
    try:
        promote_curation_data(stats)
        data = build_pipeline_data(stats)
        dump_stage_output(dump_directory, 'snapshot', data.snapshot)
        dump_stage_output(dump_directory, 'cards', data.cards)
        generate_autocomplete(data)
        dump_stage_output(dump_directory, 'autocomplete', data.autocomplete)
        sync_cards_to_airtable(data)
        publish_to_elasticsearch(data, index_mappings)
    finally:
        stats.flush()
    logger.info('Finished Publish Flow')
