"""Elasticsearch client factory.

Deliberate behavior change #1: a failed connection RAISES (and reaches the
failure notifier) instead of the legacy silent skip that let the pipeline
"succeed" without indexing anything.
"""
import elasticsearch

from conf import settings

CONNECTION_TIMEOUT_SECONDS = 60
MAX_RETRIES = 3
RETRY_STATUS_CODES = [429, 502, 503, 504]


class ElasticsearchConnectionError(Exception):
    pass


def create_es_client():
    """URL-form host (plain http, like the legacy host/port dict) - works on both
    the pinned 7.13.4 client and newer client generations."""
    auth_options = {'http_auth': settings.ES_HTTP_AUTH.split(':')} if settings.ES_HTTP_AUTH else {}
    return elasticsearch.Elasticsearch(
        [f'http://{settings.ES_HOST}:{int(settings.ES_PORT)}'],
        timeout=CONNECTION_TIMEOUT_SECONDS, retry_on_timeout=True,
        max_retries=MAX_RETRIES, retry_on_status=RETRY_STATUS_CODES,
        **auth_options,
    )


def connect_to_elasticsearch():
    es_client = create_es_client()
    if not es_client.ping():
        raise ElasticsearchConnectionError(
            f'Failed to connect to Elasticsearch at {settings.ES_HOST}:{settings.ES_PORT}'
        )
    return es_client


def verify_elasticsearch_connection():
    """Pipeline-start preflight: raise before any external write when ES is unreachable."""
    connect_to_elasticsearch()
