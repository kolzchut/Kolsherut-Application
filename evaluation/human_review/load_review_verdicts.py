import csv
from pathlib import Path

from evaluation import human_review_strings, human_review_vars, relevance_strings, relevance_vars
from evaluation.human_review_schemas import HumanVerdict


def read_review_sheet_cell(row: dict, header: str) -> str:
    """One cell, whitespace stripped, a missing column read as blank.

    Stripping matters on a hand-filled sheet: a trailing space after `relevant` is invisible in a
    spreadsheet and would otherwise fail the vocabulary check for no reason a reviewer could see.
    """
    return (row.get(header) or human_review_strings.REVIEW_SHEET_BLANK_CELL).strip()


def validate_review_verdict(review_id: str, verdict: str) -> str:
    """A blank stays blank; anything else must be one of the three verdicts.

    A typo is raised on rather than accepted. Accepting it would count as a disagreement with the
    judge, which is the one outcome a spelling mistake must never be able to produce - it moves both
    the agreement number and kappa in the direction of "the judge is wrong".
    """
    if verdict and verdict not in relevance_vars.VERDICTS:
        raise ValueError(human_review_strings.ERROR_UNKNOWN_REVIEW_VERDICT.format(
            review_id=review_id, verdict=verdict, allowed=relevance_vars.VERDICTS))
    return verdict


def build_human_verdict(row: dict) -> HumanVerdict:
    """One sheet row as a record. The four identity cells are read back even though the redrawn
    sample supplies them too, so align_verdicts can compare the two and refuse a drifted sheet."""
    review_id = read_review_sheet_cell(row, human_review_strings.REVIEW_SHEET_REVIEW_ID_HEADER)
    verdict = read_review_sheet_cell(row, human_review_strings.REVIEW_SHEET_HUMAN_VERDICT_HEADER)
    return HumanVerdict(
        review_id=review_id,
        query=read_review_sheet_cell(row, relevance_strings.JUDGEMENT_CSV_QUERY_HEADER),
        side=read_review_sheet_cell(row, relevance_strings.JUDGEMENT_CSV_SIDE_HEADER),
        rank=int(read_review_sheet_cell(row, relevance_strings.JUDGEMENT_CSV_RANK_HEADER)),
        service_name=read_review_sheet_cell(
            row, relevance_strings.JUDGEMENT_CSV_SERVICE_NAME_HEADER),
        verdict=validate_review_verdict(review_id, verdict),
        notes=read_review_sheet_cell(row, human_review_strings.REVIEW_SHEET_HUMAN_NOTES_HEADER))


def load_review_verdicts(path: Path = human_review_vars.REVIEW_SAMPLE_CSV_PATH
                         ) -> list[HumanVerdict]:
    """Every row of the filled-in sheet, answered or not, in the sheet's own order.

    Unanswered rows are returned rather than dropped, because `sample_size` is a count of the sheet
    and `reviewed_count` a count of the answers: a loader that silently dropped the blanks would make
    a sheet with three answers report 100% coverage of a three-row sample.

    utf-8-sig strips the BOM the writer emits for Excel, and is a no-op on a plain utf-8 file - so a
    sheet re-saved by any editor still reads.
    """
    if not path.exists():
        raise FileNotFoundError(
            human_review_strings.ERROR_REVIEW_SHEET_MISSING.format(path=path))
    with open(path, 'r', encoding='utf-8-sig', newline='') as csv_file:
        return [build_human_verdict(row) for row in csv.DictReader(csv_file)]
