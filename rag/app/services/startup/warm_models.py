from app.services.embedding.embedding_model import get_embedding_model
from app.services.generation.langchain_service import get_chat_model
from app.services.retrieval.reranker import get_reranker_model


def warm_models() -> None:
    get_embedding_model()
    get_reranker_model()
    get_chat_model()
