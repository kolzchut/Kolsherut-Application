from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.schemas.ask_schemas import ChatHistoryMessage
from app.services.generation.build_chat_messages import build_chat_messages
from app.vars import LLM_BASE_URL, LLM_MAX_TOKENS, LLM_MODEL_NAME


@lru_cache(maxsize=1)
def get_chat_model() -> ChatOpenAI:
    return ChatOpenAI(
        model=LLM_MODEL_NAME,
        max_tokens=LLM_MAX_TOKENS,
        base_url=LLM_BASE_URL or None,
    )


async def generate_answer(prompt: str, history: list[ChatHistoryMessage], documents: list[dict]) -> str:
    chat_messages = build_chat_messages(prompt, history, documents)
    llm_response = await get_chat_model().ainvoke(chat_messages)
    return llm_response.text()
