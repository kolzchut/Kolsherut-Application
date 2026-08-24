from app.vars import (
    CARDS_COLLAPSE_FIELD,
    CARDS_INNER_HITS_NAME,
    CARDS_INNER_HITS_SIZE,
    CARDS_SOURCE_FIELDS,
)


def build_cards_by_service_ids_query(service_ids: list[str]) -> dict:
    return {
        'size': len(service_ids),
        '_source': CARDS_SOURCE_FIELDS,
        'query': {'terms': {CARDS_COLLAPSE_FIELD: service_ids}},
        'collapse': {
            'field': CARDS_COLLAPSE_FIELD,
            'inner_hits': {'name': CARDS_INNER_HITS_NAME, 'size': CARDS_INNER_HITS_SIZE},
        },
    }
