import csv
from datetime import datetime, timezone

from evaluation import relevance_strings, relevance_vars, vars
from evaluation.report.build_relevance_rows import build_relevance_header, build_relevance_rows
from evaluation.schemas import JudgementItem, ServiceJudgement

# The identity is the leading (query, side, rank, service_name) block - the same four columns
# service_diff.csv leads with. The verdict's position is looked up in the header rather than
# hard-coded, so inserting a column cannot silently point the assertion at the wrong cell.
IDENTITY_COLUMN_COUNT = 4


def find_verdict_column_index() -> int:
    return build_relevance_header().index(relevance_strings.JUDGEMENT_CSV_VERDICT_HEADER)


def build_judged_at_timestamp() -> str:
    """When this table was written. The one impure value in the row, which is why it is passed in
    rather than read inside the row builder."""
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def assert_relevance_rows(rows: list[list], judged_count: int) -> None:
    """One row per judged pair, and every row complete on both halves.

    A row with an identity but no verdict is an unjudged pair leaking into the table as if it had
    been judged; a verdict with no identity cannot be joined to anything.
    """
    if len(rows) != judged_count:
        raise ValueError(relevance_strings.ERROR_RELEVANCE_ROW_COUNT.format(
            rows=len(rows), judged=judged_count))
    verdict_column_index = find_verdict_column_index()
    for row in rows:
        identity_cells = row[:IDENTITY_COLUMN_COUNT]
        if any(cell in (None, '') for cell in identity_cells) or not row[verdict_column_index]:
            raise ValueError(relevance_strings.ERROR_RELEVANCE_ROW_INCOMPLETE.format(row=row))


def write_relevance_csv(judgements: list[ServiceJudgement], items: list[JudgementItem]) -> int:
    """The deliverable the whole plan converges on: every score next to its verdict.

    Scores are carried through from the frozen diff JSON files untouched, and a score the
    retriever never produced is written as a blank cell rather than a zero.
    """
    rows = build_relevance_rows(judgements, items, relevance_vars.JUDGE_MODEL,
                                build_judged_at_timestamp())
    assert_relevance_rows(rows, len(judgements))
    vars.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(relevance_vars.RELEVANCE_JUDGEMENTS_CSV_PATH, 'w', encoding='utf-8',
              newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(build_relevance_header())
        writer.writerows(rows)
    return len(rows)
