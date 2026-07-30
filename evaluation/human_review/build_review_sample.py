import random

from evaluation import human_review_vars, relevance_vars
from evaluation.human_review.allocate_sample_budget import allocate_sample_budget
from evaluation.human_review.stratify_judged_pairs import (
    JudgedPair, StratumKey, group_pairs_by_stratum,
)
from evaluation.human_review_schemas import ReviewSampleRow


def build_review_id(position: int) -> str:
    return f'{human_review_vars.REVIEW_ID_PREFIX}{position:0{human_review_vars.REVIEW_ID_DIGITS}d}'


def draw_from_stratum(pairs: list[JudgedPair], count: int,
                      generator: random.Random) -> list[JudgedPair]:
    """`count` pairs of one cell, without replacement. Seeded, so the same cell yields the same rows
    every time and two reviewers can be handed the identical sheet."""
    return generator.sample(pairs, count)


def draw_stratified_pairs(groups: dict[StratumKey, list[JudgedPair]],
                          allocation: dict[StratumKey, int],
                          generator: random.Random) -> list[JudgedPair]:
    """One draw per allocated cell, cells visited in the fixed stratum order.

    The order matters for reproducibility rather than for the result: the same generator serves every
    cell, so consuming it in a different sequence would change every cell's draw.
    """
    return [pair
            for key, count in allocation.items()
            for pair in draw_from_stratum(groups[key], count, generator)]


def build_review_sample(judged_pairs: list[JudgedPair], sample_size: int) -> list[ReviewSampleRow]:
    """The stratified, shuffled, reproducible sample - the sheet's rows, before any column is chosen.

    Shuffled AFTER the per-cell draws so the sheet does not arrive sorted by the answer: rows grouped
    by verdict would let a reviewer infer the judge's opinion from where a row sits, which withholding
    the verdict column is supposed to prevent. review_id is assigned after the shuffle, so it is the
    sheet's own reading order and a spreadsheet sorted by it is in the order it was handed over.

    Reproducible end to end from REVIEW_SAMPLE_SEED: one generator, seeded once, consumed in a fixed
    sequence. The read-back redraws this exact list rather than trusting a persisted mapping, which is
    what lets the sheet withhold the verdict without losing track of what the judge said.
    """
    generator = random.Random(relevance_vars.REVIEW_SAMPLE_SEED)
    groups = group_pairs_by_stratum(judged_pairs)
    allocation = allocate_sample_budget({key: len(pairs) for key, pairs in groups.items()},
                                        sample_size)
    drawn = draw_stratified_pairs(groups, allocation, generator)
    generator.shuffle(drawn)
    return [ReviewSampleRow(review_id=build_review_id(position), item=item, judgement=judgement)
            for position, (item, judgement) in enumerate(drawn, start=1)]
