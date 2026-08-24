from evaluation import relevance_strings, vars
from evaluation.report.pair_judged_items import pair_items_with_judgements
from evaluation.report.serialize_service_details import serialize_service_details
from evaluation.relevance_schemas import JudgementItem, ServiceJudgement


def build_relevance_header() -> list[str]:
    """Identity, then the raw rank, then what the service IS, then how it scored, then the
    verdict and its provenance.

    The order is deliberate and fixed: the table should be pivotable in Excel without rearranging,
    and its first four columns are service_diff.csv's, so the two join on (query, side, rank).
    raw_rank sits after that block rather than inside it - it is blank on the missed side, and the
    identity block is asserted complete on every row.
    """
    return [
        relevance_strings.JUDGEMENT_CSV_QUERY_HEADER, relevance_strings.JUDGEMENT_CSV_SIDE_HEADER,
        relevance_strings.JUDGEMENT_CSV_RANK_HEADER,
        relevance_strings.JUDGEMENT_CSV_SERVICE_NAME_HEADER,
        relevance_strings.JUDGEMENT_CSV_RAW_RANK_HEADER,
        *vars.SERVICE_DETAIL_KEYS,
        *vars.SERVICE_SCORE_KEYS,
        relevance_strings.JUDGEMENT_CSV_VERDICT_HEADER,
        relevance_strings.JUDGEMENT_CSV_MODEL_HEADER,
        relevance_strings.JUDGEMENT_CSV_JUDGED_AT_HEADER,
    ]


def format_score_cell(score) -> str | float:
    """None becomes a BLANK cell, never 0.0. On the missed side every score is None by
    construction - nothing ever scored those services - and on the unexpected side a null
    lexical_score means BM25 never surfaced the document. A zero would claim a retriever scored
    it, which is a different fact. The same applies to a missing raw rank."""
    return relevance_strings.JUDGEMENT_CSV_BLANK_SCORE_CELL if score is None else score


def format_detail_cell(detail_key: str, value) -> str:
    """Tag sets are joined into one cell; the description is written as it stands.

    A missing value is blank for the same reason a missing score is: on the missed side content
    comes from a name lookup that can fail, and an empty cell says the lookup found nothing,
    while any placeholder would read as a fact about the service.
    """
    if value is None:
        return relevance_strings.JUDGEMENT_CSV_BLANK_SCORE_CELL
    if detail_key in vars.SERVICE_DETAIL_TAG_KEYS:
        return relevance_strings.JUDGEMENT_CSV_TAG_SEPARATOR.join(value)
    return value


def build_detail_cells(item: JudgementItem) -> list[str]:
    """The item's content, pushed back through the one flattener so the cells land in the same
    order as the headers and under the same None semantics."""
    serialized = serialize_service_details(item.details)
    return [format_detail_cell(detail_key, serialized[detail_key])
            for detail_key in vars.SERVICE_DETAIL_KEYS]


def build_relevance_row(item: JudgementItem, judgement: ServiceJudgement,
                        model: str, judged_at: str) -> list:
    """One judged pair: its identity, its raw rank, its content, its scores, its verdict.

    Everything but the verdict is the item's own - read out of the frozen diff JSON and never
    re-derived here.
    """
    return [
        judgement.query, judgement.side, judgement.rank, judgement.service_name,
        format_score_cell(item.raw_rank),
        *build_detail_cells(item),
        *[format_score_cell(item.scores.get(score_key)) for score_key in vars.SERVICE_SCORE_KEYS],
        judgement.verdict, model, judged_at,
    ]


def build_relevance_rows(judgements: list[ServiceJudgement], items: list[JudgementItem],
                         model: str, judged_at: str) -> list[list]:
    """One row per judged pair, in the frozen files' order rather than the batch's."""
    return [build_relevance_row(item, judgement, model, judged_at)
            for item, judgement in pair_items_with_judgements(items, judgements)]
