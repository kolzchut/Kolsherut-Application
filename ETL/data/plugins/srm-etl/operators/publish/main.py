"""SRM publish operator - a single entry point with five internal stages.

Stage order matters: the Data-Import copy (stage 1) mutates the main Airtable
base that the data build pulls from, so it must run first. cards_sync
deliberately runs BEFORE es_publish (legacy ran ES first) - see README
deliberate change #9. Preflight (deliberate change #10): the frozen index
mappings and the ES connection are validated before any external write, so a
broken ES setup aborts the run before stage 1. Stats collected by any stage are
flushed once, at the end, even when a stage fails mid-run.
"""
from .airtable.stats_collector import reset_collected_stats, write_stats_to_airtable
from .copy_from_data_import.copy_from_data_import_main import copy_approved_data_from_data_import
from .data_build.build_main import fetch_data_and_build_cards
from .autocomplete_generation.autocomplete_main import generate_autocomplete
from .cards_sync.cards_sync import sync_cards_to_airtable
from .es_publish.es_connection import verify_elasticsearch_connection
from .es_publish.es_publish_main import publish_to_elasticsearch
from .es_publish.mappings.index_mappings import load_all_index_mappings
from .shared.write_debug_output import write_stage_output_to_json


def run_publish_pipeline(dump_directory=None):
    print('===== Publish pipeline STARTING =====')
    print('Preflight: loading frozen index mappings and pinging Elasticsearch...')
    index_mappings = load_all_index_mappings()
    verify_elasticsearch_connection()
    print('Preflight OK: mappings loaded, Elasticsearch reachable')
    reset_collected_stats()
    try:
        print('[Stage 1/5] Copying approved data from the Data-Import base...')
        copy_approved_data_from_data_import()
        print('[Stage 2/5] Building cards from the main base...')
        data = fetch_data_and_build_cards()
        write_stage_output_to_json(dump_directory, 'source_tables', data.source_tables)
        write_stage_output_to_json(dump_directory, 'cards', data.cards)
        print('[Stage 3/5] Generating autocomplete queries...')
        generate_autocomplete(data)
        write_stage_output_to_json(dump_directory, 'autocomplete', data.autocomplete)
        print('[Stage 4/5] Syncing cards to Airtable...')
        sync_cards_to_airtable(data)
        print('[Stage 5/5] Publishing cards + autocomplete to Elasticsearch...')
        publish_to_elasticsearch(data, index_mappings)
    finally:
        print('Writing collected stats to the Stats table...')
        write_stats_to_airtable()
    print('===== Publish pipeline FINISHED successfully =====')
