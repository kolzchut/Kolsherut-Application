# Retrieval Evaluation

Offline evaluation of the hybrid **retrieval** service (`retrieval/`) against a ground truth
**scraped from the live staging site**. It runs a labelled set of Hebrew queries through retrieval and
reports how well its ranking reproduces the services the real site shows. Designed to be run locally
and later wired into CI.

## What & why

- The golden set labels each query with the **kolsherut.org.il URL** a curator landed on. That URL is
  a complete search state, so "the correct answer" is the set of services the site renders there.
- Rather than reimplement the frontend's search and filtering in Python, we **render that URL** on
  `https://staging.kolsherut.org.il/` in a headless browser and read the service names off the page.
  The ground truth is literally what a human sees.
- The **retrieval service is scored** on the same query given only as free text: does its ranked
  result list surface those same services, and how high up?
- Matching is by **service name**. Both sides render the same `srm__cards` `service_name` field, and
  both already collapse by name — the FE renders name-collapsed cards, and retrieval's `services[]`
  is name-deduped by `order_services_by_ranking`. Names are normalized (Unicode NFC + collapsed
  whitespace) on both sides before comparison.

**The BE is not a dependency.** Only the retrieval service and network access to staging are needed.

## Data flow

```
data/Raw-Golden-Set.csv
        │  (col 1: Hebrew query,  col 2: kolsherut.org.il URL)
        │
        ├─ once ────► swap host to staging ─► headless Chromium ─► data/golden-set-ground-truth.json
        │                                                                  │
        └─ query ───► retrieval POST /api/retrieve {query} ─► ranked service names
                                        │
                          ranked names vs scraped names  ──►  per-query metrics @k
                                        │
                          aggregate (mean over queries) ──► metrics×k + overall_score
                                        │
                          results/summary.json ─► console table + HTML dashboard
```

## How ground truth is scraped

Each golden-set URL keeps its path and query verbatim; only the host is swapped for
`STAGING_BASE_URL`. Then, per page:

1. **Clear cookies, then navigate.** Staging sits behind Cloudflare, which issues a cookie on the
   first response and then answers `403` to every later request presenting it from an automated
   browser. Starting each page cookie-less keeps every navigation a first visit.
2. **Confirm it is a results page** — `div[class^="resultsContainer"]` must mount. Card pages
   (`/p/card/c/…`) and homepage fallbacks never mount it and are skipped.
3. **Wait for both `/search` calls to answer.** The FE fires `isFast:true` and `isFast:false`
   concurrently and renders the fast, *partial* set first, so waiting on the DOM alone captures an
   incomplete answer. Staging also serves pre-rendered SSG snapshots that can show *stale* cards
   before hydration. Gating on the network covers both.
4. **Wait for the DOM to settle** — no `[class^="loader-"]`, and either results or the empty state.
5. **Read `h2[class^="bannerTitle"]`** — the service-name heading (`FE/src/components/cardBanner/`),
   one per service. The FE concatenates the two `/search` responses without deduping, so names
   repeat; they are normalized and deduped here.

All services render at once — there is no lazy loading or virtualization, so no scrolling is needed.
Only the organizations *inside* a card are truncated, which does not affect service names.

Two selector notes: the app uses **react-jss without minification**, so class names look like
`bannerTitle-0-1-89` with a load-order-dependent counter — always match on the prefix. And the user
agent must stay a plain desktop Chrome string: Cloudflare `403`s the default `HeadlessChrome`, while
staging's nginx routes `curl`/`wget`/`python-requests` agents to a different SSR pipeline.

**Unsupported rows.** Two of the 65 rows render no results page — the card URL `/p/card/c/35e9b749`
(its name lives in `h1`, not a card banner) and `/internal_emergency_services` (whose path segment is
absent from the taxonomy, so the FE falls back to the homepage). They are counted as
`skipped_unsupported` and carry a `skip_reason` in the per-query outputs.

Queries whose ground truth is empty are **excluded** from the metric averages and reported separately
(they would otherwise divide by zero and bias the numbers).

## Ground-truth cache

Scraping 63 pages takes a few minutes, so the result is persisted to
`data/golden-set-ground-truth.json` and reused. The file stores a SHA-256 of `Raw-Golden-Set.csv` and
the base URL it was scraped from, so editing the golden set or switching hosts triggers an automatic
re-scrape.

**Staging data can change without the CSV changing**, and nothing detects that — `--rescrape` is the
only way to refresh. Re-scrape whenever the underlying service data has moved.

The cache is committed: it is the reproducible dataset, and it lets a clean checkout run without
touching staging at all. A `--limit`ed run never overwrites it with a partial scrape.

## Metrics

All metrics are computed at each cutoff **k ∈ {3, 5, 10, 25, 50}** — the number of top-ranked
retrieval results considered. `hits@k` = how many of the top-k retrieved services are in the ground
truth; `|G|` = ground-truth size. Every metric is in `[0, 1]`; higher is better.

| Metric | What it answers | Formula (per query) |
| --- | --- | --- |
| **Precision@k** | Of the k results shown, what fraction are relevant? | `hits@k / k` |
| **Recall@k** | Of all relevant services, what fraction did we surface in the top k? | `hits@k / |G|` |
| **F1@k** | Balance of precision and recall. | `2·P·R / (P+R)` |
| **MRR@k** | How high is the *first* relevant result? (Mean Reciprocal Rank) | `1 / rank_of_first_hit` (0 if none in top k) |
| **Hit-Rate@k** | Did *any* relevant result appear in the top k? (a.k.a. Success@k) | `1 if hits@k > 0 else 0` |
| **nDCG@k** | Ranking quality, rewarding relevant results placed higher. | `DCG / IDCG`, `DCG = Σ hit_i / log₂(i+1)` |
| **MAP@k** | Precision averaged over each relevant position (Mean Average Precision). | `Σ_i [hit_i · P@i] / min(|G|, k)` |

Reported values are the **mean over evaluated queries**. Precision, Hit-Rate and MRR care about the
top of the list; Recall cares about coverage; nDCG and MAP are rank-aware quality scores.

### Set-level metrics (over the returned list)

Every metric above divides by a fixed `k`, which makes them **blind to truncation**: dropping a
non-hit off the tail leaves `hits@k / k` unchanged, and recall, MRR, nDCG and MAP can only stay flat
or fall. All of them are monotonically non-increasing as documents are removed, so tuning a retrieval
score threshold against them would always conclude that returning everything is optimal.

The set-level metrics divide by `|R|`, the length of the list retrieval **actually returned**:

| Metric | Formula (per query) |
| --- | --- |
| **Precision@returned** | `hits / |R|` |
| **Recall@returned** (aka **Recall ALL**) | `hits / |G|` |
| **F1@returned** | `2·P·R / (P+R)` |

Cutting a non-hit shrinks precision's denominator while the numerator holds, so precision rises;
recall only falls when a real hit is cut. **F1@returned therefore has an interior maximum over the
threshold** — it is the number to optimise when tuning `MIN_SEMANTIC_SCORE` / `SEMANTIC_SCORE_RATIO`
in the retrieval service.

Averaged over queries with a non-empty ground truth, same as the fixed-k metrics.

### Count parity

How closely our returned count tracks the incumbent site's. Counts are log-skewed — over the 63
scored golden-set queries the ground truth runs min 0, median 8, mean 18.7, Q3 20, max 230 — so
medians and geometric means lead, and every ratio is smoothed by `+1` (`COUNT_RATIO_SMOOTHING`) to
stay finite when either side is 0.

With `r` = returned count and `g` = ground-truth count:

| Statistic | Meaning |
| --- | --- |
| **count_parity** (per query) | `min(r+1, g+1) / max(r+1, g+1)` — symmetric, scale-free, in `[0, 1]`, `1.0` is exact parity. Penalises over- and under-returning equally. Its mean is the single number to watch. |
| **geometric_mean_count_ratio** | `exp(mean(log((r+1)/(g+1))))` — direction: `< 1` we under-return, `> 1` we over-return. Geometric so the one 230-result query cannot dominate. |
| `median_returned_count` / `median_ground_truth_count` / `ratio_of_median_counts` | Plain-English diagnostics. |
| `median_absolute_count_error` | Robust average miss, in services. |

Computed over **all non-skipped** queries, including the empty-ground-truth ones — "the site returned
nothing, so should we" is exactly a count-parity signal. Those queries are excluded from the
set-level metrics above, where recall would be `0/0`.

### Overall score

A single headline number in `[0, 1]`: the **weighted mean of every metric across every k** (7 metrics
× 5 cutoffs = 35 cells, equal weight by default). Adjust `SCORE_WEIGHTS` in `vars.py` to up/down-weight
or drop a metric. This is the default CI gate.

The set-level metrics and count statistics are deliberately **excluded** from it — they have no `k`,
and `compute_overall_score` averages whatever keys it finds in each per-k dict, so folding them in
would silently change what the score means and break comparison with past runs. They live in sibling
`set_metrics` / `count_stats` blocks in `summary.json`.

## Running

Prerequisites: the **retrieval** service (`:8200`) is running, the **be** service (`BACKEND_BASE_URL`,
default `:5000`) is running, and staging is reachable. All three should point at the **same**
underlying `srm__cards` data — otherwise names diverge for reasons unrelated to ranking.

`be` is used for exactly one thing: looking a service's description and tags up by name, for the
golden-set services retrieval never returned. Those have no content on any retrieval response, so
without it their content columns come out blank. Answers are cached in
`data/service-details-cache.json` and committed, so a repeat run makes no backend calls at all.

```bash
cd evaluation
python -m venv venv
venv/Scripts/pip install -r requirements.txt          # Windows; use venv/bin on *nix
venv/Scripts/python -m playwright install chromium    # one-time browser download
cp .env.example .env                                  # adjust URLs if not on defaults

# from the repo root:
python -m evaluation.run_evaluation                   # full run (all queries)
python -m evaluation.run_evaluation --limit 5         # quick smoke run
python -m evaluation.run_evaluation --rescrape        # refresh the scraped ground truth first

python -m evaluation.freeze_judge_input               # freeze results/ as the judging snapshot

# LLM relevance judging - OPT-IN, costs money, needs GEMINI_JUDGE_API_KEY in .env:
python -m evaluation.run_evaluation --judge                  # judge the whole frozen snapshot
python -m evaluation.run_evaluation --judge --judge-limit 200  # judge the first 200 pairs only

# Human audit of the judge - free, offline, no credential. Neither flag evaluates anything:
python -m evaluation.run_evaluation --review-sample       # emit a 200-row review sheet
python -m evaluation.run_evaluation --review-sample 400   # ...or N rows
python -m evaluation.run_evaluation --agreement           # read the filled-in sheet back
```

Without `--judge` the run is **free, offline and reproducible** — no API key is read and no LLM is
called. `--judge-limit` logs exactly how many pairs it skipped, because a truncated judgement set
otherwise reads as full coverage downstream.

Set `EVAL_BROWSER_HEADLESS=false` to watch the scraper drive a visible browser — useful when a
selector stops matching after an FE change.

Outputs land in `evaluation/results/`, which is **gitignored** — every file below is a run
artifact reproduced by the next run, never committed data:
- `summary.json` — full metrics, meta and per-query data.
- `per_query.csv` — one row per query (ground-truth size, returned count, missed and unexpected
  counts, set-level metrics, hits@k) for spotting weak queries and count mismatches.
- `service_diff.csv` — **which** services fell where, one row per query × service:
  `query, side, rank, service_name`. `side` is `missed_ground_truth` (the site shows it, retrieval
  never returned it — a recall failure), `unexpected_retrieved` (retrieval returned it, the site
  does not show it) or `mutual_retrieved` (both — a true positive). The three partition
  *returned ∪ golden set* with nothing dropped and nothing counted twice. `rank` is the name's
  1-based position on its own side, so a low rank on the unexpected side is a high-confidence false
  positive. Filter or pivot this to see *what* is wrong, not just how much.
- `unexpected_retrieved.json` — the `unexpected_retrieved` side of that diff with **retrieval's
  scores attached**, for feeding a relevance judge that has to decide whether a "false positive"
  really is one. Per query: `query, ground_truth_size, returned_count, count, services` (plus
  `skip_reason` when the query was skipped). Each element of `services` is an object —
  `rank, raw_rank, service_name, service_description, response_ids, response_names, situation_ids,
  situation_names, retrieval_score, cosine_score, cosine_score_ratio, lexical_score,
  semantic_score` — so the scores and the content travel with the name instead of needing a join.
  `raw_rank` is the service's position in retrieval's **whole** returned list, which is not `rank`:
  `rank` renumbers from 1 within each side, so it closes the gaps the other sides leave. A `null` score
  means that retriever never surfaced a document for the service, which is **not** the same as
  scoring it zero. Written with `ensure_ascii=False`, so Hebrew stays readable. Skipped queries
  carry `count: null` and `services: []` rather than a misleading zero.
- `missed_ground_truth.json` — the `missed_ground_truth` side, same schema and same
  `(query, side, rank)` join to `service_diff.csv`, for judging whether a recall "failure" was a
  service worth returning at all. All five score fields and `raw_rank` are **always `null`** here:
  retrieval never returned these services, so no retriever ever scored them and they have no
  position in a list they are not in. Blank is the honest value — a zero would claim the embedder
  scored them maximally dissimilar, which is a different statement. The keys are emitted anyway so
  all three files share one schema and one stable column set. The **content** fields are the
  exception: they are filled in from the `be` name lookup, and are `null` only for a name that
  lookup could not resolve exactly.
- `mutual_retrieved.json` — the `mutual_retrieved` side: what retrieval returned *and* the site
  shows. Same schema again, fully scored. This is the file that makes `raw_rank` readable — the
  unexpected side alone renumbers over the positions these rows occupy, so only the two together
  reconstruct retrieval's actual ordering.
- `report.html` — the dashboard with data inlined; **open directly** (double-click).
- `relevance_judgements.csv` — `--judge` only. Every judged pair, across **all three** sides, with
  its raw rank, its content and its scores next to its verdict:
  `query, side, rank, service_name, raw_rank, service_description, response_ids, response_names,
  situation_ids, situation_names, retrieval_score, cosine_score, cosine_score_ratio, lexical_score,
  semantic_score, verdict, model, judged_at`. The first four columns are `service_diff.csv`'s,
  so the two join on `(query, side, rank)`; `raw_rank` sits *after* that block rather than inside
  it, because the identity block is asserted complete on every row and `raw_rank` is blank on the
  missed side. **Sort a query by `raw_rank` to read retrieval's actual ranking** with the true
  positives interleaved. Tag sets are pipe-joined into one cell, as ids and names both. Score cells
  are **blank, never `0.0`**, whenever no retriever produced that score — always on the
  `missed_ground_truth` side, and on the `unexpected_retrieved` side wherever BM25 never surfaced
  the document.
- `relevance_by_score_band.csv` — `--judge` only. The verdict share per ~0.05 score band over the
  `unexpected_retrieved` side, once by `cosine_score` and once by `cosine_score_ratio`. The ratio table
  is the threshold-selection evidence: `SEMANTIC_SCORE_RATIO` is what actually cuts on it. Also printed
  to the console.
- `human_review_sample.csv` — `--review-sample` only. The sheet a **human** fills in: exactly
  `review_id, query, side, rank, service_name, human_verdict, human_notes`, the last two blank. See
  the section below for what is deliberately *not* in it.
- `agreement_report.json` — `--agreement` only. `sample_size`, `reviewed_count`, `raw_agreement`,
  `cohens_kappa`, `confusion_by_side`, `agreement_by_verdict`, `disagreement_rows`, plus the
  `gate` verdict, the `sample_strata` counts, the judge model and the sample seed.

### The human audit of the judge

The judge's verdicts are only worth using if a person agrees with them, so `--review-sample` /
`--agreement` measure that. Both flags read the frozen snapshot and the committed label cache and
**nothing else** — no credential, no retrieval call, no scrape — so a run that passes either one
**does no evaluation and writes no other artifact**. Judge first: with no labels, `--review-sample`
raises rather than emitting an empty sheet.

The sheet **withholds the LLM's `verdict` and all five score columns**, and the rows are
shuffled. That is the whole point: shown the judge's answer, or a cosine of 0.85, a reviewer anchors
on it and the agreement number stops measuring agreement. A header assertion enforces it.

The draw is **stratified by `side` × `verdict`** with a floor per non-empty cell before a proportional
split, so rare cells survive — `unclear` is ~2% of the pairs and would otherwise get a couple of rows
or none. It is seeded from `REVIEW_SAMPLE_SEED`, so the same N always yields the same rows and two
reviewers can be handed identical sheets. `--agreement` **redraws** the sample from that seed to
recover what the judge said, and refuses the sheet if any identity column disagrees with the redraw.

Fill in `human_verdict` with `relevant`, `irrelevant` or `unclear`; `human_notes` is free text. Only
those two columns may be edited — **do not add, remove or reorder rows**. A **partly filled sheet is
fine**: a blank verdict is never counted as a verdict, and `reviewed_count` is reported separately
from `sample_size`.

The gate is `raw_agreement ≥ 0.85` **and** `cohens_kappa ≥ 0.60`, and **both numbers are always
reported**: with a skewed verdict distribution raw agreement can read 0.93 while κ sits near zero,
which means the judge is guessing the majority class. A failed gate is **reported, never acted on** —
the run still exits 0. The response is a decision: revise the judge prompt only, re-judge (the cache
invalidates on a prompt change), re-sample. An undefined κ (nothing reviewed, or both raters used one
class) is written as `null` and does **not** pass.

### The frozen judging snapshot

`--judge` reads `evaluation/results-judge-frozen/`, **not** `results/`. That is deliberate: a retrieval
configuration does not identify the dataset. Elasticsearch's approximate kNN resolves pool-boundary
near-ties differently between byte-identical calls, so re-running never reproduces the same pair set, and
any concurrent run overwrites `results/`. The frozen directory holds the three diff JSON files plus
`judge_input_manifest.json`, which records their SHA-256 hashes, the pair and chunk counts, the headline
score and the retrieval config the run used.

Refreeze with `python -m evaluation.freeze_judge_input`, which copies the three files across and
regenerates the manifest from the **copies** it just wrote. It **overwrites the previous freeze**, which
is the only record of what the committed labels were judged against — copy that directory aside first if
those labels still matter. Two manifest fields cannot be observed from `results/` and are carried over
from `relevance_input_vars.py` instead: `scrape_date` and `retrieval_config`. Update those constants
whenever the arm changes, or the manifest will confidently describe the wrong configuration. `results*/` is gitignored, so the snapshot stays local — the
committed artifact is `data/relevance-judgements.json`, the labels plus those two input hashes. Paths live
in `relevance_input_vars.py` and are intentionally not env-overridable.

Names live in their own file because the two sides are lopsided: median ground truth is 8 services,
median returned count is ~283, so an unexpected-name list per row would be unreadable.

The **dashboard** shows the overall score, the metric×k matrix (heat-colored), the set-level metrics
and count-parity tables, metric curves across k, and a sortable per-query drill-down whose
`missed GT` / `unexpected` cells expand from a count to the full name list. Open `results/report.html`
directly, or serve the live version:

```bash
cd evaluation && python -m http.server        # then open http://localhost:8000/dashboard/dashboard.html
```

## CI usage

`run_evaluation.py` exits non-zero when a configured threshold is unmet, so it can gate a pipeline.
Thresholds live in `vars.py` (empty by default = report-only, exit 0):

- `MIN_OVERALL_SCORE` — minimum acceptable overall score.
- `PER_METRIC_THRESHOLDS` — e.g. `{"mrr@10": 0.30, "recall@50": 0.60}` (key format `metric@k`).

## Layout

```
run_evaluation.py     entry point: load → scrape/cache → evaluate → aggregate → report → exit code
evaluate_dataset.py   per-query loop scoring retrieval against the scraped names
vars.py / strings.py  all config (URLs, k values, metric keys) / all text
scraper_vars.py       browser + FE-selector config, split out of vars.py
relevance_vars.py     judge model, chunk size, verdicts, batch + cache config
relevance_strings.py  judge CLI help, judgement CSV headers, judge log lines and errors
relevance_prompt_strings.py  the judge system prompt, alone - editing it invalidates the cache
relevance_input_vars.py   the FROZEN judging snapshot: input paths, manifest keys, recorded arm
relevance_report_vars.py  score-band width and the band-table column keys
human_review_vars.py  review-sheet + agreement-report paths, keys and the gate's two thresholds
human_review_strings.py   review-sheet headers, human-audit CLI help, gate outcomes, log lines
human_review_schemas.py   ReviewSampleRow, HumanVerdict, AlignedVerdict dataclasses
schemas.py            Example, ScrapedPage, QueryEvaluation, JudgementItem, JudgementChunk,
                      ServiceJudgement dataclasses
data/                 raw golden set + the scraped ground-truth cache
dataset/              raw CSV → Example, and the production → staging URL swap
scraper/              browser session, readiness waits, name extraction, name normalization
ground_truth/         scrape-all loop + the ground-truth cache
clients/              retrieval HTTP client + the Gemini judge Batch API client
relevance/            LLM relevance judging: items, chunks, request, parsing, cache, orchestrator
human_review/         the human audit: stratified sample, sheet read-back, verdict alignment, gate
metrics/              one metric per file + per-query evaluation + aggregation
report/               overall score, table rendering, JSON/CSV/HTML output, threshold gate
dashboard/            self-contained HTML dashboard (data inlined into results/report.html)
results/              generated outputs (gitignored)
results-judge-frozen/ the frozen pair snapshot --judge reads, plus its hash manifest (gitignored)
```

### A note on `@50`

Each retriever returns `CANDIDATE_POOL_SIZE` candidates (`retrieval/app/vars.py`), but fusion
**unions** the two lists, so up to `2 × CANDIDATE_POOL_SIZE` distinct services can survive; the cards
join and the unique-name collapse then shrink it again. So `@50` is *usually* close to "everything
retrieval returned" at the default pool of 50, but it is not guaranteed — and once the pool is
deepened it truncates for real. Read `precision_at_returned` / `recall_at_returned` when you need
"everything returned" with certainty, and `returned_count` in `per_query.csv` for the actual length.
