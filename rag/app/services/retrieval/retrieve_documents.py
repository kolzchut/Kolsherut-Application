from app.services.retrieval.retrieve_documents_with_trace import retrieve_documents_with_trace


async def retrieve_documents(query: str, top_k: int) -> list[dict]:
    documents, _retrieval_steps = await retrieve_documents_with_trace(query, top_k)
    return documents
