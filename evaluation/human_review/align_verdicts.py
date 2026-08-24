from evaluation import human_review_strings
from evaluation.human_review_schemas import AlignedVerdict, HumanVerdict, ReviewSampleRow


def index_sample_by_review_id(sample_rows: list[ReviewSampleRow]) -> dict[str, ReviewSampleRow]:
    return {sample_row.review_id: sample_row for sample_row in sample_rows}


def build_row_identity(query: str, side: str, rank: int, service_name: str) -> tuple:
    return query, side, rank, service_name


def assert_identity_matches(human: HumanVerdict, sample_row: ReviewSampleRow) -> None:
    """The sheet's own identity cells against the redrawn sample's.

    The join key is review_id, which carries no information about the pair - so on its own it would
    happily attach a human's answer to a different service if the label cache or the frozen snapshot
    moved between emitting the sheet and reading it back. The identity columns are the check that it
    did not, and a mismatch raises rather than quietly producing an agreement number about pairs
    nobody looked at.
    """
    sheet = build_row_identity(human.query, human.side, human.rank, human.service_name)
    redrawn = build_row_identity(sample_row.item.query, sample_row.item.side, sample_row.item.rank,
                                sample_row.item.service_name)
    if sheet != redrawn:
        raise ValueError(human_review_strings.ERROR_REVIEW_ROW_IDENTITY_DRIFT.format(
            review_id=human.review_id, sheet=sheet, redrawn=redrawn))


def select_answered(human_verdicts: list[HumanVerdict]) -> list[HumanVerdict]:
    """Only the rows a human actually answered. A blank verdict is not a verdict - it is an
    unreviewed row, and it belongs in sample_size and nowhere near an agreement count."""
    return [human for human in human_verdicts if human.verdict]


def build_aligned_verdict(human: HumanVerdict, sample_row: ReviewSampleRow) -> AlignedVerdict:
    return AlignedVerdict(
        review_id=human.review_id, query=human.query, side=human.side, rank=human.rank,
        service_name=human.service_name, human_verdict=human.verdict, human_notes=human.notes,
        llm_verdict=sample_row.judgement.verdict)


def align_verdicts(human_verdicts: list[HumanVerdict],
                   sample_rows: list[ReviewSampleRow]) -> list[AlignedVerdict]:
    """Answered sheet rows joined to the LLM's verdicts on review_id, in the sheet's order.

    Every identity is verified as it is joined. A review_id the redrawn sample does not know raises:
    it means rows were added, removed or renumbered, and each of those breaks the assumption that the
    seed reproduces the sheet.
    """
    sample_by_review_id = index_sample_by_review_id(sample_rows)
    aligned = []
    for human in select_answered(human_verdicts):
        sample_row = sample_by_review_id.get(human.review_id)
        if sample_row is None:
            raise ValueError(human_review_strings.ERROR_UNKNOWN_REVIEW_ID.format(
                review_id=human.review_id))
        assert_identity_matches(human, sample_row)
        aligned.append(build_aligned_verdict(human, sample_row))
    return aligned
