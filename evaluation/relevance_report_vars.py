from evaluation import vars

# Config for the two relevance report artifacts - the judgement table and the score-band summary.
# Split out of relevance_vars.py, which is at its line budget.

RELEVANCE_BY_SCORE_BAND_CSV_PATH = vars.RESULTS_DIR / 'relevance_by_score_band.csv'

# Band width for the verdict-by-score cross-tab. 0.05 over a cosine that spans roughly 0.3-1.0
# gives ~14 populated bands - coarse enough that each holds a readable count, fine enough to show
# where the relevant share falls off. The band's label is its lower edge.
SCORE_BAND_WIDTH = 0.05

# The two score columns the band tables bucket on. cosine_score is the raw similarity;
# cosine_score_ratio is a fraction of the pool's best cosine and is what SEMANTIC_SCORE_RATIO
# actually cuts on, which makes the ratio table the threshold-selection evidence.
SCORE_BAND_COLUMNS = [vars.SERVICE_SCORE_COSINE_KEY, vars.SERVICE_SCORE_COSINE_RATIO_KEY]

# Band-table column keys.
BAND_TABLE_SCORE_COLUMN_KEY = 'score_column'
BAND_TABLE_BAND_START_KEY = 'band_start'
BAND_TABLE_BAND_END_KEY = 'band_end'
BAND_TABLE_COUNT_KEY = 'count'
# Per-verdict share keys are built as '<verdict>_share' and counts as '<verdict>_count', so the
# verdict vocabulary in relevance_vars.py stays the single definition of which columns exist.
BAND_TABLE_SHARE_SUFFIX = '_share'
BAND_TABLE_COUNT_SUFFIX = '_count'
