"""CLI for the one-shot migration verification checks.

Every check writes a timestamped human-readable report under
verification/reports/ - it never passes or fails on its own; a human reads the
report and decides. Delete or archive this package after cutover.

Requires a configured environment (local .env in the plugin root, or injected
environment variables) - conf.settings validates required variables at import.

Usage: python -m verification.run_verification <check> [check args]
"""
import argparse

from . import (
    autocomplete_diff, capture_fixture, cards_diff, cards_sync_idempotency,
    es_corpus_diff, freeze_mappings, mapping_parity, merge_ab, pull_parity,
    run_build_on_fixture, sync_semantics,
)

CHECKS = {
    'pull_parity': pull_parity.run,
    'capture_fixture': capture_fixture.run,
    'run_build_on_fixture': run_build_on_fixture.run,
    'cards_diff': cards_diff.run,
    'autocomplete_diff': autocomplete_diff.run,
    'es_corpus_diff': es_corpus_diff.run,
    'mapping_parity': mapping_parity.run,
    'freeze_mappings': freeze_mappings.run,
    'cards_sync_idempotency': cards_sync_idempotency.run,
    'sync_semantics': sync_semantics.run,
    'merge_ab': merge_ab.run,
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('check', choices=sorted(CHECKS))
    parser.add_argument('check_args', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    CHECKS[args.check](args.check_args)


if __name__ == '__main__':
    main()
