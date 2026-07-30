from evaluation import relevance_strings, vars
from evaluation.report.pair_judged_items import pair_items_with_judgements
from evaluation.schemas import JudgementItem, ServiceJudgement


def build_relevance_header() -> list[str]:
    """Identity, then the five scores in FE-badge order, then the verdict and its provenance.

    The order is deliberate and fixed: the table should be pivotable in Excel without rearranging,
    and its first four columns are service_diff.csv's, so the two join on (query, side, rank).
    """
    return [
        relevance_strings.JUDGEMENT_CSV_QUERY_HEADER, relevance_strings.JUDGEMENT_CSV_SIDE_HEADER,
        relevance_strings.JUDGEMENT_CSV_RANK_HEADER,
        relevance_strings.JUDGEMENT_CSV_SERVICE_NAME_HEADER,
        *vars.SERVICE_SCORE_KEYS,
        relevance_strings.JUDGEMENT_CSV_VERDICT_HEADER,
        relevance_strings.JUDGEMENT_CSV_MODEL_HEADER,
        relevance_strings.JUDGEMENT_CSV_JUDGED_AT_HEADER,
    ]


def format_score_cell(score) -> str | float:
    """None becomes a BLANK cell, never 0.0. On the missed side every score is None by
    construction - nothing ever scored those services - and on the unexpected side a null
    lexical_score means BM25 never surfaced the document. A zero would claim a retriever scored
    it, which is a different fact."""
    return relevance_strings.JUDGEMENT_CSV_BLANK_SCORE_CELL if score is None else score


def build_relevance_row(item: JudgementItem, judgement: ServiceJudgement,
                        model: str, judged_at: str) -> list:
    """One judged pair: its identity, its carried scores, its verdict.

    The scores are the item's own - read out of the frozen diff JSON and never re-derived here.
    """
    return [
        judgement.query, judgement.side, judgement.rank, judgement.service_name,
        *[format_score_cell(item.scores.get(score_key)) for score_key in vars.SERVICE_SCORE_KEYS],
        judgement.verdict, model, judged_at,
    ]


def build_relevance_rows(judgements: list[ServiceJudgement], items: list[JudgementItem],
                         model: str, judged_at: str) -> list[list]:
    """One row per judged pair, in the frozen files' order rather than the batch's."""
    return [build_relevance_row(item, judgement, model, judged_at)
            for item, judgement in pair_items_with_judgements(items, judgements)]
