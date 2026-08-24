"""Check: frozen mapping JSON vs the live index mapping.

Run it against the pre-existing legacy index (step 2) AND after a full
new-pipeline index run, so dynamically-added fields cannot hide drift.
An --index entry may be 'live_name=frozen_name' when the live index name
differs from the frozen file name (e.g. a timestamped snapshot index).
Usage: run_verification mapping_parity --index srm__cards [--index srm__autocomplete]
"""
import argparse

from operators.publish.es_publish.es_connection import connect_to_elasticsearch
from operators.publish.es_publish.mappings.index_mappings import load_index_mapping

from .freeze_mappings import split_live_and_frozen_names
from .report_writer import write_report

CHECK_NAME = 'mapping_parity'


def fetch_live_mapping(es_client, index_name):
    response = es_client.indices.get_mapping(index=index_name)
    return next(iter(response.values()))['mappings']


def diff_mapping_trees(frozen, live, path=''):
    differences = []
    for key in sorted(set(frozen) | set(live)):
        key_path = f'{path}.{key}' if path else key
        if key not in frozen:
            differences.append({'path': key_path, 'frozen': None, 'live': live[key]})
        elif key not in live:
            differences.append({'path': key_path, 'frozen': frozen[key], 'live': None})
        elif isinstance(frozen[key], dict) and isinstance(live[key], dict):
            differences += diff_mapping_trees(frozen[key], live[key], key_path)
        elif frozen[key] != live[key]:
            differences.append({'path': key_path, 'frozen': frozen[key], 'live': live[key]})
    return differences


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--index', action='append', required=True)
    args = parser.parse_args(argv)
    es_client = connect_to_elasticsearch()
    summary_lines = []
    details = {}
    for index_entry in args.index:
        live_name, frozen_name = split_live_and_frozen_names(index_entry)
        differences = diff_mapping_trees(load_index_mapping(frozen_name), fetch_live_mapping(es_client, live_name))
        summary_lines.append(f'{CHECK_NAME}: {index_entry} - {len(differences)} differences')
        details[index_entry] = differences
    write_report(CHECK_NAME, summary_lines, details)
