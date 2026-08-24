"""Check: run the Cards sync twice against the staging base - the second run
must report zero writes (hash diff working).

Usage: run_verification cards_sync_idempotency --cards <cards.json>
"""
import argparse
import json

from conf import settings
from operators.publish.airtable.airtable_sync import sync_table_rows
from operators.publish.cards_sync.cards_sync import CARDS_SOURCE_ID, CARDS_TABLE_FIELDS, build_card_rows_for_sync

from .report_writer import write_report

CHECK_NAME = 'cards_sync_idempotency'


def run_sync_once(cards):
    fetched_rows = build_card_rows_for_sync(cards)
    return sync_table_rows(settings.AIRTABLE_CARDS_TABLE, CARDS_SOURCE_ID, CARDS_TABLE_FIELDS, fetched_rows)


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--cards', required=True, help='cards.json from run_build_on_fixture or --dump-dir')
    args = parser.parse_args(argv)
    with open(args.cards, 'r', encoding='utf-8') as cards_file:
        cards = json.load(cards_file)
    first_run_counts = run_sync_once(cards)
    second_run_counts = run_sync_once(cards)
    second_run_writes = second_run_counts['new'] + second_run_counts['different']
    summary_lines = [
        f'{CHECK_NAME} report',
        f'  first run:  {first_run_counts}',
        f'  second run: {second_run_counts}',
        f'  second-run writes (must be 0): {second_run_writes}',
    ]
    write_report(CHECK_NAME, summary_lines, {'first_run': first_run_counts, 'second_run': second_run_counts})
