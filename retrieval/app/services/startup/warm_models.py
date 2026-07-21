from app.services.text_embedding.embedding_model import get_embedding_model


def warm_models() -> None:
    get_embedding_model()
