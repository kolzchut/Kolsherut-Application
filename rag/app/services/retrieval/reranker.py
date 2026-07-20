from functools import lru_cache

from sentence_transformers import CrossEncoder

from app.vars import RERANKER_MAX_LENGTH, RERANKER_MODEL_PATH


@lru_cache(maxsize=1)
def get_reranker_model() -> CrossEncoder:
    return CrossEncoder(RERANKER_MODEL_PATH, max_length=RERANKER_MAX_LENGTH)


def rerank_documents(query: str, documents: list[dict]) -> list[dict]:
    reranker_scores = get_reranker_model().predict(
        [(query, document['text']) for document in documents]
    )
    rescored_documents = [
        {**document, 'score': float(reranker_score)}
        for document, reranker_score in zip(documents, reranker_scores)
    ]
    return sorted(rescored_documents, key=lambda document: document['score'], reverse=True)
