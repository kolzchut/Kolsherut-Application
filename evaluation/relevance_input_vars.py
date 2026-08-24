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
JUDGE_INPUT_MUTUAL_JSON_PATH = JUDGE_INPUT_DIR / vars.MUTUAL_RETRIEVED_JSON_PATH.name
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

# The run these files came from, and the arm that produced them. Re-frozen 2026-08-03 on a fresh run
# of the same V4 gemini arm (2,278 pairs at 0.36924961536524054, superseding the 2026-07-30 freeze's
# 2,011 pairs at 0.36935235358267293). This file and the manifest in results-judge-frozen/ are the only
# record of what the committed labels were judged against. The ground truth was NOT re-scraped for this
# freeze, so the scrape date below is carried over unchanged rather than restamped.
JUDGE_INPUT_SOURCE_RUN = 'results run of 2026-08-03'
JUDGE_INPUT_OVERALL_SCORE = 0.36924961536524054
JUDGE_INPUT_SCRAPE_DATE = '2026-07-29'

# The retrieval configuration behind that arm, READ DIRECTLY OFF retrieval/.env at rerun time. The
# previous freeze had to RECONSTRUCT this from the arm's own service_scores because no result file records
# it, and left as None whatever the evidence could not establish; this rerun was driven from that file, so
# every value below is observed rather than inferred. That settles the two the reconstruction could not:
#   - SEMANTIC_SCORE_RATIO is 0.0, i.e. off. The old snapshot could only bound it at <= 0.865, the lowest
#     returned cosine ratio.
#   - KEEP_LEXICAL_ONLY_DOCUMENTS is false. It was unobservable before: the flag only exempts cosine-less
#     documents from the semantic floors, and MIN_FUSED_SCORE deletes every one of them first.
# Neither semantic floor binds in practice - the lowest returned cosine sits well above MIN_SEMANTIC_SCORE,
# and no result reaches MAX_RETURNED_SERVICES. The key set is deliberately unchanged from the previous
# manifest so the two snapshots stay directly comparable.
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
    'SEMANTIC_SCORE_RATIO': 0.0,
    'KEEP_LEXICAL_ONLY_DOCUMENTS': False,
}
