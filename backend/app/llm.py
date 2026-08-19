import time
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from langchain_core.messages import BaseMessage
from langsmith import traceable

from app.config import settings
from app.logging_config import get_logger

logger = get_logger("empathixai.llm")

_text_client = None
_vision_client = None


def get_text_client():
    global _text_client
    if _text_client is None:
        _text_client = InferenceClient(
            model=settings.hf_model_repo_id,
            token=settings.huggingfacehub_api_token,
            provider="auto",
        )
    return _text_client


def get_vision_client():
    global _vision_client
    if _vision_client is None:
        _vision_client = InferenceClient(
            model=settings.vision_model_repo_id,
            token=settings.huggingfacehub_api_token,
            provider="auto",
        )
    return _vision_client


def _to_hf_messages(lc_messages: list[BaseMessage]) -> list[dict]:
    role_map = {"system": "system", "human": "user", "ai": "assistant"}
    return [
        {"role": role_map.get(m.type, "user"), "content": m.content}
        for m in lc_messages
    ]


def _call_with_retry(client, messages, max_tokens, max_attempts=3):
    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            start = time.perf_counter()
            response = client.chat_completion(messages=messages, max_tokens=max_tokens)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info("llm_call_succeeded", extra={"attempt": attempt, "duration_ms": duration_ms})
            return response.choices[0].message.content
        except HfHubHTTPError as e:
            last_error = e
            if "capacity_exhausted" in str(e) and attempt < max_attempts:
                logger.warning("llm_call_retrying", extra={"attempt": attempt, "reason": "capacity_exhausted"})
                time.sleep(attempt * 3)
                continue
            logger.error("llm_call_failed", extra={"attempt": attempt, "error": str(e)})
            raise
    raise last_error


@traceable(name="generate_text_reply", run_type="llm")
def generate_reply(lc_messages: list[BaseMessage], max_tokens: int = 768) -> str:
    client = get_text_client()
    return _call_with_retry(client, _to_hf_messages(lc_messages), max_tokens=max_tokens)


@traceable(name="generate_vision_reply", run_type="llm")
def generate_vision_reply(system_prompt: str, user_text: str, image_data_url: str) -> str:
    client = get_vision_client()
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": user_text or "Please analyze this image."},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ],
        },
    ]
    return _call_with_retry(client, messages, max_tokens=768)