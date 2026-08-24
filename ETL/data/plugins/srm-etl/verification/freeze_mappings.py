"""Check helper: snapshot the live index mappings into the frozen mapping files
consumed by the publish operator (migration step 2).

Run against the legacy staging cluster BEFORE the first publish run. Also check
whether the live index relies on dynamic mapping (mapping fields vs doc fields).
An --index entry may be 'live_name=frozen_name' when the live index is a
timestamped snapshot (e.g. srm__cards_2026...=srm__cards).
Usage: run_verification freeze_mappings [--index srm__cards --index srm__autocomplete]
"""
import argparse
import json

from operators.publish.es_publish.es_connection import connect_to_elasticsearch
from operators.publish.es_publish.mappings.index_mappings import PUBLISHED_INDEX_NAMES, index_mapping_path

CHECK_NAME = 'freeze_mappings'
LIVE_FROZEN_SEPARATOR = '='


def split_live_and_frozen_names(index_entry):
    live_name, _, frozen_name = index_entry.partition(LIVE_FROZEN_SEPARATOR)
    return live_name, frozen_name or live_name


def freeze_index_mapping(es_client, live_name, frozen_name):
    response = es_client.indices.get_mapping(index=live_name)
    mapping = next(iter(response.values()))['mappings']
    mapping_path = index_mapping_path(frozen_name)
    with open(mapping_path, 'w', encoding='utf-8') as mapping_file:
        json.dump(mapping, mapping_file, ensure_ascii=False, indent=2, sort_keys=True)
    print(f'Frozen mapping for {live_name} written to {mapping_path}')
    if 'dynamic' in mapping:
        print(f"  note: {live_name} has dynamic='{mapping['dynamic']}' - review whether doc fields rely on it")


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--index', action='append', default=None)
    args = parser.parse_args(argv)
    es_client = connect_to_elasticsearch()
    for index_entry in args.index or PUBLISHED_INDEX_NAMES:
        live_name, frozen_name = split_live_and_frozen_names(index_entry)
        freeze_index_mapping(es_client, live_name, frozen_name)
