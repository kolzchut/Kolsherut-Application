import os
from pathlib import Path

from dotenv import load_dotenv

from evaluation import vars

load_dotenv(Path(__file__).resolve().parent / '.env')

# Everything the LLM relevance judge needs. Split out of vars.py to keep that file within the
# line budget; consumed only by evaluation/relevance/ and clients/llm_client.py.

# The judge's Gemini credential. Purpose-scoped so it can differ from retrieval's
# GEMINI_EMBEDDER_API_KEY - which is why llm_client.py passes it explicitly. A secret, no default.
GEMINI_JUDGE_API_KEY = os.getenv('GEMINI_JUDGE_API_KEY', '')

# The judge. Google's cheapest Stable tier, chosen on cost; it publishes no multilingual benchmark,
# so its Hebrew judgement quality is unmeasured going in and the Mission 6 agreement gate is the
# only thing that decides usability. Overridable because escalating to a stronger model is a
# supported outcome of that gate, and swapping it invalidates the judgement cache.
JUDGE_MODEL = os.getenv('EVAL_JUDGE_MODEL', 'gemini-3.1-flash-lite')
# Gemini's thinking control, which replaces Anthropic's `effort`. 'minimal' is this model's
# documented default and thinking cannot be disabled on any Gemini 3 model - minimal reduces it,
# never removes it. This is bounded classification, so the default is also the right pick.
JUDGE_THINKING_LEVEL = 'minimal'
# How many (query, service) pairs go into one request. This is a reliability lever, not a cost
# one: cost is indifferent to it, while a lite-tier model drifts further into the list, omits
# items and mis-echoes ids more as the list grows. Start at 40 and halve on repeated id gaps.
JUDGEMENT_CHUNK_SIZE = 40
# Sized from the chunk: 40 verdicts x ~25 output tokens each is ~1,000 tokens of verdict JSON, and
# thinking roughly doubles output and is billed at the output rate, so ~2,000 is the realistic
# ceiling. 4,096 leaves ~2x headroom on top, because whether thinking tokens are deducted from this
# limit is documented inconsistently. Far under the model's 65,536 output cap either way.
JUDGE_MAX_TOKENS = 4096
JUDGE_RESPONSE_MIME_TYPE = 'application/json'

# Batch API. Each JSONL line is {"key": ..., "request": {...}} and the user-defined key is what
# correlates a result line back to its request, so results are never joined by position.
BATCH_REQUEST_KEY_FIELD = 'key'
BATCH_REQUEST_BODY_FIELD = 'request'
BATCH_REQUEST_CONTENTS_FIELD = 'contents'
# system_instruction is a sibling of contents inside `request`, NOT a generation_config member.
BATCH_REQUEST_SYSTEM_INSTRUCTION_FIELD = 'system_instruction'
BATCH_REQUEST_GENERATION_CONFIG_FIELD = 'generation_config'
BATCH_RESPONSE_FIELD = 'response'
# The generation_config members this judge sets. Verified against the installed google-genai:
# it accepts response_mime_type + response_schema, and has no `response_format` field at all.
GENERATION_CONFIG_MAX_OUTPUT_TOKENS_FIELD = 'max_output_tokens'
GENERATION_CONFIG_RESPONSE_MIME_TYPE_FIELD = 'response_mime_type'
GENERATION_CONFIG_RESPONSE_SCHEMA_FIELD = 'response_schema'
GENERATION_CONFIG_THINKING_CONFIG_FIELD = 'thinking_config'
THINKING_CONFIG_LEVEL_FIELD = 'thinking_level'
BATCH_CHUNK_KEY_PREFIX = 'judgement-chunk-'
BATCH_INPUT_MIME_TYPE = 'jsonl'
BATCH_REQUESTS_JSONL_PATH = vars.RESULTS_DIR / 'judgement_requests.jsonl'
BATCH_POLL_INTERVAL_SECONDS = float(os.getenv('EVAL_BATCH_POLL_INTERVAL_SECONDS', '30'))
# Jobs expire at 48 h, so polling past that only burns requests.
BATCH_POLL_TIMEOUT_SECONDS = float(os.getenv('EVAL_BATCH_POLL_TIMEOUT_SECONDS', '172800'))
# Job states the client branches on. QUEUED / CANCELLING / PAUSED / UPDATING are in the
# installed SDK's JobState enum but absent from the Batch API page, and PARTIALLY_SUCCEEDED
# means some requests were lost - all are named explicitly so no unexpected state can read as
# a silent success or spin the poll loop forever.
JOB_STATE_SUCCEEDED = 'JOB_STATE_SUCCEEDED'
JOB_STATES_STILL_RUNNING = (
    'JOB_STATE_PENDING', 'JOB_STATE_QUEUED', 'JOB_STATE_RUNNING',
    'JOB_STATE_CANCELLING', 'JOB_STATE_PAUSED', 'JOB_STATE_UPDATING',
)
# Only STOP is a usable verdict; every other finish reason means the candidate has no content.
FINISH_REASON_STOP = 'STOP'

# Verdict vocabulary. Changing it is a schema-shape change - bump JUDGEMENT_SCHEMA_VERSION.
VERDICT_RELEVANT = 'relevant'
VERDICT_IRRELEVANT = 'irrelevant'
VERDICT_UNCLEAR = 'unclear'
VERDICTS = [VERDICT_RELEVANT, VERDICT_IRRELEVANT, VERDICT_UNCLEAR]

# Judgement cache. A verdict is a pure function of (query, service_name, model, prompt): it does
# not depend on retrieval configuration, so it survives every operating-point change. Committed
# data, unlike RESULTS_DIR, which is gitignored run output.
JUDGEMENT_CACHE_PATH = vars.EVALUATION_ROOT / 'data' / 'relevance-judgements.json'
RELEVANCE_JUDGEMENTS_CSV_PATH = vars.RESULTS_DIR / 'relevance_judgements.csv'
JUDGEMENT_CACHE_MODEL_KEY = 'model'
JUDGEMENT_CACHE_PROMPT_CHECKSUM_KEY = 'prompt_checksum'
JUDGEMENT_CACHE_SCHEMA_VERSION_KEY = 'schema_version'
JUDGEMENT_CACHE_JUDGEMENTS_KEY = 'judgements'
JUDGEMENT_ID_KEY = 'id'
JUDGEMENT_VERDICT_KEY = 'verdict'
JUDGEMENT_REASON_KEY = 'reason'
# Cache keys are '<query> <service_name>'. Keyed on those two alone - never rank, never side.
# Both change with retrieval config while the verdict does not, so keying on either would
# discard reusable verdicts on every threshold sweep.
JUDGEMENT_CACHE_KEY_SEPARATOR = ' '
# Bump whenever the verdict schema SHAPE changes - a new field, a renamed key, a changed verdict
# vocabulary. prompt_checksum catches prompt edits and model catches model swaps, but neither
# notices that `reason` became a list. v2 added the frozen inputs' SHA-256 hashes to the payload.
JUDGEMENT_SCHEMA_VERSION = 2
CHECKSUM_PREFIX = vars.CHECKSUM_PREFIX

# Mission 6 human-audit sample. Fixed so the sampled rows are reproducible across runs.
REVIEW_SAMPLE_SEED = 20260729
