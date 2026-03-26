"""ES bulk utilities — revision-based atomic swap.

Replaces the old dataflows-based dump_to_es_and_delete() with direct
elasticsearch.helpers.bulk() calls and es.indices.refresh() instead
of time.sleep(30).

Usage:
    from operators.derive_es.es_utils import es_instance, atomic_swap_index

    es = es_instance()
    revision = atomic_swap_index(es, 'srm__cards', df, id_field='card_id')
"""
import uuid
from typing import Optional

import numpy as np
import pandas as pd
import elasticsearch
from elasticsearch import helpers as es_helpers

from conf import settings
from srm_tools.logger import logger


_es_client: Optional[elasticsearch.Elasticsearch] = None


def es_instance() -> elasticsearch.Elasticsearch:
    """Return a singleton Elasticsearch client configured from settings."""
    global _es_client
    if _es_client is None:
        auth_kwargs = {}
        if settings.ES_HTTP_AUTH:
            auth_kwargs['http_auth'] = settings.ES_HTTP_AUTH.split(':')
        _es_client = elasticsearch.Elasticsearch(
            [dict(host=settings.ES_HOST, port=int(settings.ES_PORT))],
            timeout=60,
            retry_on_timeout=True,
            max_retries=3,
            retry_on_status=[429, 502, 503, 504],
            **auth_kwargs,
        )
    return _es_client


def _serialize_value(v):
    """Convert numpy/pandas types to JSON-safe Python types."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    if isinstance(v, np.ndarray):
        return v.tolist()
    if isinstance(v, (list, dict, tuple)):
        return v
    if isinstance(v, float) and np.isnan(v):
        return None
    try:
        if pd.isna(v):
            return None
    except (ValueError, TypeError):
        pass
    return v


def _row_to_doc(row: dict, revision: str) -> dict:
    """Convert a DataFrame row dict to an ES-safe document with revision stamp."""
    doc = {}
    for k, v in row.items():
        safe = _serialize_value(v)
        if safe is not None:
            doc[k] = safe
    doc['revision'] = revision
    return doc


def _generate_actions(index_name: str, df: pd.DataFrame, revision: str,
                      id_field: Optional[str] = None):
    """Yield bulk-API action dicts from a DataFrame."""
    for _, row in df.iterrows():
        doc = _row_to_doc(row.to_dict(), revision)
        action = {
            '_index': index_name,
            '_source': doc,
        }
        if id_field and id_field in doc:
            action['_id'] = doc[id_field]
        yield action


def ensure_index(es: elasticsearch.Elasticsearch, index_name: str,
                 settings_and_mappings: dict):
    """Create index with settings/mappings if it doesn't exist."""
    if not es.indices.exists(index=index_name):
        es.indices.create(index=index_name, body=settings_and_mappings)
        logger.info('Created index %s', index_name)


def bulk_index_dataframe(
    es: elasticsearch.Elasticsearch,
    index_name: str,
    df: pd.DataFrame,
    revision: str,
    id_field: Optional[str] = None,
    chunk_size: int = 500,
) -> int:
    """Bulk-index a DataFrame into an ES index with a revision stamp.

    Args:
        es: Elasticsearch client instance.
        index_name: Target ES index name (e.g. 'srm__cards').
        df: pandas DataFrame to index.
        revision: UUID hex string stamped on every document.
        id_field: Optional column name to use as ES _id.
        chunk_size: Number of docs per bulk request.

    Returns:
        Number of successfully indexed documents.
    """
    actions = _generate_actions(index_name, df, revision, id_field)
    success_count, errors = es_helpers.bulk(
        es, actions, chunk_size=chunk_size, raise_on_error=False,
    )
    if errors:
        logger.warning('bulk_index_dataframe: %d errors indexing to %s',
                        len(errors), index_name)
        for err in errors[:5]:
            logger.warning('  %s', err)
    else:
        logger.info('bulk_index_dataframe: indexed %d docs to %s',
                     success_count, index_name)
    return success_count


def delete_old_revision(
    es: elasticsearch.Elasticsearch,
    index_name: str,
    current_revision: str,
) -> dict:
    """Delete all documents whose revision != current_revision (atomic swap).

    Uses es.indices.refresh() to ensure the newly indexed documents are
    visible before deleting the old ones. Replaces the old time.sleep(30)
    approach.
    """
    es.indices.refresh(index=index_name)
    response = es.delete_by_query(
        index=index_name,
        body=dict(
            query=dict(
                bool=dict(
                    must_not=dict(
                        term=dict(revision=current_revision)
                    )
                )
            )
        ),
        conflicts='proceed',
    )
    deleted = response.get('deleted', 0)
    logger.info('delete_old_revision: deleted %d old docs from %s',
                deleted, index_name)
    return response


def atomic_swap_index(
    es: elasticsearch.Elasticsearch,
    index_name: str,
    df: pd.DataFrame,
    id_field: Optional[str] = None,
    chunk_size: int = 500,
    settings_and_mappings: Optional[dict] = None,
) -> str:
    """Convenience: bulk-index a DataFrame then swap out old revision.

    Combines ensure_index + bulk_index_dataframe + delete_old_revision.

    Args:
        es: Elasticsearch client.
        index_name: Target index.
        df: Data to index.
        id_field: Optional ES _id column.
        chunk_size: Bulk batch size.
        settings_and_mappings: Optional index creation settings/mappings.

    Returns:
        The revision hex used.
    """
    if settings_and_mappings:
        ensure_index(es, index_name, settings_and_mappings)
    revision = uuid.uuid4().hex
    bulk_index_dataframe(es, index_name, df, revision,
                         id_field=id_field, chunk_size=chunk_size)
    delete_old_revision(es, index_name, revision)
    return revision
