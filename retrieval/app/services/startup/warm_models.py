from app.services.elasticsearch.assert_index_matches_provider import assert_index_matches_provider
from app.services.text_embedding.probe_embedding_dimensions import probe_embedding_dimensions
from app.services.text_embedding.resolve_embedding_provider import resolve_embedding_provider


def warm_models() -> None:
    """Provider-blind warm-up: the dimension probe forces the model load / client construction,
    and its width is what the embeddings index is then checked against."""
    provider = resolve_embedding_provider()
    assert_index_matches_provider(provider.name, probe_embedding_dimensions(provider))
