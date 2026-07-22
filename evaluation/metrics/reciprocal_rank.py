def reciprocal_rank(hit_flags: list[int]) -> float:
    """1 / rank of the first relevant result (rank starts at 1), else 0. Averaged -> MRR."""
    for index, hit_flag in enumerate(hit_flags):
        if hit_flag:
            return 1.0 / (index + 1)
    return 0.0
