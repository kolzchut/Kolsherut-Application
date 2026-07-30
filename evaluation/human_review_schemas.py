from dataclasses import dataclass

from evaluation.schemas import JudgementItem, ServiceJudgement

# Mission 6's three records. A sibling of schemas.py rather than an addition to it: schemas.py is at
# 99 of its 100 lines, and one frozen dataclass with a docstring cannot fit in one. Grouped in a
# single file for the same reason schemas.py groups its own - they are one scope, the human audit,
# and each is meaningless without the other two.


@dataclass(frozen=True)
class ReviewSampleRow:
    """One drawn pair, with the review_id the sheet will carry it under.

    Holds BOTH the item and the LLM's judgement even though neither is ever written to the sheet.
    That is the point of the record: the sheet withholds the verdict and the scores, so the mapping
    from a review_id back to what the judge actually said has to live somewhere the reviewer never
    sees. It is reconstructed from the seed at read-back time rather than persisted.
    """
    review_id: str
    item: JudgementItem
    judgement: ServiceJudgement


@dataclass(frozen=True)
class HumanVerdict:
    """One row of the filled-in review sheet, exactly as the human left it.

    `verdict` is the empty string for a row nobody answered, and that is never a verdict: a blank is
    an unreviewed row, counted in `sample_size` and excluded from `reviewed_count`. Treating it as
    `irrelevant` - the tempting default - would manufacture agreement or disagreement out of a cell
    the reviewer simply did not reach.

    The four identity fields are read back off the sheet even though the redrawn sample supplies
    them too, so the two can be compared: if they ever disagree the answers describe different pairs.
    """
    review_id: str
    query: str
    side: str
    rank: int
    service_name: str
    verdict: str
    notes: str


@dataclass(frozen=True)
class AlignedVerdict:
    """One reviewed row with both labels side by side - the unit every agreement number counts.

    Only rows a human actually answered become one of these, so `human_verdict` is always a real
    verdict here. `human_notes` is carried for the disagreement rows alone: the Mission 7 session
    reads those, and two bare labels alone do not say which rater was right. There is no matching
    field on the judge's side - as of schema v3 it returns a bare marker and states no rationale.
    """
    review_id: str
    query: str
    side: str
    rank: int
    service_name: str
    human_verdict: str
    human_notes: str
    llm_verdict: str
