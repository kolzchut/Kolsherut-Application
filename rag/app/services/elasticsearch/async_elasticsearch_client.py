from functools import lru_cache

from elasticsearch import AsyncElasticsearch

from app.vars import ELASTIC_PASSWORD, ELASTIC_URL, ELASTIC_USERNAME


@lru_cache(maxsize=1)
def get_async_elasticsearch_client() -> AsyncElasticsearch:
    return AsyncElasticsearch(ELASTIC_URL, basic_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD))
