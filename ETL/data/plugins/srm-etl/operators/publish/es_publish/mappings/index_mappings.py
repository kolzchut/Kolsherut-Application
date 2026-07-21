"""Frozen index mappings, one JSON file per index.

The JSON files are snapshots of the live mappings the legacy generator
produced, written by the verification freeze_mappings tool (migration step 2).
Publishing refuses to run with a missing or empty mapping so a wrong mapping
can never be created silently.
"""
import json
import os

MAPPINGS_DIRECTORY = os.path.dirname(__file__)
CARDS_INDEX_NAME = 'srm__cards'
AUTOCOMPLETE_INDEX_NAME = 'srm__autocomplete'
SERVICES_INDEX_NAME = 'srm_services'
PUBLISHED_INDEX_NAMES = (CARDS_INDEX_NAME, AUTOCOMPLETE_INDEX_NAME, SERVICES_INDEX_NAME)
FREEZE_INSTRUCTIONS = (
    'Run "python -m verification.run_verification freeze_mappings" against the live '
    'cluster to snapshot the index mapping into this file before the first publish run.'
)


def index_mapping_path(index_name):
    return os.path.join(MAPPINGS_DIRECTORY, f'{index_name}.json')


def load_index_mapping(index_name):
    mapping_path = index_mapping_path(index_name)
    if not os.path.exists(mapping_path):
        raise FileNotFoundError(f'Missing frozen mapping for {index_name} at {mapping_path}. {FREEZE_INSTRUCTIONS}')
    with open(mapping_path, 'r', encoding='utf-8') as mapping_file:
        mapping = json.load(mapping_file)
    if not mapping:
        raise ValueError(f'Frozen mapping for {index_name} is empty. {FREEZE_INSTRUCTIONS}')
    return mapping


def load_all_index_mappings():
    """Every published index's frozen mapping - called at pipeline start so a
    missing/empty mapping fails before any external write."""
    return {index_name: load_index_mapping(index_name) for index_name in PUBLISHED_INDEX_NAMES}
