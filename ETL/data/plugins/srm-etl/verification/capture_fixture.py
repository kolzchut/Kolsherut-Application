"""Check helper: convert the legacy raw-pull checkpoint into a JSON fixture.

Reads the srm_raw_airtable_buffer checkpoint datapackage written by a legacy
to_dp run (run it with PYTHONHASHSEED=0) and pulls the Auto Tagging rules, so
the new build can run on exactly the data the legacy baseline saw.
Usage: run_verification capture_fixture --checkpoint <dir> --output <fixture.json>
"""
import argparse
import json

from conf import settings
from operators.publish.data_build.cards.auto_tagging import fetch_auto_tagging_rules

from .datapackage_loader import load_datapackage_resource

CHECK_NAME = 'capture_fixture'


def capture_tables(checkpoint_dir):
    table_names = (
        settings.AIRTABLE_RESPONSE_TABLE, settings.AIRTABLE_SITUATION_TABLE,
        settings.AIRTABLE_ORGANIZATION_TABLE, settings.AIRTABLE_LOCATION_TABLE,
        settings.AIRTABLE_BRANCH_TABLE, settings.AIRTABLE_SERVICE_TABLE,
    )
    return {
        table_name: load_datapackage_resource(checkpoint_dir, table_name)
        for table_name in table_names
    }


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--checkpoint', required=True, help='Path to the srm_raw_airtable_buffer checkpoint datapackage dir')
    parser.add_argument('--output', required=True, help='Fixture JSON path to write')
    args = parser.parse_args(argv)
    fixture = {
        'tables': capture_tables(args.checkpoint),
        'auto_tagging_rules': fetch_auto_tagging_rules(),
    }
    with open(args.output, 'w', encoding='utf-8') as fixture_file:
        json.dump(fixture, fixture_file, ensure_ascii=False, indent=1, default=str)
    print(f'Fixture written to {args.output}')
