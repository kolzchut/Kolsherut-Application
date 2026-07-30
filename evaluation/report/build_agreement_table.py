from evaluation import human_review_strings, human_review_vars
from evaluation.report.format_agreement_value import format_agreement_value


def build_agreement_rows(payload: dict) -> list[list[str]]:
    """Both headline numbers with their bars, always both, plus the coverage they were computed over.

    raw_agreement and cohens_kappa sit next to each other by construction. Printing the first alone
    would let a 0.93 agreement over one dominant class read as a passing judge.
    """
    return [
        [human_review_strings.AGREEMENT_TABLE_SAMPLE_SIZE_LABEL,
         format_agreement_value(payload[human_review_vars.SAMPLE_SIZE_KEY])],
        [human_review_strings.AGREEMENT_TABLE_REVIEWED_COUNT_LABEL,
         format_agreement_value(payload[human_review_vars.REVIEWED_COUNT_KEY])],
        [human_review_strings.AGREEMENT_TABLE_RAW_AGREEMENT_LABEL.format(
            threshold=human_review_vars.MIN_RAW_AGREEMENT),
         format_agreement_value(payload[human_review_vars.RAW_AGREEMENT_KEY])],
        [human_review_strings.AGREEMENT_TABLE_KAPPA_LABEL.format(
            threshold=human_review_vars.MIN_COHENS_KAPPA),
         format_agreement_value(payload[human_review_vars.COHENS_KAPPA_KEY])],
        [human_review_strings.AGREEMENT_TABLE_DISAGREEMENTS_LABEL,
         format_agreement_value(len(payload[human_review_vars.DISAGREEMENT_ROWS_KEY]))],
        [human_review_strings.AGREEMENT_TABLE_GATE_LABEL,
         payload[human_review_vars.GATE_KEY][human_review_vars.GATE_OUTCOME_KEY]],
    ]


def build_agreement_table(payload: dict) -> dict:
    return {
        'headers': [human_review_strings.AGREEMENT_TABLE_STATISTIC_HEADER,
                    human_review_strings.AGREEMENT_TABLE_VALUE_HEADER],
        'rows': build_agreement_rows(payload),
    }
