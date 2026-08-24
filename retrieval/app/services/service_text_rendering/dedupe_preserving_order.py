def dedupe_preserving_order(values: list) -> list:
    seen: set = set()
    unique_values = []
    for value in values:
        if value not in seen:
            seen.add(value)
            unique_values.append(value)
    return unique_values
