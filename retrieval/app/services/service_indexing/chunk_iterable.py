from collections.abc import Iterable, Iterator
from itertools import islice


def chunk_iterable(iterable: Iterable, chunk_size: int) -> Iterator[list]:
    iterator = iter(iterable)
    while True:
        chunk = list(islice(iterator, chunk_size))
        if not chunk:
            return
        yield chunk
