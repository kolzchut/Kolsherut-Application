from evaluation import human_review_vars, relevance_strings, relevance_vars
from evaluation.human_review_schemas import AlignedVerdict
from evaluation.metrics.build_confusion_by_side import build_confusion_by_side
from evaluation.metrics.cohens_kappa import compute_cohens_kappa, compute_observed_agreement


def compute_raw_agreement(aligned: list[AlignedVerdict]) -> float:
    """The share of REVIEWED rows where the human said what the judge said.

    Over reviewed rows only, never over the sheet: an unanswered row is not agreement and it is not
    disagreement, so it belongs in neither the numerator nor the denominator. 0.0 on an empty review
    is a count of nothing, which is why it is always reported next to reviewed_count.
    """
    if not aligned:
        return 0.0
    return compute_observed_agreement([row.human_verdict for row in aligned],
                                      [row.llm_verdict for row in aligned])


def build_verdict_agreement_entry(rows: list[AlignedVerdict]) -> dict:
    matched = sum(1 for row in rows if row.human_verdict == row.llm_verdict)
    return {
        human_review_vars.AGREEMENT_MATCHED_KEY: matched,
        human_review_vars.AGREEMENT_TOTAL_KEY: len(rows),
        human_review_vars.AGREEMENT_RATE_KEY: matched / len(rows) if rows else 0.0,
    }


def build_agreement_by_verdict(aligned: list[AlignedVerdict]) -> dict[str, dict]:
    """Per-LLM-verdict accuracy: when the judge said X, how often did the human agree?

    Keyed on the LLM's verdict rather than the human's, because the question this answers is which of
    the judge's own answers can be trusted - reliable on `relevant` but not on `irrelevant` is a usable
    judge for some purposes and unusable for others, and one pooled number cannot say which.
    """
    return {
        verdict: build_verdict_agreement_entry(
            [row for row in aligned if row.llm_verdict == verdict])
        for verdict in relevance_vars.VERDICTS
    }


def build_disagreement_row(row: AlignedVerdict) -> dict:
    """One disagreeing row: full identity, both labels, both rationales - read at the M7 session.

    The identity is carried under relevance_strings' own header names, the same four the review sheet
    and relevance_judgements.csv use, so a disagreement can be looked up in either without mapping.
    """
    return {
        human_review_vars.ROW_REVIEW_ID_KEY: row.review_id,
        relevance_strings.JUDGEMENT_CSV_QUERY_HEADER: row.query,
        relevance_strings.JUDGEMENT_CSV_SIDE_HEADER: row.side,
        relevance_strings.JUDGEMENT_CSV_RANK_HEADER: row.rank,
        relevance_strings.JUDGEMENT_CSV_SERVICE_NAME_HEADER: row.service_name,
        human_review_vars.ROW_HUMAN_VERDICT_KEY: row.human_verdict,
        human_review_vars.ROW_LLM_VERDICT_KEY: row.llm_verdict,
        human_review_vars.ROW_HUMAN_NOTES_KEY: row.human_notes,
        human_review_vars.ROW_LLM_REASON_KEY: row.llm_reason,
    }


def build_disagreement_rows(aligned: list[AlignedVerdict]) -> list[dict]:
    return [build_disagreement_row(row) for row in aligned
            if row.human_verdict != row.llm_verdict]


def build_agreement_statistics(sample_size: int, aligned: list[AlignedVerdict]) -> dict:
    """Every field of the agreement report except the gate, which is a separate decision.

    sample_size is passed in rather than derived from `aligned`: it is the size of the sheet that went
    out, and `aligned` holds only the rows that came back answered. Reporting one as the other is the
    partial-sheet failure - a 200-row sheet with 12 answers must never read as a 12-row study that was
    fully completed, nor as a 200-row study that was.
    """
    return {
        human_review_vars.SAMPLE_SIZE_KEY: sample_size,
        human_review_vars.REVIEWED_COUNT_KEY: len(aligned),
        human_review_vars.RAW_AGREEMENT_KEY: compute_raw_agreement(aligned),
        human_review_vars.COHENS_KAPPA_KEY: compute_cohens_kappa(
            [row.human_verdict for row in aligned], [row.llm_verdict for row in aligned],
            relevance_vars.VERDICTS),
        human_review_vars.CONFUSION_BY_SIDE_KEY: build_confusion_by_side(aligned),
        human_review_vars.AGREEMENT_BY_VERDICT_KEY: build_agreement_by_verdict(aligned),
        human_review_vars.DISAGREEMENT_ROWS_KEY: build_disagreement_rows(aligned),
    }
