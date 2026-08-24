def find_missed_ground_truth_names(ordered_ground_truth_names: tuple[str, ...],
                                   ranked_names: list[str]) -> tuple[str, ...]:
    """Ground-truth services retrieval never returned - the recall failures.

    Kept in the incumbent site's render order, so position doubles as its rank.
    """
    retrieved_names = set(ranked_names)
    return tuple(name for name in ordered_ground_truth_names if name not in retrieved_names)


def find_unexpected_retrieved_names(ranked_names: list[str],
                                    ground_truth_names: set[str]) -> tuple[str, ...]:
    """Returned services the incumbent site does not show - the false positives.

    Kept in retrieval's rank order: a false positive at rank 2 matters far more than one
    at rank 250, so the ordering is the diagnostic signal.
    """
    return tuple(name for name in ranked_names if name not in ground_truth_names)


def find_mutual_retrieved_names(ranked_names: list[str],
                                ground_truth_names: set[str]) -> tuple[str, ...]:
    """Returned services the incumbent site also shows - the true positives.

    The exact complement of find_unexpected_retrieved_names over the same list, so the two
    partition the returned names with nothing dropped and nothing counted twice. Kept in
    retrieval's rank order for the same reason, and it is what the other side's rank column
    renumbers over: read alone, the unexpected list closes the gaps these names leave.
    """
    return tuple(name for name in ranked_names if name in ground_truth_names)
