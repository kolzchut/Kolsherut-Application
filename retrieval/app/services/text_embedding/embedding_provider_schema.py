from typing import Callable, NamedTuple


class EmbeddingProvider(NamedTuple):
    name: str
    embed_documents: Callable[[list[str]], list[list[float]]]
    embed_query: Callable[[str], list[float]]
