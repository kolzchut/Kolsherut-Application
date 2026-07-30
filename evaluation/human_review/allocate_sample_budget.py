from evaluation import human_review_vars

StratumKey = tuple[str, str]


def select_populated_strata(sizes: dict[StratumKey, int]) -> dict[StratumKey, int]:
    """The cells that actually hold pairs, in the caller's fixed order. An empty cell gets no floor:
    a floor it cannot fill would silently eat budget the populated cells could have used."""
    return {key: size for key, size in sizes.items() if size > 0}


def build_floor_allocation(populated: dict[StratumKey, int], sample_size: int
                           ) -> dict[StratumKey, int]:
    """The guaranteed minimum per populated cell - the step that keeps the rare cells alive.

    Two caps, both necessary. The cell's own size, because a cell of 3 cannot yield 10. And an equal
    share of the whole budget, because with a small N a fixed floor times several cells would exceed
    the sample and turn the draw into "everything from the first few cells"; the equal share degrades
    it to an even split instead, which is the honest answer when N is too small to stratify richly.
    """
    floor = min(human_review_vars.REVIEW_SAMPLE_MIN_PER_STRATUM, sample_size // len(populated))
    return {key: min(size, floor) for key, size in populated.items()}


def rank_by_largest_remainder(headroom: dict[StratumKey, int], total_headroom: int,
                              remaining: int) -> list[StratumKey]:
    """Cells ordered by the fractional part their proportional quota left over, largest first.

    Largest-remainder is what makes the split add up to exactly `remaining` without a rounding drift,
    and ties fall back to the fixed stratum order, so the result is deterministic rather than
    dependent on dict iteration luck.
    """
    return sorted(headroom, key=lambda key: -(remaining * headroom[key] / total_headroom % 1))


def distribute_remaining_budget(headroom: dict[StratumKey, int], remaining: int
                                ) -> dict[StratumKey, int]:
    """What is left after the floors, split PROPORTIONALLY to each cell's unallocated headroom.

    Proportional here and not equal: past the floor, the point is a sample that resembles the
    dataset, and the floor has already bought the rare cells their representation.
    """
    total_headroom = sum(headroom.values())
    extra = {key: remaining * room // total_headroom for key, room in headroom.items()}
    for key in rank_by_largest_remainder(headroom, total_headroom, remaining):
        if sum(extra.values()) >= remaining:
            break
        if extra[key] < headroom[key]:
            extra[key] += 1
    return extra


def allocate_sample_budget(sizes: dict[StratumKey, int], sample_size: int
                           ) -> dict[StratumKey, int]:
    """How many rows each side x verdict cell contributes: a floor first, then proportional.

    When the budget is at least the whole labelled set, every pair is taken - a sample larger than
    the population is a census, not an error.
    """
    populated = select_populated_strata(sizes)
    if not populated or sample_size >= sum(populated.values()):
        return dict(populated)
    allocation = build_floor_allocation(populated, sample_size)
    headroom = {key: size - allocation[key] for key, size in populated.items()}
    extra = distribute_remaining_budget(headroom, sample_size - sum(allocation.values()))
    return {key: allocation[key] + extra[key] for key in populated}
