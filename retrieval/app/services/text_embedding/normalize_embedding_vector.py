from math import sqrt


def normalize_embedding_vector(vector: list[float]) -> list[float]:
    magnitude = sqrt(sum(value * value for value in vector))
    if magnitude == 0.0:
        return vector
    return [value / magnitude for value in vector]
