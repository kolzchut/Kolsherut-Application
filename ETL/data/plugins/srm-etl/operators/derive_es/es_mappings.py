"""Explicit ES index mappings for all 6 srm__ indexes.

Replaces the SRMMappingGenerator auto-mapping with hand-written Python
dicts. Each mapping includes the Hebrew analyzer settings and a 'revision'
keyword field used for atomic swap.

Usage:
    from operators.derive_es.es_mappings import (
        INDEX_SETTINGS,
        CARDS_MAPPING,
        AUTOCOMPLETE_MAPPING,
        RESPONSES_MAPPING,
        SITUATIONS_MAPPING,
        ORGS_MAPPING,
        PLACES_MAPPING,
    )
"""

# ── Shared analyzer settings (applied to all indexes) ──────────────────

INDEX_SETTINGS = {
    "analysis": {
        "analyzer": {
            "hebrew": {
                "tokenizer": "icu_tokenizer",
                "filter": [
                    "icu_folding",
                    "icu_normalizer",
                ],
            }
        }
    }
}

# ── Reusable field-type fragments ───────────────────────────────────────

_KEYWORD = {"type": "keyword"}
_TEXT = {"type": "text"}
_TEXT_HEBREW = {
    "type": "text",
    "fields": {
        "hebrew": {"type": "text", "analyzer": "hebrew"}
    },
}
_NON_INDEXED_TEXT = {"type": "text", "index": False}
_SEARCH_AS_YOU_TYPE = {"type": "search_as_you_type"}
_FLOAT = {"type": "float"}
_INTEGER = {"type": "integer"}
_BOOLEAN = {"type": "boolean"}
_GEOPOINT = {"type": "geo_point"}
_DATE = {"type": "date", "format": "strict_date_optional_time||epoch_millis"}

_REVISION = {"type": "keyword"}  # stamped on every doc for atomic swap

_TAXONOMY_ITEM = {
    "type": "nested",
    "properties": {
        "id": {"type": "keyword"},
        "name": {
            "type": "text",
            "fields": {
                "hebrew": {"type": "text", "analyzer": "hebrew"}
            },
        },
        "synonyms": {
            "type": "text",
            "fields": {
                "hebrew": {"type": "text", "analyzer": "hebrew"}
            },
        },
    },
}

_URL_OBJECT = {
    "type": "object",
    "enabled": False,  # Not indexed — stored only
}

_ADDRESS_PARTS = {
    "type": "object",
    "properties": {
        "primary": {
            "type": "text",
            "fields": {
                "keyword": {"type": "keyword"},
                "hebrew": {"type": "text", "analyzer": "hebrew"},
            },
        },
        "secondary": {
            "type": "text",
            "fields": {
                "hebrew": {"type": "text", "analyzer": "hebrew"}
            },
        },
    },
}

_NON_INDEXED_ADDRESS_PARTS = {
    "type": "object",
    "properties": {
        "primary": _TEXT,
        "secondary": _TEXT,
    },
}


# ── srm__cards ──────────────────────────────────────────────────────────
# Source: to_es.py -> data_api_es_flow()
# Main card data index — one doc per service+branch combination.

CARDS_MAPPING = {
    "properties": {
        # Core identifiers
        "card_id":                  _KEYWORD,
        "service_id":               _KEYWORD,
        "branch_id":                _KEYWORD,
        "organization_id":          _KEYWORD,

        # Taxonomy (nested objects with id/name/synonyms)
        "situations":               _TAXONOMY_ITEM,
        "responses":                _TAXONOMY_ITEM,
        "situations_parents":       _TAXONOMY_ITEM,
        "responses_parents":        _TAXONOMY_ITEM,

        # Taxonomy ID arrays (keyword)
        "situation_ids":            _KEYWORD,
        "response_ids":             _KEYWORD,

        # Scoring
        "score":                    _FLOAT,
        "service_boost":            _FLOAT,

        # Names (text + hebrew)
        "service_name":             _TEXT_HEBREW,
        "branch_name":              _TEXT_HEBREW,
        "organization_name":        _TEXT_HEBREW,
        "organization_short_name":  _TEXT_HEBREW,
        "branch_short_name":        _TEXT_HEBREW,

        # Descriptions (text + hebrew)
        "service_description":      _TEXT_HEBREW,
        "service_details":          _TEXT_HEBREW,
        "branch_description":       _TEXT_HEBREW,
        "organization_purpose":     _TEXT_HEBREW,

        # Address parts (object with primary/secondary)
        "branch_address_parts":     _ADDRESS_PARTS,
        "organization_address_parts": _NON_INDEXED_ADDRESS_PARTS,

        # URLs (non-indexed objects)
        "service_urls":             _URL_OBJECT,
        "branch_urls":              _URL_OBJECT,
        "organization_urls":        _URL_OBJECT,

        # Contact info (non-indexed text)
        "branch_email_address":       _NON_INDEXED_TEXT,
        "organization_phone_numbers": _NON_INDEXED_TEXT,
        "organization_email_address": _NON_INDEXED_TEXT,
        "branch_phone_numbers":       _NON_INDEXED_TEXT,
        "service_phone_numbers":      _NON_INDEXED_TEXT,
        "service_email_address":      _NON_INDEXED_TEXT,

        # Data sources
        "data_sources":             _NON_INDEXED_TEXT,

        # Location
        "branch_geometry":          _GEOPOINT,
        "national_service":         _BOOLEAN,
        "branch_city":              _TEXT_HEBREW,
        "branch_address":           _TEXT_HEBREW,
        "branch_location_accurate": _BOOLEAN,

        # Organization metadata
        "organization_kind":        _KEYWORD,
        "organization_branch_count": _INTEGER,

        # Misc
        "response_category":        _KEYWORD,
        "response_categories":      _KEYWORD,
        "point_id":                 _KEYWORD,
        "branch_offset":            _KEYWORD,

        # Org name parts (object)
        "organization_name_parts":  _ADDRESS_PARTS,

        # Dates
        "airtable_last_modified":   _DATE,
        "service_last_modified":    _DATE,
        "branch_last_modified":     _DATE,

        # Revision (for atomic swap)
        "revision":                 _REVISION,
    }
}


# ── srm__autocomplete ──────────────────────────────────────────────────
# Source: to_es.py -> load_autocomplete_to_es_flow()
# One doc per autocomplete suggestion.

AUTOCOMPLETE_MAPPING = {
    "properties": {
        "id":               _KEYWORD,
        "query":            _SEARCH_AS_YOU_TYPE,
        "response":         _TEXT_HEBREW,
        "situation":        _TEXT_HEBREW,
        "response_name":    _TEXT_HEBREW,
        "situation_name":   _TEXT_HEBREW,
        "org_name":         _TEXT_HEBREW,
        "city_name":        _TEXT_HEBREW,
        "score":            _FLOAT,
        "revision":         _REVISION,
    }
}


# ── srm__responses ─────────────────────────────────────────────────────
# Source: to_es.py -> load_responses_to_es_flow()
# One doc per active response taxonomy node.

RESPONSES_MAPPING = {
    "properties": {
        "id":           _KEYWORD,
        "name":         _TEXT_HEBREW,
        "synonyms":     _TEXT_HEBREW,
        "breadcrumbs":  _TEXT,
        "count":        _INTEGER,
        "score":        _FLOAT,
        "revision":     _REVISION,
    }
}


# ── srm__situations ────────────────────────────────────────────────────
# Source: to_es.py -> load_situations_to_es_flow()
# One doc per active situation taxonomy node.

SITUATIONS_MAPPING = {
    "properties": {
        "id":           _KEYWORD,
        "name":         _TEXT_HEBREW,
        "synonyms":     _TEXT_HEBREW,
        "breadcrumbs":  _TEXT,
        "count":        _INTEGER,
        "score":        _FLOAT,
        "revision":     _REVISION,
    }
}


# ── srm__orgs ──────────────────────────────────────────────────────────
# Source: to_es.py -> load_organizations_to_es_flow()
# One doc per active organization with card count.

ORGS_MAPPING = {
    "properties": {
        "id":           _KEYWORD,
        "name":         _TEXT_HEBREW,
        "description":  _TEXT_HEBREW,
        "kind":         _KEYWORD,
        "count":        _INTEGER,
        "score":        _FLOAT,
        "revision":     _REVISION,
    }
}


# ── srm__places ────────────────────────────────────────────────────────
# Source: to_es.py -> load_locations_to_es_flow()
# One doc per geographic place (city/town/region) with bounds.

PLACES_MAPPING = {
    "properties": {
        "key":      _KEYWORD,
        "name":     _TEXT_HEBREW,
        "query":    _TEXT_HEBREW,
        "bounds":   _FLOAT,      # Array of 4 floats [minLon, minLat, maxLon, maxLat]
        "place":    _KEYWORD,
        "score":    _FLOAT,
        "revision": _REVISION,
    }
}


# ── Convenience: all mappings by index name ─────────────────────────────

ALL_MAPPINGS = {
    "srm__cards":        CARDS_MAPPING,
    "srm__autocomplete": AUTOCOMPLETE_MAPPING,
    "srm__responses":    RESPONSES_MAPPING,
    "srm__situations":   SITUATIONS_MAPPING,
    "srm__orgs":         ORGS_MAPPING,
    "srm__places":       PLACES_MAPPING,
}


def index_settings_and_mappings(index_name: str) -> dict:
    """Return combined settings+mappings body for es.indices.create()."""
    return {
        "settings": INDEX_SETTINGS,
        "mappings": ALL_MAPPINGS[index_name],
    }
