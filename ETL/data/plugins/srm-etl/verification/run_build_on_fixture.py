"""Check helper: run the new in-memory build on a captured fixture.

No Airtable access: the pull and the Auto Tagging rules come from the fixture.
Writes cards.json and autocomplete.json next to the given output prefix, ready
for the cards_diff / autocomplete_diff checks.
Usage: run_verification run_build_on_fixture --fixture <fixture.json> --output-dir <dir>
"""
import argparse
import json
import os

from operators.publish.airtable.stats_collector import StatsCollector
from operators.publish.autocomplete_generation.autocomplete_main import generate_autocomplete
from operators.publish.data_build import build_main
from operators.publish.data_build.cards import card_build_main
from operators.publish.data_build.pull import main_base_pull

CHECK_NAME = 'run_build_on_fixture'


def json_default(value):
    return str(value)


def run_build(fixture):
    main_base_pull.pull_main_base_tables = lambda: fixture['tables']
    build_main.pull_main_base_tables = lambda: fixture['tables']
    card_build_main.fetch_auto_tagging_rules = lambda: fixture['auto_tagging_rules']
    stats = StatsCollector()
    data = build_main.build_pipeline_data(stats)
    generate_autocomplete(data)
    return data, stats


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--fixture', required=True)
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args(argv)
    with open(args.fixture, 'r', encoding='utf-8') as fixture_file:
        fixture = json.load(fixture_file)
    data, stats = run_build(fixture)
    os.makedirs(args.output_dir, exist_ok=True)
    outputs = {'cards.json': data.cards, 'autocomplete.json': data.autocomplete, 'stats.json': stats.counters}
    for file_name, payload in outputs.items():
        output_path = os.path.join(args.output_dir, file_name)
        with open(output_path, 'w', encoding='utf-8') as output_file:
            json.dump(payload, output_file, ensure_ascii=False, indent=1, default=json_default)
        print(f'Wrote {output_path}')
