from __future__ import annotations

import asyncio
import json
import logging
from typing import Callable, TypeVar

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_ollama import ChatOllama
from pydantic import BaseModel

from app.core.config import Settings

logger = logging.getLogger(__name__)

TModel = TypeVar("TModel", bound=BaseModel)


class StructuredLLMClient:
    """Single gateway for all LLM calls with strict structured parsing and retries."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._chat = ChatOllama(
            model=settings.ollama_model,
            temperature=min(settings.ollama_temperature, 0.3),
        )

    @staticmethod
    def _normalize_content(content: object) -> str:
        if isinstance(content, str):
            return content
        return json.dumps(content, ensure_ascii=True)

    async def invoke_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[TModel],
        fallback_factory: Callable[[], TModel],
        max_retries: int | None = None,
    ) -> TModel:
        parser = PydanticOutputParser(pydantic_object=output_model)
        retries = self._settings.llm_max_retries if max_retries is None else max_retries
        format_instructions = parser.get_format_instructions()

        base_messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(
                content=(
                    f"{user_prompt}\n\n"
                    "Follow the JSON schema exactly.\n"
                    f"{format_instructions}\n"
                    "Return only valid JSON."
                )
            ),
        ]

        messages = list(base_messages)
        last_error: Exception | None = None
        last_response = ""

        for attempt in range(retries + 1):
            try:
                logger.info("LLM invoke started | model=%s | attempt=%s", self._settings.ollama_model, attempt + 1)
                output = await asyncio.wait_for(
                    self._chat.ainvoke(messages),
                    timeout=self._settings.llm_request_timeout_seconds,
                )
                last_response = self._normalize_content(output.content)
                parsed = parser.parse(last_response)
                logger.info("LLM invoke succeeded | attempt=%s", attempt + 1)
                return parsed
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("LLM invoke failed | attempt=%s | error=%s", attempt + 1, exc)

                messages = list(base_messages)
                if last_response:
                    messages.append(AIMessage(content=last_response))
                messages.append(
                    HumanMessage(
                        content=(
                            "The previous output was invalid.\n"
                            f"Parsing error: {exc}\n"
                            "Fix the response and return valid JSON only."
                        )
                    )
                )

        logger.error("LLM invoke exhausted retries; using fallback. Last error=%s", last_error)
        return fallback_factory()
