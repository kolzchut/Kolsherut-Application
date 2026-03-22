"""Autocomplete suggestion generation — pandas port.

Generates autocomplete suggestions for the search-as-you-type index
by doing a cartesian expansion of 10 templates × responses × situations
× orgs × cities, then deduplicating and scoring.

Replaces derive/autocomplete.py (217 lines of dataflows).
"""
import math
import re
import tempfile
import shutil
from itertools import product
from typing import Optional

import pandas as pd
import requests
from thefuzz import process

from conf import settings
from srm_tools.logger import logger


# ── Templates & Constants ──────────────────────────────────────────────

TEMPLATES = [
    '{response}',
    '{situation}',
    '{response} עבור {situation}',
    '{org_name}',
    '{response} של {org_name}',
    '{org_id}',
    '{response} ב{city_name}',
    'שירותים עבור {situation} ב{city_name}',
    '{response} עבור {situation} ב{city_name}',
    '{response} של {org_name} ב{city_name}',
]

STOP_WORDS = ['עבור', 'של', 'באיזור']

IGNORE_SITUATIONS = frozenset({
    'human_situations:language:hebrew_speaking',
    'human_situations:age_group:adults',
})

PKRE = re.compile('[0-9a-zA-Zא-ת]+')
VERIFY_ORG_ID = re.compile(r'^(srm|)[0-9]+$')
VERIFY_CITY_NAME = re.compile(r'''^[א-ת\-`"' ]+$''')

# Allowed short situation ids (two-level)
ALLOWED_SHORT_SITUATIONS = frozenset({
    'human_situations:armed_forces', 'human_situations:survivors',
    'human_situations:substance_dependency', 'human_situations:health',
    'human_situations:disability', 'human_situations:criminal_history',
    'human_situations:mental_health',
})


# ── Location Bounds ────────────────────────────────────────────────────

def _prepare_locations():
    """Download location-bounds datapackage and return (keys, mapping)."""
    url = settings.LOCATION_BOUNDS_SOURCE_URL
    # Download the datapackage zip
    try:
        import dataflows as DF
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmpfile:
            src = requests.get(url, stream=True).raw
            shutil.copyfileobj(src, tmpfile)
            tmpfile.close()
            all_places = DF.Flow(
                DF.load(tmpfile.name, format='datapackage'),
            ).results(on_error=None)[0][0]
    except ImportError:
        # Fallback: use requests to get JSON directly if dataflows unavailable
        resp = requests.get(url)
        all_places = resp.json() if resp.ok else []

    keys = [n for rec in all_places for n in rec.get('name', [])]
    mapping = {n: rec['bounds'] for rec in all_places for n in rec.get('name', [])}
    return keys, mapping


def _remove_stop_words(s: str) -> str:
    return ' '.join(w for w in s.split() if w not in STOP_WORDS)


# ── Template Expansion ─────────────────────────────────────────────────

def _expand_card(card: dict) -> list:
    """Expand a single card into autocomplete suggestion rows."""
    rows = []
    for importance, template in enumerate(TEMPLATES):
        responses = card.get('responses_parents', []) if '{response}' in template else [{}]
        situations = card.get('situations_parents', []) if '{situation}' in template else [{}]
        direct_responses = (card.get('response_ids') or []) + [None]
        direct_situations = (card.get('situation_ids') or []) + [None]

        if '{org_name}' in template or '{org_id}' in template:
            _org_names = [
                card.get('branch_operating_unit'),
                card.get('organization_short_name'),
                card.get('organization_name'),
                card.get('organization_original_name'),
            ]
            org_names = []
            for on in _org_names:
                if on and on not in org_names:
                    org_names.append(on)
        else:
            org_names = [None]

        org_id = card.get('organization_id') if org_names != [None] else None
        org_ids = [org_id]
        city_name = card.get('branch_city') if '{city_name}' in template else None
        city_names = [city_name]
        visible = '{org_id}' not in template

        for response, situation, org_name, oid, cname in product(responses, situations, org_names, org_ids, city_names):
            situation_id = situation.get('id') if isinstance(situation, dict) else None
            response_id = response.get('id') if isinstance(response, dict) else None

            if situation_id in IGNORE_SITUATIONS:
                continue
            if oid and VERIFY_ORG_ID.match(str(oid)) is None:
                continue
            if cname and VERIFY_CITY_NAME.match(str(cname)) is None:
                continue
            if (situation_id is not None
                    and len(situation_id.split(':')) < 3
                    and situation_id not in ALLOWED_SHORT_SITUATIONS):
                continue

            low = False
            if situation_id not in direct_situations:
                low = True
            if response_id not in direct_responses:
                low = True
            if org_name and (card.get('organization_branch_count') or 0) < 5:
                low = True

            resp_name = response.get('name') if isinstance(response, dict) else None
            sit_name = situation.get('name') if isinstance(situation, dict) else None

            query = template.format(
                response=resp_name, situation=sit_name,
                org_name=org_name, org_id=oid, city_name=cname,
            )
            if 'None' in query:
                continue

            query_heb = template.format(
                response=resp_name, situation=sit_name,
                org_name=org_name, org_id=org_name, city_name=cname,
            )

            structured_parts = set(filter(None, [
                resp_name, sit_name, cname,
                *(response.get('synonyms', []) if isinstance(response, dict) else []),
                *(situation.get('synonyms', []) if isinstance(situation, dict) else []),
                org_name,
            ]))
            structured_query = ' '.join(_remove_stop_words(x.strip()) for x in structured_parts if x)

            rows.append({
                'query': query,
                'query_heb': query_heb,
                'response': response_id,
                'situation': situation_id,
                'org_id': oid,
                'org_name': org_name,
                'city_name': cname,
                'synonyms': (
                    (response.get('synonyms', []) if isinstance(response, dict) else [])
                    + (situation.get('synonyms', []) if isinstance(situation, dict) else [])
                ),
                'response_name': resp_name,
                'situation_name': sit_name,
                'structured_query': structured_query,
                'visible': visible,
                'low': low,
                'importance': importance,
            })

    return rows


def generate_autocomplete(card_data: pd.DataFrame) -> pd.DataFrame:
    """Generate autocomplete suggestions from card_data DataFrame.

    Args:
        card_data: DataFrame from to_dp() with all card fields.

    Returns:
        DataFrame with columns: id, query, response, situation, org_name,
        city_name, response_name, situation_name, score, bounds.
    """
    logger.info('Generating autocomplete from %d cards', len(card_data))

    # Expand all cards into suggestion rows
    all_rows = []
    for _, card in card_data.iterrows():
        all_rows.extend(_expand_card(card.to_dict()))

    if not all_rows:
        logger.warning('No autocomplete rows generated')
        return pd.DataFrame()

    ac = pd.DataFrame(all_rows)
    logger.info('Expanded to %d raw autocomplete rows', len(ac))

    # Sort by importance (first template = most important)
    ac = ac.sort_values('importance').reset_index(drop=True)

    # Deduplicate by query — keep first (most important), count occurrences as score
    query_counts = ac.groupby('query').size().reset_index(name='count')
    ac = ac.drop_duplicates(subset=['query'], keep='first').reset_index(drop=True)
    ac = ac.merge(query_counts, on='query', how='left')

    # Score: (log(count) + 1)^2, set to 0.5 if low
    ac['score'] = ac['count'].apply(lambda v: (math.log(v) + 1) ** 2)
    ac.loc[ac['low'] == True, 'score'] = 0.5

    # City bounds lookup (fuzzy match)
    try:
        location_keys, location_mapping = _prepare_locations()
        bounds_cache = {}

        def get_bounds(city):
            if not city:
                return None
            if city in bounds_cache:
                return bounds_cache[city]
            match = process.extractOne(city, location_keys, score_cutoff=80)
            if match:
                bounds_cache[city] = location_mapping[match[0]]
            else:
                bounds_cache[city] = None
                logger.debug('Unknown city for bounds: %s', city)
            return bounds_cache[city]

        ac['bounds'] = ac['city_name'].apply(get_bounds)
    except Exception as e:
        logger.warning('Could not load location bounds: %s', e)
        ac['bounds'] = None

    # Generate ID
    ac['id'] = ac['query'].apply(lambda q: '_'.join(PKRE.findall(q)))

    # Select final columns
    final_cols = [
        'id', 'query', 'response', 'situation', 'org_id', 'org_name',
        'city_name', 'response_name', 'situation_name', 'score', 'bounds',
    ]
    final_cols = [c for c in final_cols if c in ac.columns]

    result = ac[final_cols].reset_index(drop=True)
    logger.info('Autocomplete: %d suggestions', len(result))
    return result
