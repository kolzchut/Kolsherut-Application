from evaluation import vars

# The FROZEN judging inputs, and their provenance. Split out of relevance_vars.py, which is at its
# line budget; this file has one job - to say exactly which bytes Mission 4 judges.
#
# Why a frozen directory instead of RESULTS_DIR: a retrieval configuration does NOT identify the
# dataset. Three different arms landed in results/ within minutes of each other while retrieval/.env
# was edited twice inside 11 minutes, and separately six byte-identical POST /api/retrieve calls
# returned two distinct document sets - Elasticsearch's approximate kNN resolving near-ties at the
# CANDIDATE_POOL_SIZE=50 pool boundary. So re-running never reproduces the same pair set, and only
# the file CONTENT identifies what was judged. Deliberately not env-overridable: an override would
# reintroduce exactly the ambiguity the freeze exists to remove.
JUDGE_INPUT_DIR = vars.EVALUATION_ROOT / 'results-judge-frozen'
JUDGE_INPUT_UNEXPECTED_JSON_PATH = JUDGE_INPUT_DIR / vars.UNEXPECTED_RETRIEVED_JSON_PATH.name
JUDGE_INPUT_MISSED_JSON_PATH = JUDGE_INPUT_DIR / vars.MISSED_GROUND_TRUTH_JSON_PATH.name
JUDGE_INPUT_MANIFEST_PATH = JUDGE_INPUT_DIR / 'judge_input_manifest.json'

# Manifest keys. The two content hashes are the real dataset identity; the config and scrape date
# are recorded next to them as context, never as the identifier.
MANIFEST_INPUT_HASHES_KEY = 'input_sha256'
MANIFEST_PAIR_COUNTS_KEY = 'pair_counts'
MANIFEST_TOTAL_PAIRS_KEY = 'total_pairs'
MANIFEST_CHUNK_COUNT_KEY = 'chunk_count'
MANIFEST_OVERALL_SCORE_KEY = 'overall_score'
MANIFEST_RETRIEVAL_CONFIG_KEY = 'retrieval_config'
MANIFEST_SCRAPE_DATE_KEY = 'scrape_date'
MANIFEST_SOURCE_RUN_KEY = 'source_run'

# The run these files came from, and the arm that produced them. Re-frozen on the V4 gemini arm per the
# judging spec's 14.8.2 decision; the superseded 0.3025 snapshot is kept whole, manifest included, at
# results-judge-frozen-arm0-0.3025/. Read out of the arm's own result directory rather than from
# retrieval/.env, which has since moved on - see the spec's 14.4 and 14.4.3.
JUDGE_INPUT_SOURCE_RUN = 'results-arm4-v4-gemini (2026-07-29 17:10)'
JUDGE_INPUT_OVERALL_SCORE = 0.36935235358267293
JUDGE_INPUT_SCRAPE_DATE = '2026-07-29'

# The retrieval configuration behind that arm, RECONSTRUCTED FROM EVIDENCE, because no result file
# records it: summary.json's meta block carries query counts only. Every value below is either derived
# from the arm's own per-document service_scores or named for this arm in docs/embedding-v4-gemini-spec.md
# 14.4. What neither source establishes is None - never carried forward from the previous arm.
#   - provider and index: 8's arm table maps results-arm4-v4-gemini to gemini plus the v4 index, and the
#     arm's cosines (0.607-0.823) sit in the gemini band, disjoint from the local arm's (0.794-0.893).
#   - weights and RRF constant: all 1,362 returned documents score exactly 1/(60+rank), including the 371
#     that BM25 also surfaced - so BM25 contributed nothing to fusion.
#   - MIN_FUSED_SCORE: the observed fused minimum is exactly 0.01 and ranks stop at 40 = 1/0.01 - 60,
#     while the no-cut sibling arm reaches rank 50.
#   - CANDIDATE_POOL_SIZE: named in 14.4, and confirmed by that sibling arm's rank-50 kNN depth.
#   - MIN_SEMANTIC_SCORE / MAX_RETURNED_SERVICES: named in 14.4's Pair 1 heading, but NEITHER one binds
#     here - the lowest returned cosine is 0.607 and the longest result is 39 services.
#   - SEMANTIC_SCORE_RATIO: not named for this arm anywhere. The data only bounds it at <= 0.865, the
#     lowest returned cosine ratio, so the exact value is unestablished.
#   - KEEP_LEXICAL_ONLY_DOCUMENTS: unobservable. It only exempts cosine-less documents from the two
#     semantic floors, and MIN_FUSED_SCORE deletes every one of them first - they fuse to exactly 0.0.
JUDGE_INPUT_RETRIEVAL_CONFIG = {
    'EMBEDDING_PROVIDER': 'gemini',
    'RETRIEVAL_EMBEDDINGS_INDEX_NAME': 'srm__services_retrieval_embeddings_v4_gemini',
    'CANDIDATE_POOL_SIZE': 50,
    'RRF_RANK_CONSTANT': 60,
    'LEXICAL_WEIGHT': 0.0,
    'SEMANTIC_WEIGHT': 1.0,
    'MIN_FUSED_SCORE': 0.01,
    'MIN_SEMANTIC_SCORE': 0.3,
    'MAX_RETURNED_SERVICES': 400,
    'SEMANTIC_SCORE_RATIO': None,
    'KEEP_LEXICAL_ONLY_DOCUMENTS': None,
}
