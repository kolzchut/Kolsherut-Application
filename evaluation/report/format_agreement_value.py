from evaluation import human_review_strings


def format_agreement_value(value) -> str:
    """One rendering of an agreement number, shared by the console table and the gate sentence.

    An undefined kappa becomes words, never `None` and never a digit: both the table and the gate
    would otherwise print something a reader parses as a measurement. Counts stay counts, and floats
    get four decimals so the two headline numbers are directly comparable to their two-decimal bars
    without a full float repr in the middle of a sentence.
    """
    if value is None:
        return human_review_strings.KAPPA_UNDEFINED_VALUE
    return f'{value:.4f}' if isinstance(value, float) else str(value)
