"""Stage 3 - autocomplete rows derived from the in-memory cards (legacy autocomplete.py)."""
from srm_tools.logger import logger

from .city_bounds import add_city_bounds_to_queries
from .query_generation import generate_query_rows
from .query_scoring import add_scores_to_queries, group_identical_queries
from .query_templates import QUERY_ID_TOKEN_PATTERN


def add_query_ids(rows):
    return [
        {**row, 'id': '_'.join(QUERY_ID_TOKEN_PATTERN.findall(row['query']))}
        for row in rows
    ]


def generate_autocomplete(data):
    logger.info('Starting Autocomplete Flow')
    rows = generate_query_rows(data.cards)
    print(f'Generated {len(rows)} raw queries; grouping and scoring...')
    rows = group_identical_queries(rows)
    rows = add_scores_to_queries(rows)
    rows = add_city_bounds_to_queries(rows)
    data.autocomplete = add_query_ids(rows)
    logger.info('Finished Autocomplete Flow: %d queries', len(data.autocomplete))
