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
| **Recall@returned** | `hits / |G|` |
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

Prerequisites: the **retrieval** service (`:8200`) is running, and staging is reachable. Retrieval
should point at the **same** underlying `srm__cards` data staging serves — otherwise names diverge
for reasons unrelated to ranking.

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
```

Set `EVAL_BROWSER_HEADLESS=false` to watch the scraper drive a visible browser — useful when a
selector stops matching after an FE change.

Outputs land in `evaluation/results/`:
- `summary.json` — full metrics, meta and per-query data.
- `per_query.csv` — one row per query (ground-truth size, returned count, missed and unexpected
  counts, set-level metrics, hits@k) for spotting weak queries and count mismatches.
- `service_diff.csv` — **which** services differ, one row per query × service:
  `query, side, rank, service_name`. `side` is `missed_ground_truth` (the site shows it, retrieval
  never returned it — a recall failure) or `unexpected_retrieved` (retrieval returned it, the site
  does not show it). `rank` is the name's 1-based position on its own side, so a low rank on the
  unexpected side is a high-confidence false positive. Filter or pivot this to see *what* is wrong,
  not just how much.
- `report.html` — the dashboard with data inlined; **open directly** (double-click).

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
schemas.py            Example, ScrapedPage, QueryEvaluation dataclasses
data/                 raw golden set + the scraped ground-truth cache
dataset/              raw CSV → Example, and the production → staging URL swap
scraper/              browser session, readiness waits, name extraction, name normalization
ground_truth/         scrape-all loop + the ground-truth cache
clients/              retrieval HTTP client
metrics/              one metric per file + per-query evaluation + aggregation
report/               overall score, table rendering, JSON/CSV/HTML output, threshold gate
dashboard/            self-contained HTML dashboard (data inlined into results/report.html)
results/              generated outputs (gitignored)
```

### A note on `@50`

Each retriever returns `CANDIDATE_POOL_SIZE` candidates (`retrieval/app/vars.py`), but fusion
**unions** the two lists, so up to `2 × CANDIDATE_POOL_SIZE` distinct services can survive; the cards
join and the unique-name collapse then shrink it again. So `@50` is *usually* close to "everything
retrieval returned" at the default pool of 50, but it is not guaranteed — and once the pool is
deepened it truncates for real. Read `precision_at_returned` / `recall_at_returned` when you need
"everything returned" with certainty, and `returned_count` in `per_query.csv` for the actual length.
