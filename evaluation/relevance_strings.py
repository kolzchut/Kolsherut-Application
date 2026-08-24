# The relevance judge's operational literals: CLI help, the judgement CSV headers, log lines and
# error messages. Split out of strings.py alongside relevance_vars.py. The judge system prompt
# itself lives in relevance_prompt_strings.py - see the note at the top of that file.


# CLI. Judging is opt-in so the default run stays free, offline and reproducible.
CLI_JUDGE_HELP = (
    'Judge the frozen relevance snapshot with the LLM judge. Opt-in: calls the Gemini Batch API '
    'and needs GEMINI_JUDGE_API_KEY.'
)
CLI_JUDGE_LIMIT_HELP = 'Judge only the first N pairs of the frozen snapshot.'

# Batch job label, shown in the Gemini console alongside the uploaded request file.
BATCH_JOB_DISPLAY_NAME = 'kolsherut-relevance-judgements'

# Freeze stage. The source_run line is written INTO the manifest, so it is a value that leaves the
# pipeline rather than a log message. It names the day rather than the arm: the arm is recorded in
# the retrieval_config block right below it, and stating it twice invites the two to disagree.
MANIFEST_SOURCE_RUN = 'results run of {date}'
LOG_FROZE_JUDGE_INPUT = 'Froze {pairs} pairs from {source} into {directory}'
LOG_FROZE_SIDE = '  {side}: {pairs} pairs, {hash}'

# Relevance-judgement CSV: one row per judged (query, service) pair. Neither the five score
# headers nor the five content headers are listed here - they are vars.SERVICE_SCORE_KEYS and
# vars.SERVICE_DETAIL_KEYS verbatim, so the JSON, this CSV and the FE badges name them
# identically and nothing has to be mapped between them.
JUDGEMENT_CSV_QUERY_HEADER = 'query'
JUDGEMENT_CSV_SIDE_HEADER = 'side'
JUDGEMENT_CSV_RANK_HEADER = 'rank'
JUDGEMENT_CSV_SERVICE_NAME_HEADER = 'service_name'
# Position in retrieval's whole returned list, next to the per-side `rank` rather than replacing
# it: `rank` is half of the (query, side, rank) key service_diff.csv joins on.
JUDGEMENT_CSV_RAW_RANK_HEADER = 'raw_rank'
JUDGEMENT_CSV_VERDICT_HEADER = 'verdict'
JUDGEMENT_CSV_MODEL_HEADER = 'model'
JUDGEMENT_CSV_JUDGED_AT_HEADER = 'judged_at'
# Written into the score cells of a missed-side row. Blank, never 0.0: nothing ever scored those
# services, and a zero would claim the embedder rated them maximally dissimilar. The same cell
# stands in for an unknown raw rank and for content no lookup could resolve.
JUDGEMENT_CSV_BLANK_SCORE_CELL = ''
# Separator between the tags of one set. A pipe rather than a comma so a cell survives the CSV
# without quoting games, and rather than a semicolon, which occurs inside tag names.
JUDGEMENT_CSV_TAG_SEPARATOR = ' | '

# Score-band summary CSV and its console table.
SCORE_BAND_TABLE_TITLE = 'Verdict share by score band (unexpected_retrieved only)'
SCORE_BAND_CSV_SCORE_COLUMN_HEADER = 'score_column'
SCORE_BAND_CSV_BAND_START_HEADER = 'band_start'
SCORE_BAND_CSV_BAND_END_HEADER = 'band_end'
SCORE_BAND_CSV_COUNT_HEADER = 'count'

# Progress log messages.
LOG_WROTE_JUDGEMENT_CACHE = 'Wrote {count} relevance judgements to {path}'
LOG_SUBMITTED_BATCH = 'Submitted judgement batch {name} to {model}'
LOG_BUILT_JUDGEMENT_ITEMS = 'Built {count} judgement items from {directory}'
LOG_JUDGEMENT_ITEMS_CACHED = '{cached} of {total} pairs already judged; {pending} left to judge'
# --judge-limit truncates the pair set. Logged loudly because a silently truncated judgement set
# reads as full coverage in the Mission 5 statistics.
LOG_JUDGE_LIMIT_APPLIED = (
    '--judge-limit {limit} applied: judging {judged} pairs, SKIPPING {skipped} of {total}. '
    'Statistics from this run cover part of the dataset only.'
)
LOG_NOTHING_LEFT_TO_JUDGE = 'Every pair is already judged; no batch submitted'
LOG_CHUNKED_JUDGEMENT_ITEMS = 'Grouped {items} pairs into {chunks} chunks of at most {size}'
LOG_UNJUDGED_CHUNK = 'Chunk {key} produced no verdicts ({count} pairs): {reason}'
LOG_UNJUDGED_CHUNK_TOTAL = '{chunks} of {total_chunks} chunks were unjudged ({pairs} pairs)'
LOG_WROTE_RELEVANCE_CSV = 'Wrote {count} judged pairs to {path}'
LOG_WROTE_SCORE_BAND_CSV = 'Wrote {count} score bands to {path}'

# Reasons a chunk yielded no verdict, formatted into LOG_UNJUDGED_CHUNK.
UNJUDGED_REASON_FINISH_REASON = 'finishReason {finish_reason}'
UNJUDGED_REASON_PROMPT_BLOCKED = 'prompt blocked, blockReason {block_reason}'
UNJUDGED_REASON_REQUEST_ERROR = 'request error {error}'
UNJUDGED_REASON_NO_RESPONSE = 'result line carried neither a response nor an error'

# Errors (raised at the orchestrator boundary, except the missing-key one, which is raised by the
# judge client accessor the first time a run actually needs the API).
ERROR_MISSING_GEMINI_JUDGE_API_KEY = '--judge was requested but GEMINI_JUDGE_API_KEY is not set'
ERROR_BATCH_JOB_NOT_SUCCEEDED = 'Judgement batch {name} ended in state {state}: {error}'
ERROR_BATCH_POLL_TIMED_OUT = (
    'Judgement batch {name} was still {state} after {seconds:.0f}s. Batch jobs expire at 48h.'
)
ERROR_BATCH_HAS_NO_RESULT_FILE = 'Judgement batch {name} succeeded but produced no result file'
ERROR_JUDGE_INPUT_FILE_MISSING = (
    'Frozen judging input {path} is missing. Mission 4 judges a frozen file snapshot, not '
    'results/: copy the verified run into {directory} before judging.'
)
# Raised by the completeness assertion. On a lite-tier model, id omission and id drift on long
# chunks are the EXPECTED failure, so the message names the first fix rather than leaving the
# reader to guess at it.
ERROR_CHUNK_KEYS_MISSING = (
    'The judgement batch did not return {count} of {total} submitted chunk keys: {keys}. '
    'Halve JUDGEMENT_CHUNK_SIZE (currently {chunk_size}) and re-run.'
)
ERROR_CHUNK_ITEM_IDS_MISMATCH = (
    'Chunk {key} returned verdicts for ids {returned} but was asked about {expected}. '
    'Halve JUDGEMENT_CHUNK_SIZE (currently {chunk_size}) and re-run.'
)
ERROR_CHUNK_UNKNOWN_KEY = 'The judgement batch returned an unknown chunk key {key}'
ERROR_CHUNK_KEY_DUPLICATED = 'The judgement batch returned chunk key {key} more than once'
# Raised at the parse boundary. A marker outside the enum is a parse failure, never a "not sure".
ERROR_UNKNOWN_VERDICT_MARKER = (
    'Chunk {key} answered id {item_id} with marker {marker!r}, which is not one of {markers}'
)
ERROR_RELEVANCE_ROW_COUNT = (
    'Relevance CSV would hold {rows} rows for {judged} judged pairs'
)
ERROR_RELEVANCE_ROW_INCOMPLETE = (
    'Relevance row {row} has an identity without a verdict or a verdict without an identity'
)
