from typing import List, Optional
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration

from app.llm import generate_reply


class HFChatModel(BaseChatModel):
    """Wraps our direct Hugging Face InferenceClient call so RAGAS (which expects
    a LangChain-compatible chat model) can use it as its judge LLM."""

    @property
    def _llm_type(self) -> str:
        return "hf-inference-custom"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager=None,
        **kwargs,
    ) -> ChatResult:
        text = generate_reply(messages)
        generation = ChatGeneration(message=AIMessage(content=text))
        return ChatResult(generations=[generation])