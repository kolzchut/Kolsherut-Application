import json

from evaluation import relevance_strings, relevance_vars
from evaluation.relevance.judgement_schema import JUDGEMENTS_FIELD

# Response wire fields. Each is listed in both spellings the payload might carry, because the
# result file is written by the API in camelCase while an SDK-serialized line would be snake_case,
# and reading the wrong one would turn a blocked chunk into a silently empty one.
ERROR_FIELDS = ('error',)
CANDIDATES_FIELDS = ('candidates',)
CONTENT_FIELDS = ('content',)
PARTS_FIELDS = ('parts',)
TEXT_FIELDS = ('text',)
FINISH_REASON_FIELDS = ('finishReason', 'finish_reason')
PROMPT_FEEDBACK_FIELDS = ('promptFeedback', 'prompt_feedback')
BLOCK_REASON_FIELDS = ('blockReason', 'block_reason')
FIRST_CANDIDATE_INDEX = 0


def read_first_present_field(payload: dict, field_names: tuple[str, ...]):
    """The first of the accepted spellings that is present, or None."""
    for field_name in field_names:
        if field_name in payload:
            return payload[field_name]
    return None


def read_result_line_key(result_line: dict) -> str:
    """The user-defined key echoed back. This, never position, is what a result is joined on."""
    return result_line[relevance_vars.BATCH_REQUEST_KEY_FIELD]


def read_block_reason(response: dict) -> str | None:
    """A prompt-side block sets promptFeedback.blockReason and returns NO candidates at all."""
    prompt_feedback = read_first_present_field(response, PROMPT_FEEDBACK_FIELDS) or {}
    return read_first_present_field(prompt_feedback, BLOCK_REASON_FIELDS)


def read_unjudged_reason(result_line: dict) -> str | None:
    """Why this line yields no verdicts, or None when it does.

    Only finishReason STOP is a usable verdict. Everything else - MAX_TOKENS, SAFETY, RECITATION,
    PROHIBITED_CONTENT, BLOCKLIST, SPII, LANGUAGE, OTHER and anything unrecognised - means the
    candidate carries no content, and a prompt-side block carries no candidate to read at all.
    """
    error = read_first_present_field(result_line, ERROR_FIELDS)
    if error:
        return relevance_strings.UNJUDGED_REASON_REQUEST_ERROR.format(error=error)
    response = result_line.get(relevance_vars.BATCH_RESPONSE_FIELD)
    if not response:
        return relevance_strings.UNJUDGED_REASON_NO_RESPONSE
    block_reason = read_block_reason(response)
    if block_reason:
        return relevance_strings.UNJUDGED_REASON_PROMPT_BLOCKED.format(block_reason=block_reason)
    candidates = read_first_present_field(response, CANDIDATES_FIELDS)
    if not candidates:
        return relevance_strings.UNJUDGED_REASON_NO_RESPONSE
    finish_reason = read_first_present_field(candidates[FIRST_CANDIDATE_INDEX],
                                             FINISH_REASON_FIELDS)
    if finish_reason != relevance_vars.FINISH_REASON_STOP:
        return relevance_strings.UNJUDGED_REASON_FINISH_REASON.format(finish_reason=finish_reason)
    return None


def read_candidate_text(result_line: dict) -> str:
    """The first candidate's parts, concatenated. Only ever called once read_unjudged_reason has
    confirmed there is a candidate that finished with STOP, so nothing is indexed blind."""
    response = result_line[relevance_vars.BATCH_RESPONSE_FIELD]
    candidate = read_first_present_field(response, CANDIDATES_FIELDS)[FIRST_CANDIDATE_INDEX]
    content = read_first_present_field(candidate, CONTENT_FIELDS)
    parts = read_first_present_field(content, PARTS_FIELDS)
    return ''.join(read_first_present_field(part, TEXT_FIELDS) or '' for part in parts)


def read_judgement_entries(result_line: dict) -> list[dict]:
    """The verdict objects the model returned, still exactly as it wrote them."""
    return json.loads(read_candidate_text(result_line))[JUDGEMENTS_FIELD]
