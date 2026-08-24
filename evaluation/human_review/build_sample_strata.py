from evaluation import human_review_strings, human_review_vars
from evaluation.human_review.stratify_judged_pairs import (
    JudgedPair, build_stratum_label, count_pairs_by_stratum,
)
from evaluation.human_review_schemas import ReviewSampleRow


def build_sample_strata(judged_pairs: list[JudgedPair],
                        sample_rows: list[ReviewSampleRow]) -> dict[str, dict[str, int]]:
    """Drawn against available, per populated side x verdict cell.

    The evidence that stratification did its job. Reading the drawn column alone cannot show whether
    a rare cell was represented or merely small, so both numbers are reported together: 12 of 12
    `unclear` rows is full coverage of that cell, while 12 of 900 is a sample of it.

    Empty cells are omitted: a cell with no labelled pairs is not an under-representation, it is a
    verdict the judge never returned, and listing it at 0 of 0 would read as a failure of the draw.
    """
    available = count_pairs_by_stratum(judged_pairs)
    drawn = count_pairs_by_stratum([(row.item, row.judgement) for row in sample_rows])
    return {
        build_stratum_label(key): {
            human_review_vars.STRATUM_DRAWN_KEY: drawn[key],
            human_review_vars.STRATUM_AVAILABLE_KEY: size,
        }
        for key, size in available.items() if size
    }


def render_sample_strata_log_line(strata: dict[str, dict[str, int]]) -> str:
    """The same counts on one log line, so the operator sees the draw without opening the report."""
    return human_review_strings.LOG_REVIEW_SAMPLE_STRATA.format(
        strata=human_review_strings.LOG_REVIEW_SAMPLE_STRATUM_SEPARATOR.join(
            human_review_strings.LOG_REVIEW_SAMPLE_STRATUM.format(
                label=label, drawn=counts[human_review_vars.STRATUM_DRAWN_KEY],
                available=counts[human_review_vars.STRATUM_AVAILABLE_KEY])
            for label, counts in strata.items()))
