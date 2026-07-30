from evaluation import human_review_strings, human_review_vars
from evaluation.report.format_agreement_value import format_agreement_value


def is_threshold_met(value: float | None, threshold: float) -> bool:
    """None never passes. An undefined kappa is not a high one: it means chance already explained
    every row, which cannot be evidence of above-chance agreement."""
    return value is not None and value >= threshold


def build_gate_outcome(statistics: dict, passed: bool) -> str:
    """The sentence the run reports. Both numbers appear in it whichever way the gate went."""
    if not statistics[human_review_vars.REVIEWED_COUNT_KEY]:
        return human_review_strings.GATE_OUTCOME_NO_VERDICTS.format(
            sample_size=statistics[human_review_vars.SAMPLE_SIZE_KEY],
            reviewed_count=statistics[human_review_vars.REVIEWED_COUNT_KEY])
    template = (human_review_strings.GATE_OUTCOME_PASSED if passed
                else human_review_strings.GATE_OUTCOME_FAILED)
    return template.format(
        raw_agreement=format_agreement_value(statistics[human_review_vars.RAW_AGREEMENT_KEY]),
        cohens_kappa=format_agreement_value(statistics[human_review_vars.COHENS_KAPPA_KEY]),
        min_raw_agreement=human_review_vars.MIN_RAW_AGREEMENT,
        min_cohens_kappa=human_review_vars.MIN_COHENS_KAPPA)


def check_agreement_gate(statistics: dict) -> dict:
    """The Mission 6 gate: BOTH thresholds, and both numbers reported either way.

    Both, never either. With a skewed verdict distribution raw agreement can sit at 0.93 while kappa
    is 0.04, and that combination has a specific meaning - the judge is guessing the majority class
    rather than judging - which the raw number alone actively hides.

    Nothing is acted on here. A failed gate is REPORTED, and the response to it is a decision: revise
    the prompt only, re-judge, re-sample. Automating any of that from a threshold would re-judge the
    dataset on the strength of a dozen hand-filled rows.
    """
    passed = (is_threshold_met(statistics[human_review_vars.RAW_AGREEMENT_KEY],
                               human_review_vars.MIN_RAW_AGREEMENT)
              and is_threshold_met(statistics[human_review_vars.COHENS_KAPPA_KEY],
                                   human_review_vars.MIN_COHENS_KAPPA)
              and bool(statistics[human_review_vars.REVIEWED_COUNT_KEY]))
    return {
        human_review_vars.GATE_PASSED_KEY: passed,
        human_review_vars.GATE_MIN_RAW_AGREEMENT_KEY: human_review_vars.MIN_RAW_AGREEMENT,
        human_review_vars.GATE_MIN_COHENS_KAPPA_KEY: human_review_vars.MIN_COHENS_KAPPA,
        human_review_vars.GATE_OUTCOME_KEY: build_gate_outcome(statistics, passed),
    }
