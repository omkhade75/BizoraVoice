"""
LLM engine using Ollama HTTP API.

Provides chat and streaming chat via Ollama's local REST API. Uses httpx
for async HTTP communication with proper timeouts and error handling.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


class LLMEngine:
    """Ollama LLM engine with async HTTP communication."""

    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url.rstrip("/")
        self._model = settings.ollama_model
        self._timeout = settings.ollama_timeout
        self._client: httpx.AsyncClient | None = None

    # ── lifecycle ───────────────────────────────────────────────────────

    async def _get_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=self._timeout,
                    write=10.0,
                    pool=10.0,
                ),
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    # ── health ──────────────────────────────────────────────────────────

    async def is_reachable(self) -> bool:
        """Check whether the Ollama server is reachable."""
        try:
            client = await self._get_client()
            resp = await client.get("/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    # ── chat ────────────────────────────────────────────────────────────

    def _build_messages(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> list[dict]:
        """Prepend system prompt to message list if provided."""
        result: list[dict] = []
        if system_prompt:
            result.append({"role": "system", "content": system_prompt})
        result.extend(messages)
        return result

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> str:
        """Send a chat request and return the complete response text.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: Optional system prompt prepended to messages.
            model: Model override (defaults to configured model).

        Returns:
            The assistant's response text.

        Raises:
            RuntimeError: If Ollama returns an error or is unreachable.
        """
        model = model or self._model
        payload = {
            "model": model,
            "messages": self._build_messages(messages, system_prompt),
            "stream": False,
        }

        try:
            client = await self._get_client()
            resp = await client.post("/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            return content.strip()
        except httpx.ConnectError:
            msg = f"Cannot connect to Ollama at {self._base_url}"
            logger.error(msg)
            raise RuntimeError(msg)
        except httpx.HTTPStatusError as exc:
            msg = f"Ollama returned HTTP {exc.response.status_code}"
            logger.error(msg)
            raise RuntimeError(msg)
        except Exception as exc:
            logger.error("LLM chat error: %s", exc, exc_info=True)
            raise RuntimeError(f"LLM chat failed: {exc}")

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens from Ollama.

        Yields individual text tokens as they arrive from the server.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: Optional system prompt.
            model: Model override.

        Yields:
            Text token strings.
        """
        model = model or self._model
        payload = {
            "model": model,
            "messages": self._build_messages(messages, system_prompt),
            "stream": True,
        }

        try:
            client = await self._get_client()
            async with client.stream("POST", "/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if data.get("done"):
                        break

                    token = data.get("message", {}).get("content", "")
                    if token:
                        yield token
        except httpx.ConnectError:
            logger.error("Cannot connect to Ollama at %s", self._base_url)
            yield "I'm sorry, but I'm unable to process your request right now."
        except httpx.HTTPStatusError as exc:
            logger.error("Ollama stream HTTP %s", exc.response.status_code)
            yield "I'm sorry, something went wrong while generating a response."
        except Exception as exc:
            logger.error("LLM stream error: %s", exc, exc_info=True)
            yield "I'm sorry, an unexpected error occurred."
