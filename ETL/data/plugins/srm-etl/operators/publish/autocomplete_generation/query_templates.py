"""Autocomplete query constants (legacy autocomplete.py module constants).

The template list order matters: the index of a template is its importance.
"""
import re

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

STOP_WORDS = [
    'עבור',
    'של',
    'באיזור',
]

IGNORE_SITUATIONS = {
    'human_situations:language:hebrew_speaking',
    'human_situations:age_group:adults',
}

IMPORTANT_TWO_LEVEL_SITUATIONS = (
    'human_situations:armed_forces',
    'human_situations:survivors',
    'human_situations:substance_dependency',
    'human_situations:health',
    'human_situations:disability',
    'human_situations:criminal_history',
    'human_situations:mental_health',
)

QUERY_ID_TOKEN_PATTERN = re.compile('[0-9a-zA-Zא-ת]+')
VERIFY_CITY_NAME = re.compile('''^[א-ת-`"' ]+$''')
MINIMUM_SITUATION_SEGMENTS = 3
