"""Stage 2 - one Airtable pull of the main base + the pure in-memory card build
(legacy to_dp.py operator). Returns PipelineData; no writes, no disk.
"""
from conf import settings
from srm_tools.logger import logger

from ..pipeline_data import PipelineData
from .cards.card_build_main import build_cards
from .flatten.flat_branches_builder import build_flat_branches
from .flatten.flat_services_builder import build_flat_services
from .flatten.flat_table_builder import build_flat_table
from .pull.main_base_pull import pull_main_base_tables
from .pull.preprocess_branches import preprocess_branches
from .pull.preprocess_locations import preprocess_locations
from .pull.preprocess_organizations import preprocess_organizations
from .pull.preprocess_services import preprocess_services
from .pull.preprocess_taxonomies import preprocess_responses, preprocess_situations


def preprocess_snapshot(raw_tables, stats):
    return {
        'responses': preprocess_responses(raw_tables[settings.AIRTABLE_RESPONSE_TABLE], stats),
        'situations': preprocess_situations(raw_tables[settings.AIRTABLE_SITUATION_TABLE], stats),
        'organizations': preprocess_organizations(raw_tables[settings.AIRTABLE_ORGANIZATION_TABLE], stats),
        'locations': preprocess_locations(raw_tables[settings.AIRTABLE_LOCATION_TABLE], stats),
        'branches': preprocess_branches(raw_tables[settings.AIRTABLE_BRANCH_TABLE], stats),
        'services': preprocess_services(raw_tables[settings.AIRTABLE_SERVICE_TABLE], stats),
    }


def build_pipeline_data(stats):
    logger.info('Starting Data Build Flow')
    raw_tables = pull_main_base_tables()
    snapshot = preprocess_snapshot(raw_tables, stats)
    flat_branches, branch_mapping = build_flat_branches(snapshot, stats)
    flat_services = build_flat_services(snapshot, flat_branches, branch_mapping)
    flat_table = build_flat_table(flat_services, flat_branches)
    cards = build_cards(snapshot, flat_table, stats)
    logger.info('Finished Data Build Flow: %d cards', len(cards))
    return PipelineData(snapshot=snapshot, cards=cards)
