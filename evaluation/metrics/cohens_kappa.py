from evaluation import human_review_vars


def count_labels(labels: list[str], classes: list[str]) -> dict[str, int]:
    """How many times each class was used, every class present even at zero."""
    return {label_class: labels.count(label_class) for label_class in classes}


def compute_observed_agreement(first_labels: list[str], second_labels: list[str]) -> float:
    """p_o: the share of rows the two raters labelled the same. Positional, so the two lists must be
    the same rows in the same order - which is what align_verdicts guarantees."""
    matches = sum(1 for first, second in zip(first_labels, second_labels) if first == second)
    return matches / len(first_labels)


def compute_expected_agreement(first_labels: list[str], second_labels: list[str],
                               classes: list[str]) -> float:
    """p_e = sum over classes of (first_c / N) * (second_c / N).

    The agreement two raters would reach by chance if each kept their own class frequencies but
    assigned them independently. This is what turns raw agreement into a chance-corrected number, and
    it is the reason kappa collapses when one class dominates: if the judge says `relevant` 95% of the
    time and so does the human, chance alone already explains ~0.90 of the agreement.
    """
    total = len(first_labels)
    first_counts = count_labels(first_labels, classes)
    second_counts = count_labels(second_labels, classes)
    return sum((first_counts[label_class] / total) * (second_counts[label_class] / total)
               for label_class in classes)


def compute_cohens_kappa(first_labels: list[str], second_labels: list[str],
                         classes: list[str]) -> float | None:
    """kappa = (p_o - p_e) / (1 - p_e), or the documented null sentinel when it is undefined.

    Two undefined cases, both returning human_review_vars.COHENS_KAPPA_UNDEFINED - JSON `null`, never
    0.0 and never 1.0, because both of those are real kappa values a reader would act on:

    - No rows at all. There is nothing to agree about, which is the state of an unfilled sheet.
    - p_e == 1. Both raters used exactly one class and it was the same class, so chance already
      explains every row and there is no headroom above it to measure. The raw agreement is 1.0 and
      perfectly true; it is simply not evidence of skill, and that is precisely what a null says.

    No dependency and no library: this is four lines of arithmetic over three counts.
    """
    if not first_labels:
        return human_review_vars.COHENS_KAPPA_UNDEFINED
    expected_agreement = compute_expected_agreement(first_labels, second_labels, classes)
    if expected_agreement == 1.0:
        return human_review_vars.COHENS_KAPPA_UNDEFINED
    observed_agreement = compute_observed_agreement(first_labels, second_labels)
    return (observed_agreement - expected_agreement) / (1.0 - expected_agreement)
