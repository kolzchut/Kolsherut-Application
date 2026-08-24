"""Check: full-corpus diff between two Elasticsearch indexes.

Every document from both indexes, keyed by _id, sorted keys, revision excluded.
Usage: run_verification es_corpus_diff --legacy-index srm__cards --new-index srm__cards_test
"""
import argparse

from elasticsearch.helpers import scan

from operators.publish.es_publish.es_connection import connect_to_elasticsearch

from .report_writer import diff_summary_lines, write_report
from .row_diff import diff_keyed_rows

CHECK_NAME = 'es_corpus_diff'
DOCUMENT_KEY_FIELD = '_doc_id'
IGNORED_DOCUMENT_FIELDS = ('revision',)
SCROLL_BATCH_SIZE = 1000


def fetch_all_documents(es_client, index_name):
    documents = []
    for hit in scan(es_client, index=index_name, query={'query': {'match_all': {}}}, size=SCROLL_BATCH_SIZE):
        document = dict(hit['_source'])
        document[DOCUMENT_KEY_FIELD] = hit['_id']
        documents.append(document)
    return documents


def run(argv):
    parser = argparse.ArgumentParser(prog=CHECK_NAME)
    parser.add_argument('--legacy-index', required=True)
    parser.add_argument('--new-index', required=True)
    args = parser.parse_args(argv)
    es_client = connect_to_elasticsearch()
    legacy_documents = fetch_all_documents(es_client, args.legacy_index)
    new_documents = fetch_all_documents(es_client, args.new_index)
    summary, details = diff_keyed_rows(
        legacy_documents, new_documents, DOCUMENT_KEY_FIELD, ignore_fields=IGNORED_DOCUMENT_FIELDS,
    )
    summary_lines = diff_summary_lines(f'{CHECK_NAME}: {args.legacy_index} vs {args.new_index}', summary)
    summary_lines.append(f'  doc counts: legacy={len(legacy_documents)} new={len(new_documents)}')
    write_report(CHECK_NAME, summary_lines, details)
