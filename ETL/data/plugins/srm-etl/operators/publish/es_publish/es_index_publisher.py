"""Revision-swap index publishing (legacy es_utils.dump_to_es_and_delete).

Documents keep the legacy _id scheme (the row's primary key), so upserts
replace docs in place. Every document is stamped with one revision uuid per
publish; after a 30 second delay every document with a different revision is
purged - leftovers from the previous run.
"""
import time
import uuid

from elasticsearch.helpers import bulk

from srm_tools.logger import logger

from .document_serialization import serialize_document
from .mappings.hebrew_analyzer_settings import HEBREW_ANALYZER_INDEX_SETTINGS

REVISION_FIELD = 'revision'
PURGE_DELAY_SECONDS = 30


def ensure_index_exists(es_client, index_name, mapping):
    if es_client.indices.exists(index=index_name):
        return
    logger.info('Creating index %s', index_name)
    es_client.indices.create(
        index=index_name,
        body=dict(settings=dict(analysis=HEBREW_ANALYZER_INDEX_SETTINGS['analysis']), mappings=mapping),
    )


def build_bulk_actions(index_name, rows, primary_key_field, revision):
    for row in rows:
        document = serialize_document(row)
        document[REVISION_FIELD] = revision
        yield {'_index': index_name, '_id': str(row[primary_key_field]), '_source': document}


def purge_previous_revisions(es_client, index_name, revision):
    response = es_client.delete_by_query(
        index=index_name,
        body=dict(query=dict(bool=dict(must_not=dict(term=dict(revision=revision))))),
        conflicts='proceed',
    )
    logger.info('Purged previous revisions from %s: %s', index_name, response.get('deleted'))


def publish_rows_to_index(es_client, index_name, rows, primary_key_field, mapping):
    revision = uuid.uuid4().hex
    ensure_index_exists(es_client, index_name, mapping)
    success_count, errors = bulk(
        es_client,
        build_bulk_actions(index_name, rows, primary_key_field, revision),
        stats_only=False, raise_on_error=True,
    )
    logger.info('Indexed %d documents into %s', success_count, index_name)
    time.sleep(PURGE_DELAY_SECONDS)
    purge_previous_revisions(es_client, index_name, revision)
