import csv

from evaluation import human_review_strings, human_review_vars, relevance_strings, vars
from evaluation.human_review_schemas import ReviewSampleRow

# What must never reach the sheet: the LLM's verdict, its reason, and all five score columns. Shown
# first, each of them anchors the reviewer - a cosine of 0.85 is not evidence that a service helps
# the person who asked, but it reads as evidence and pulls the human toward the retriever's opinion,
# and then the agreement number measures deference rather than agreement. Compared by exact equality,
# so `human_verdict` is not mistaken for `verdict`.
WITHHELD_COLUMNS = frozenset({
    relevance_strings.JUDGEMENT_CSV_VERDICT_HEADER,
    relevance_strings.JUDGEMENT_CSV_REASON_HEADER,
    *vars.SERVICE_SCORE_KEYS,
})


def build_review_sheet_header() -> list[str]:
    """review_id, the four identity columns, then the two the human fills in.

    The identity columns are relevance_strings' own headers, so this sheet, service_diff.csv and
    relevance_judgements.csv name them identically and join on (query, side, rank) without mapping.
    """
    return [
        human_review_strings.REVIEW_SHEET_REVIEW_ID_HEADER,
        relevance_strings.JUDGEMENT_CSV_QUERY_HEADER,
        relevance_strings.JUDGEMENT_CSV_SIDE_HEADER,
        relevance_strings.JUDGEMENT_CSV_RANK_HEADER,
        relevance_strings.JUDGEMENT_CSV_SERVICE_NAME_HEADER,
        human_review_strings.REVIEW_SHEET_HUMAN_VERDICT_HEADER,
        human_review_strings.REVIEW_SHEET_HUMAN_NOTES_HEADER,
    ]


def assert_header_withholds_answers(header: list[str]) -> None:
    """The anchoring guard, checked rather than trusted to a code review.

    The header is built one call above this one, so today it obviously complies; the assertion is for
    the edit six months from now that adds `cosine_score` "so the reviewer has context".
    """
    leaked = sorted(WITHHELD_COLUMNS.intersection(header))
    if leaked:
        raise ValueError(human_review_strings.ERROR_REVIEW_SHEET_LEAKS_ANSWER.format(
            header=header, leaked=leaked))


def build_review_sheet_row(sample_row: ReviewSampleRow) -> list:
    """One row: what the reviewer needs to judge the pair, and nothing that tells them the answer.

    The judgement on the record supplies only the identity here - never its verdict or its reason.
    """
    return [
        sample_row.review_id, sample_row.item.query, sample_row.item.side, sample_row.item.rank,
        sample_row.item.service_name,
        human_review_strings.REVIEW_SHEET_BLANK_CELL,
        human_review_strings.REVIEW_SHEET_BLANK_CELL,
    ]


def write_review_sheet_csv(sample_rows: list[ReviewSampleRow]) -> int:
    """The sheet a human answers from. Emitted with the two answer cells blank.

    utf-8-sig, unlike every other CSV here: this is the one file a person opens in Excel by hand, and
    without the BOM Excel decodes the Hebrew service names as mojibake. The reader accepts both.
    """
    header = build_review_sheet_header()
    assert_header_withholds_answers(header)
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(human_review_vars.REVIEW_SAMPLE_CSV_PATH, 'w', encoding='utf-8-sig',
              newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(header)
        writer.writerows(build_review_sheet_row(sample_row) for sample_row in sample_rows)
    return len(sample_rows)
