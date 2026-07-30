from evaluation import relevance_marker_vars, relevance_vars

# JSON Schema keywords, named once here because this file is the only place the judge's response
# schema is spelled out. Gemini's supported subset is WIDER than Anthropic's and the constraints
# invert: additionalProperties is allowed but not required, and enum / minItems / maxItems /
# minimum / maximum ARE supported. The catch is that unsupported keywords are silently IGNORED
# rather than rejected, so no constraint below is trusted to have taken effect - the real guard is
# the completeness assertion in assert_judgement_completeness.py.
SCHEMA_TYPE_KEYWORD = 'type'
SCHEMA_PROPERTIES_KEYWORD = 'properties'
SCHEMA_REQUIRED_KEYWORD = 'required'
SCHEMA_ITEMS_KEYWORD = 'items'
SCHEMA_ENUM_KEYWORD = 'enum'
SCHEMA_OBJECT_TYPE = 'object'
SCHEMA_ARRAY_TYPE = 'array'
SCHEMA_STRING_TYPE = 'string'
SCHEMA_INTEGER_TYPE = 'integer'
# The wrapper key of the response object, matching the output shape the system prompt describes.
JUDGEMENTS_FIELD = 'judgements'


def build_judgement_entry_schema() -> dict:
    """One answer: the echoed item id and one marker, and nothing else.

    Both fields are in `required`, and `marker` is pinned by `enum` to the three literals in
    relevance_marker_vars.py, so the model cannot return prose where a verdict belongs. DEVIATION
    FROM §11.5 (user-directed, documented in relevance_marker_vars.py): the spec's entry carries a
    spelled-out `verdict` plus a one-sentence `reason` and this one carries neither. The canonical
    verdict vocabulary in relevance_vars.py is untouched - it is what the marker decodes to at the
    parse boundary, so the cache, the CSV and the band tables still see only canonical verdicts.
    """
    return {
        SCHEMA_TYPE_KEYWORD: SCHEMA_OBJECT_TYPE,
        SCHEMA_PROPERTIES_KEYWORD: {
            relevance_vars.JUDGEMENT_ID_KEY: {SCHEMA_TYPE_KEYWORD: SCHEMA_INTEGER_TYPE},
            relevance_marker_vars.JUDGEMENT_MARKER_KEY: {
                SCHEMA_TYPE_KEYWORD: SCHEMA_STRING_TYPE,
                SCHEMA_ENUM_KEYWORD: relevance_marker_vars.VERDICT_MARKERS},
        },
        SCHEMA_REQUIRED_KEYWORD: [relevance_vars.JUDGEMENT_ID_KEY,
                                  relevance_marker_vars.JUDGEMENT_MARKER_KEY],
    }


def build_judgement_response_schema() -> dict:
    """The whole structured output: one array of verdicts under one wrapper key.

    Kept deliberately shallow - object, array, object, scalars - because the API may reject very
    large or deeply nested schemas. A fresh dict is built per call so no caller can mutate a
    shared one.
    """
    return {
        SCHEMA_TYPE_KEYWORD: SCHEMA_OBJECT_TYPE,
        SCHEMA_PROPERTIES_KEYWORD: {
            JUDGEMENTS_FIELD: {SCHEMA_TYPE_KEYWORD: SCHEMA_ARRAY_TYPE,
                               SCHEMA_ITEMS_KEYWORD: build_judgement_entry_schema()},
        },
        SCHEMA_REQUIRED_KEYWORD: [JUDGEMENTS_FIELD],
    }
