import json

from evaluation import relevance_prompt_strings, relevance_vars
from evaluation.relevance.judgement_schema import build_judgement_response_schema
from evaluation.relevance_schemas import JudgementChunk

# The user payload's own field names, matching the input shape the system prompt describes.
PAYLOAD_QUERY_FIELD = 'query'
PAYLOAD_SERVICES_FIELD = 'services'
PAYLOAD_SERVICE_NAME_FIELD = 'name'
# Gemini content wire fields.
CONTENT_ROLE_FIELD = 'role'
CONTENT_PARTS_FIELD = 'parts'
PART_TEXT_FIELD = 'text'
USER_ROLE = 'user'
FIRST_ITEM_ID = 1


def build_user_payload(chunk: JudgementChunk) -> dict:
    """The query once, then its services as {id, name}. The id is the item's 1-based position in
    this chunk and is what the verdicts are joined back on, so nothing depends on the model
    echoing a name. Names go through verbatim - no normalising, trimming or hinting."""
    return {
        PAYLOAD_QUERY_FIELD: chunk.query,
        PAYLOAD_SERVICES_FIELD: [
            {relevance_vars.JUDGEMENT_ID_KEY: item_id, PAYLOAD_SERVICE_NAME_FIELD: item.service_name}
            for item_id, item in enumerate(chunk.items, start=FIRST_ITEM_ID)
        ],
    }


def build_text_content(text: str) -> dict:
    return {CONTENT_PARTS_FIELD: [{PART_TEXT_FIELD: text}]}


def build_generation_config() -> dict:
    """Structured output, the thinking level, and the output cap.

    `response_mime_type` + `response_schema` is what the installed google-genai accepts; it has no
    `response_format` field at all. `thinking_level` is the Gemini 3 control - `thinking_budget` is
    the 2.5 one and must not be used - and thinking cannot be disabled, only reduced to minimal.
    No `cached_content`: the system prompt is an order of magnitude below every published minimum
    cacheable prefix and implicit caching is on by default anyway.
    """
    return {
        relevance_vars.GENERATION_CONFIG_MAX_OUTPUT_TOKENS_FIELD: relevance_vars.JUDGE_MAX_TOKENS,
        relevance_vars.GENERATION_CONFIG_RESPONSE_MIME_TYPE_FIELD: relevance_vars.JUDGE_RESPONSE_MIME_TYPE,
        relevance_vars.GENERATION_CONFIG_RESPONSE_SCHEMA_FIELD: build_judgement_response_schema(),
        relevance_vars.GENERATION_CONFIG_THINKING_CONFIG_FIELD: {
            relevance_vars.THINKING_CONFIG_LEVEL_FIELD: relevance_vars.JUDGE_THINKING_LEVEL,
        },
    }


def build_judgement_request(chunk: JudgementChunk) -> dict:
    """One JSONL line: {"key": <chunk key>, "request": {...}}.

    `system_instruction` is a SIBLING of `contents` inside `request`, not a generation_config
    member. The key is the chunk's, which is what a result line is joined back on.
    """
    payload_text = json.dumps(build_user_payload(chunk), ensure_ascii=False)
    return {
        relevance_vars.BATCH_REQUEST_KEY_FIELD: chunk.key,
        relevance_vars.BATCH_REQUEST_BODY_FIELD: {
            relevance_vars.BATCH_REQUEST_SYSTEM_INSTRUCTION_FIELD: build_text_content(
                relevance_prompt_strings.JUDGE_SYSTEM_PROMPT),
            relevance_vars.BATCH_REQUEST_CONTENTS_FIELD: [
                {CONTENT_ROLE_FIELD: USER_ROLE, **build_text_content(payload_text)},
            ],
            relevance_vars.BATCH_REQUEST_GENERATION_CONFIG_FIELD: build_generation_config(),
        },
    }


def build_judgement_requests(chunks: list[JudgementChunk]) -> list[dict]:
    return [build_judgement_request(chunk) for chunk in chunks]
