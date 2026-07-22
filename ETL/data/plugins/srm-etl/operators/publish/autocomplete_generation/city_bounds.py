"""City bounds for autocomplete queries, fuzzy-matched against places.csv.

Deliberate behavior change #4: a query whose city cannot be matched is always
kept with bounds=None (the legacy code dropped the first occurrence and kept
later ones), and each unknown city is logged once.
"""
from thefuzz import process

from srm_tools.logger import logger

from ..shared.places_csv_loader import load_places

FUZZY_MATCH_SCORE_CUTOFF = 80


def build_city_bounds_lookup():
    places = load_places()
    place_names = [name for place in places for name in place['name']]
    bounds_by_name = {name: place['bounds'] for place in places for name in place['name']}
    return place_names, bounds_by_name


def resolve_city_bounds(city_name, place_names, bounds_by_name, bounds_cache):
    if city_name in bounds_cache:
        return bounds_cache[city_name]
    match = process.extractOne(city_name, place_names, score_cutoff=FUZZY_MATCH_SCORE_CUTOFF)
    if match:
        bounds_cache[city_name] = bounds_by_name[match[0]]
    else:
        bounds_cache[city_name] = None
        logger.warning('Unknown city: %s', city_name)
    return bounds_cache[city_name]


def add_city_bounds_to_queries(rows):
    place_names, bounds_by_name = build_city_bounds_lookup()
    bounds_cache = {}
    return [
        {
            **row,
            'bounds': (
                resolve_city_bounds(row['city_name'], place_names, bounds_by_name, bounds_cache)
                if row['city_name'] else None
            ),
        }
        for row in rows
    ]
