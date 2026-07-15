"""Check: legacy data/card_data baseline vs the new in-memory cards, keyed by card_id.

Set-derived id arrays are compared as unordered sets (their legacy order was
hash-seed dependent - deliberate change #6 sorts them). The situation<->score
PAIRING is still checked: situation_ids and situation_scores are zipped into a
derived situation_score_pairs multiset, so right ids attached to wrong scores
show up as changed while tie-order noise does not.
Usage: run_verification cards_diff --legacy <card_data datapackage dir> --new <cards.json>
"""
import argparse
import json

from .datapackage_loader import load_datapackage_resource
from .report_writer import diff_summary_lines, write_report
from .row_diff import diff_keyed_rows

CHECK_NAME = 'cards_diff'
CARD_KEY_FIELD = 'card_id'
SCORE_PAIR_PRECISION = 6
SET_COMPARE_FIELDS = (
    'situation_ids', 'response_ids', 'situation_ids_parents', 'response_ids_parents',
    'situations', 'responses', 'situations_parents', 'responses_parents',
    'situation_score_pairs', 'possible_autocomplete', 'response_categories', 'data_sources',
)


def with_situation_score_pairs(row):
    """Replace situation_scores with a sorted (situation_id, score) pair multiset."""
    situation_ids = row.get('situation_ids') or []
    situation_scores = row.get('situation_scores') or []
    pairs = sorted(
        f'{situation_id}:{round(float(score), SCORE_PAIR_PRECISION)}'
        for situation_id, score in zip(situation_ids, situation_scores)
    )
    return {
        **{name: value for name, value in row.items() if name != 'situation_scores'},
        'situation_score_pairs': pairs,
    }


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--legacy', required=True, help='Legacy card_data datapackage dir')
    parser.add_argument('--new', required=True, help='cards.json from run_build_on_fixture or --dump-dir')
    args = parser.parse_args(argv)
    legacy_rows = [with_situation_score_pairs(row) for row in load_datapackage_resource(args.legacy, 'card_data')]
    with open(args.new, 'r', encoding='utf-8') as new_file:
        new_rows = [with_situation_score_pairs(row) for row in json.load(new_file)]
    summary, details = diff_keyed_rows(legacy_rows, new_rows, CARD_KEY_FIELD, set_compare_fields=SET_COMPARE_FIELDS)
    write_report(CHECK_NAME, diff_summary_lines(CHECK_NAME, summary), details)
