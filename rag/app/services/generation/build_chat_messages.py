from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from app.schemas.ask_schemas import ChatHistoryMessage
from app.services.generation.build_context_text import build_context_text
from app.strings import RAG_SYSTEM_PROMPT
from app.vars import HISTORY_ROLE_USER


def build_history_message(history_message: ChatHistoryMessage) -> BaseMessage:
    if history_message.role == HISTORY_ROLE_USER:
        return HumanMessage(content=history_message.content)
    return AIMessage(content=history_message.content)


def build_chat_messages(
    prompt: str,
    history: list[ChatHistoryMessage],
    documents: list[dict],
) -> list[BaseMessage]:
    context = build_context_text(documents)
    system_message = SystemMessage(content=RAG_SYSTEM_PROMPT.format(context=context))
    history_messages = [build_history_message(history_message) for history_message in history]
    return [system_message, *history_messages, HumanMessage(content=prompt)]
