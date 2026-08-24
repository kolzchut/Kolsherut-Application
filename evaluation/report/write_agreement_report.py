import json

from evaluation import human_review_vars, relevance_vars, vars


def build_agreement_report_payload(statistics: dict, gate: dict,
                                   strata: dict[str, dict[str, int]]) -> dict:
    """The report as it lands on disk: the statistics, the gate, and the provenance of both.

    The judge model and the sample seed are recorded because an agreement number is a statement about
    one model's verdicts drawn one particular way. Swapping the model invalidates the label cache and
    therefore this report; changing the seed changes which rows a human looked at. Neither is
    recoverable from the numbers themselves, so both are written next to them.
    """
    return {
        **statistics,
        human_review_vars.GATE_KEY: gate,
        human_review_vars.SAMPLE_STRATA_KEY: strata,
        human_review_vars.JUDGE_MODEL_KEY: relevance_vars.JUDGE_MODEL,
        human_review_vars.REVIEW_SAMPLE_SEED_KEY: relevance_vars.REVIEW_SAMPLE_SEED,
    }


def write_agreement_report(statistics: dict, gate: dict,
                           strata: dict[str, dict[str, int]]) -> dict:
    """Mission 6's deliverable back in. Returns the payload it wrote, so the caller can report the
    gate without re-reading the file."""
    payload = build_agreement_report_payload(statistics, gate, strata)
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    human_review_vars.AGREEMENT_REPORT_JSON_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    return payload
