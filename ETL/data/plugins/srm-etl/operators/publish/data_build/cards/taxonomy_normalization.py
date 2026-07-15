"""Taxonomy id cleanup (legacy normalize_taxonomy_ids, map_taxonomy, fix_situations)."""
import re

from srm_tools.logger import logger

BARE_ROOT_TOKEN = 'human_situations'
SINGULAR_ROOT_PREFIX = 'human_situation:'
PLURAL_ROOT_PREFIX = 'human_situations:'
SMASHED_IDS_PATTERN = re.compile(r'human_situations:[A-Za-z0-9_:-]+|human_situation:[A-Za-z0-9_:-]+')
BOTH_GENDER_SITUATIONS = ('human_situations:gender:women', 'human_situations:gender:men')
HEBREW_SPEAKING_SITUATION = 'human_situations:language:hebrew_speaking'
ARABIC_SPEAKING_SITUATION = 'human_situations:language:arabic_speaking'
ARABIC_SPEAKING_SECTORS = ('human_situations:sectors:arabs', 'human_situations:sectors:bedouin')


def canonicalize_taxonomy_token(token):
    if token.startswith(SINGULAR_ROOT_PREFIX) and not token.startswith(PLURAL_ROOT_PREFIX):
        return PLURAL_ROOT_PREFIX + token.split(':', 1)[1]
    return token


def clean_taxonomy_token(token):
    """Returns the cleaned token, or None when it must be skipped."""
    if not isinstance(token, str):
        return token
    token = canonicalize_taxonomy_token(token).strip().strip(',;')
    if not token:
        return None
    if token == BARE_ROOT_TOKEN:
        logger.warning('Ignoring invalid taxonomy id (root only): %s', token)
        return None
    return token


def split_raw_taxonomy_value(raw):
    """Split comma-concatenated and space-smashed multi-id values into single tokens."""
    if not isinstance(raw, str):
        return [raw]
    comma_parts = [part for part in raw.split(',') if part.strip()] if ',' in raw else [raw]
    tokens = []
    for part in comma_parts:
        part = part.strip()
        if part.count(PLURAL_ROOT_PREFIX) + part.count(SINGULAR_ROOT_PREFIX) > 1:
            smashed_tokens = SMASHED_IDS_PATTERN.findall(part)
            if smashed_tokens:
                tokens.extend(smashed_tokens)
                continue
        tokens.append(part)
    return tokens


def normalize_taxonomy_ids(ids):
    if not ids:
        return ids
    normalized = []
    seen = set()
    for raw in ids:
        for token in split_raw_taxonomy_value(raw):
            if not token:
                continue
            token = clean_taxonomy_token(token)
            if token is None or token in seen:
                continue
            seen.add(token)
            normalized.append(token)
    return normalized


def map_taxonomy_ids(ids, taxonomy_lookup):
    """Keep only ids known to the taxonomy, mapped to their canonical id, sorted
    (the legacy set order was hash-seed dependent - deliberate change #6)."""
    return sorted(set(
        taxonomy_lookup[taxonomy_id]['id'] for taxonomy_id in ids if taxonomy_id in taxonomy_lookup
    ))


def fix_situations(ids):
    if not ids:
        return ids
    fixed = list(ids)
    if all(situation in fixed for situation in BOTH_GENDER_SITUATIONS):
        fixed = [situation for situation in fixed if situation not in BOTH_GENDER_SITUATIONS]
    if HEBREW_SPEAKING_SITUATION in fixed:
        fixed = [situation for situation in fixed if situation != HEBREW_SPEAKING_SITUATION]
    if any(sector in fixed for sector in ARABIC_SPEAKING_SECTORS):
        if ARABIC_SPEAKING_SITUATION not in fixed:
            fixed = fixed + [ARABIC_SPEAKING_SITUATION]
    return fixed
