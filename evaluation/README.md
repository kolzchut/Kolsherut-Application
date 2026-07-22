# Retrieval Evaluation

Offline evaluation of the hybrid **retrieval** service (`retrieval/`) against a ground truth
derived from the **BE** (`be/`). It runs a labelled set of Hebrew queries through both services and
reports how well retrieval's ranking reproduces the services the BE returns for each query's
taxonomy slugs. Designed to be run locally and later wired into CI.

## What & why

- The **BE is treated as the ground truth**. For each query we ask the BE which services match the
  query's Open Eligibility slugs; that set is "the correct answer."
- The **retrieval service is scored** on the same query given only as free text: does its ranked
  result list surface those same services, and how high up?
- Matching is by **`service_id`** — both services return the same service objects (they share the
  `srm__cards` data), so a retrieval result is a "hit" when its `service_id` is in the BE-derived set.

## Data flow

```
data/queries_slugs.csv
        │  (col 1: Hebrew query,  col 2: Open Eligibility slugs)
        ├─────────────► retrieval  POST /api/retrieve {query}      ──► ranked service_ids
        │
        └─ slugs ─────► BE  POST /search {responseId, situationId} ──► ground-truth service_ids
                                        │
                          ranked_ids vs ground_truth  ──►  per-query metrics @k
                                        │
                          aggregate (mean over queries) ──► metrics×k + overall_score
                                        │
                          results/summary.json ─► console table + HTML dashboard
```

## How ground truth is built

Each query maps to **one response slug and one situation slug**. Slugs are bucketed by prefix:
`human_services:*` → BE `responseId`, `human_situations:*` → BE `situationId`. (Some CSV rows carry a
second `human_services:*` slug; that is a dataset artifact — only the first response slug is used.)

The BE `/search` filter path natively ANDs one `responseId` and one `situationId` (wildcard-substring
match, so a slug also matches its taxonomy descendants). We use that result directly as ground truth:

1. Call the BE with the query's response slug + situation slug. To get the complete match set we issue
   both the `isFast:true` (results 0–50) and `isFast:false` (results 50–350) calls and **union** them —
   this works around the BE's offset-50 pagination. Results are cached per slug pair (slugs repeat
   heavily across rows).
2. The returned services' `service_id`s are the ground-truth set.

Queries whose ground truth is empty are **excluded** from the metric averages and reported separately
(they would otherwise divide by zero and bias the numbers).

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

### Overall score

A single headline number in `[0, 1]`: the **weighted mean of every metric across every k** (7 metrics
× 5 cutoffs = 35 cells, equal weight by default). Adjust `SCORE_WEIGHTS` in `vars.py` to up/down-weight
or drop a metric. This is the default CI gate.

## Running

Prerequisites: the **retrieval** service (`:8200`) and **BE** (`:5000`) are running and pointed at the
**same** underlying `srm__cards` / `srm_services` data (otherwise ground truth diverges for reasons
unrelated to ranking).

```bash
cd evaluation
python -m venv venv
venv/Scripts/pip install -r requirements.txt          # Windows; use venv/bin on *nix
cp .env.example .env                                  # adjust URLs if not on localhost

# from the repo root:
python -m evaluation.run_evaluation                   # full run (all queries)
python -m evaluation.run_evaluation --limit 5         # quick smoke run
```

Outputs land in `evaluation/results/`:
- `summary.json` — full metrics, meta and per-query data.
- `per_query.csv` — one row per query (ground-truth size + hits@k) for spotting weak queries.
- `report.html` — the dashboard with data inlined; **open directly** (double-click).

The **dashboard** shows the overall score, the metric×k matrix (heat-colored), metric curves across k,
and a sortable per-query drill-down. Open `results/report.html` directly, or serve the live version:

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
run_evaluation.py     entry point: load → evaluate → aggregate → report → exit code
evaluate_dataset.py   per-query loop (retrieval + BE ground truth), shared BE cache
vars.py / strings.py  all config / all text
schemas.py            Example, QueryEvaluation dataclasses
data/                 the dataset CSV
dataset/              CSV loading + slug parsing
clients/              retrieval + BE HTTP clients, ground-truth builder, slug matching
metrics/              one metric per file + per-query evaluation + aggregation
report/               overall score, table rendering, JSON/CSV/HTML output, threshold gate
dashboard/            self-contained HTML dashboard (data inlined into results/report.html)
results/              generated outputs (gitignored)
```
