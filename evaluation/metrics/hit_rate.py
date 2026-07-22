def hit_rate(num_hits: int) -> float:
    """1 if any relevant result appears within the cutoff, else 0. Averaged -> Success@k."""
    return 1.0 if num_hits > 0 else 0.0
