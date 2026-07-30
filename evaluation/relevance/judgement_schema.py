from evaluation import relevance_vars

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
    """One verdict: the echoed item id, the verdict, and its one-sentence reason.

    Every field is in `required`, and `verdict` is pinned by `enum` to the verdict vocabulary in
    relevance_vars.py - so the vocabulary has exactly one definition and the schema cannot drift
    from the cache, the CSV or the band tables.
    """
    return {
        SCHEMA_TYPE_KEYWORD: SCHEMA_OBJECT_TYPE,
        SCHEMA_PROPERTIES_KEYWORD: {
            relevance_vars.JUDGEMENT_ID_KEY: {SCHEMA_TYPE_KEYWORD: SCHEMA_INTEGER_TYPE},
            relevance_vars.JUDGEMENT_VERDICT_KEY: {SCHEMA_TYPE_KEYWORD: SCHEMA_STRING_TYPE,
                                                   SCHEMA_ENUM_KEYWORD: relevance_vars.VERDICTS},
            relevance_vars.JUDGEMENT_REASON_KEY: {SCHEMA_TYPE_KEYWORD: SCHEMA_STRING_TYPE},
        },
        SCHEMA_REQUIRED_KEYWORD: [relevance_vars.JUDGEMENT_ID_KEY,
                                  relevance_vars.JUDGEMENT_VERDICT_KEY,
                                  relevance_vars.JUDGEMENT_REASON_KEY],
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
