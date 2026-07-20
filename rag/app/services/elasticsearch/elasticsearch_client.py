from functools import lru_cache

from elasticsearch import Elasticsearch

from app.vars import ELASTIC_PASSWORD, ELASTIC_URL, ELASTIC_USERNAME


@lru_cache(maxsize=1)
def get_elasticsearch_client() -> Elasticsearch:
    return Elasticsearch(ELASTIC_URL, basic_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD))
