from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings

from app.vars import EMBEDDING_MODEL_PATH


@lru_cache(maxsize=1)
def load_local_embedding_model() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_PATH)
