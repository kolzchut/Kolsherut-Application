from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client
from app.vars import CARDS_COLLAPSE_FIELD, CARDS_INDEX_NAME, CARDS_SERVICE_ID_PAGE_SIZE

SERVICE_ID_AGGREGATION_NAME = 'service_ids'


def build_service_id_page_query(after_key: dict) -> dict:
    composite = {
        'size': CARDS_SERVICE_ID_PAGE_SIZE,
        'sources': [{CARDS_COLLAPSE_FIELD: {'terms': {'field': CARDS_COLLAPSE_FIELD}}}],
    }
    if after_key:
        composite['after'] = after_key
    return {SERVICE_ID_AGGREGATION_NAME: {'composite': composite}}


def fetch_card_service_ids() -> set:
    """Every service_id that has at least one branch card, paged out of a composite aggregation.

    Services with no card can never be returned: order_services_by_ranking drops any retrieved
    service_id with no matching card, so embedding them only wastes candidate-pool depth.
    """
    elasticsearch_client = get_elasticsearch_client()
    card_service_ids = set()
    after_key = None
    while True:
        aggregations = elasticsearch_client.search(
            index=CARDS_INDEX_NAME, size=0, aggs=build_service_id_page_query(after_key)
        )['aggregations'][SERVICE_ID_AGGREGATION_NAME]
        card_service_ids.update(bucket['key'][CARDS_COLLAPSE_FIELD] for bucket in aggregations['buckets'])
        after_key = aggregations.get('after_key')
        if not after_key:
            return card_service_ids
