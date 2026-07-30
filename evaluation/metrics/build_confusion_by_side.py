from evaluation import relevance_statistics_vars, relevance_vars
from evaluation.human_review_schemas import AlignedVerdict


def build_empty_confusion_matrix() -> dict[str, dict[str, int]]:
    """A full 3x3 of zeroes, outer key the HUMAN verdict, inner key the LLM's.

    Always the whole grid, never only the populated cells: the empty cells are the finding. A zero in
    (human relevant, llm irrelevant) is what says the judge never threw away a good service.
    """
    return {human_verdict: {llm_verdict: 0 for llm_verdict in relevance_vars.VERDICTS}
            for human_verdict in relevance_vars.VERDICTS}


def build_confusion_matrix(aligned: list[AlignedVerdict]) -> dict[str, dict[str, int]]:
    matrix = build_empty_confusion_matrix()
    for row in aligned:
        matrix[row.human_verdict][row.llm_verdict] += 1
    return matrix


def select_rows_of_side(aligned: list[AlignedVerdict], side: str) -> list[AlignedVerdict]:
    return [row for row in aligned if row.side == side]


def build_confusion_by_side(aligned: list[AlignedVerdict]) -> dict[str, dict[str, dict[str, int]]]:
    """One 3x3 per diff side, both sides always present.

    Per side rather than pooled because the two sides ask opposite questions - whether the golden set
    holds noise, and whether it is too narrow - so a judge can be reliable on one and wrong on the
    other, and a pooled matrix would average that away. The matrix is what shows WHICH DIRECTION the
    judge errs in: a mass of (human irrelevant, llm relevant) on the unexpected side is a judge that
    rubber-stamps retrieval, and it fails the mission for a different reason than the mirror cell.
    """
    return {side: build_confusion_matrix(select_rows_of_side(aligned, side))
            for side in relevance_statistics_vars.RELEVANCE_SIDES}
