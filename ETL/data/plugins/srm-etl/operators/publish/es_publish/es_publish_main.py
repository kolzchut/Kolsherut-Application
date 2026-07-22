"""Stage 5 - publish the cards, autocomplete and services indexes (legacy to_es.py).

srm__cards, srm__autocomplete and srm_services are published - the four indexes
with no consumer (places, responses, situations, orgs) were dropped (deliberate
behavior change #5). srm_services mirrors the Airtable Services table one
document per service, straight from the preprocessed source table. Search-only
fields are added on card document copies so the in-memory cards stay
Airtable-shaped. The frozen mappings arrive preloaded from the pipeline-start
preflight.
"""
from srm_tools.logger import logger

from .card_search_fields import add_card_search_fields
from .es_connection import connect_to_elasticsearch
from .es_index_publisher import publish_rows_to_index
from .mappings.index_mappings import AUTOCOMPLETE_INDEX_NAME, CARDS_INDEX_NAME, SERVICES_INDEX_NAME

CARDS_PRIMARY_KEY = 'card_id'
AUTOCOMPLETE_PRIMARY_KEY = 'id'
SERVICES_PRIMARY_KEY = 'id'
SERVICES_SOURCE_TABLE = 'services'


def publish_to_elasticsearch(data, index_mappings):
    logger.info('Starting ES Flow')
    es_client = connect_to_elasticsearch()
    card_documents = [add_card_search_fields(card) for card in data.cards]
    publish_rows_to_index(
        es_client, CARDS_INDEX_NAME, card_documents, CARDS_PRIMARY_KEY, index_mappings[CARDS_INDEX_NAME],
    )
    publish_rows_to_index(
        es_client, AUTOCOMPLETE_INDEX_NAME, data.autocomplete,
        AUTOCOMPLETE_PRIMARY_KEY, index_mappings[AUTOCOMPLETE_INDEX_NAME],
    )
    publish_rows_to_index(
        es_client, SERVICES_INDEX_NAME, data.source_tables[SERVICES_SOURCE_TABLE],
        SERVICES_PRIMARY_KEY, index_mappings[SERVICES_INDEX_NAME],
    )
    logger.info('Finished ES Flow')
