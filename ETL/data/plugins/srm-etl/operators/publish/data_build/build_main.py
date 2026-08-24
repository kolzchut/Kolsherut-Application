"""Stage 2 - one Airtable pull of the main base + the pure in-memory card build
(legacy to_dp.py operator). Returns PipelineData; no writes, no disk.
"""
from conf import settings
from srm_tools.logger import logger

from ..pipeline_data import PipelineData
from .cards.build_cards_main import build_cards
from .flatten.build_flat_branches import build_flat_branches
from .flatten.build_flat_services import build_flat_services
from .flatten.build_flat_table import build_flat_table
from .pull.fetch_main_base_tables import fetch_main_base_tables_from_airtable
from .pull.preprocess_branches import preprocess_branches
from .pull.preprocess_locations import preprocess_locations
from .pull.preprocess_organizations import preprocess_organizations
from .pull.preprocess_services import preprocess_services
from .pull.preprocess_taxonomies import preprocess_responses, preprocess_situations


def preprocess_source_tables(raw_tables):
    return {
        'responses': preprocess_responses(raw_tables[settings.AIRTABLE_RESPONSE_TABLE]),
        'situations': preprocess_situations(raw_tables[settings.AIRTABLE_SITUATION_TABLE]),
        'organizations': preprocess_organizations(raw_tables[settings.AIRTABLE_ORGANIZATION_TABLE]),
        'locations': preprocess_locations(raw_tables[settings.AIRTABLE_LOCATION_TABLE]),
        'branches': preprocess_branches(raw_tables[settings.AIRTABLE_BRANCH_TABLE]),
        'services': preprocess_services(raw_tables[settings.AIRTABLE_SERVICE_TABLE]),
    }


def fetch_data_and_build_cards():
    logger.info('Starting Data Build Flow')
    raw_tables = fetch_main_base_tables_from_airtable()
    source_tables = preprocess_source_tables(raw_tables)
    print('Preprocessed the 6 source tables; flattening branches and services...')
    flat_branches, branch_mapping = build_flat_branches(source_tables)
    flat_services = build_flat_services(source_tables, flat_branches, branch_mapping)
    flat_table = build_flat_table(flat_services, flat_branches)
    print(f'Flattened {len(flat_table)} (service, branch) rows; building cards...')
    cards = build_cards(source_tables, flat_table)
    logger.info('Finished Data Build Flow: %d cards', len(cards))
    return PipelineData(source_tables=source_tables, cards=cards)
