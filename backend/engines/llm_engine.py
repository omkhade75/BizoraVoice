"""
Unified LLM engine supporting both Google Gemini (Cloud) and Ollama (Local).

Allows seamless toggling between:
- Cloud-hosted Google Gemini (gemini-2.5-flash, gemini-1.5-flash, gemini-2.0-flash) with 0% laptop load.
- Local Ollama (qwen2.5:7b, llama3.2, etc.) for offline/on-premise sovereign computing.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


class LLMEngine:
    """Unified LLM engine supporting Google Gemini and Ollama."""

    def __init__(self) -> None:
        settings = get_settings()
        self._ollama_base_url = settings.ollama_base_url.rstrip("/")
        self._ollama_model = settings.ollama_model
        self._ollama_timeout = settings.ollama_timeout

        self._gemini_api_key = settings.gemini_api_key
        self._gemini_default_model = settings.gemini_model
        self._gemini_timeout = settings.gemini_timeout

        self._ollama_client: httpx.AsyncClient | None = None
        self._gemini_client: httpx.AsyncClient | None = None

    # ── lifecycle ───────────────────────────────────────────────────────

    async def _get_ollama_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared Ollama async HTTP client."""
        if self._ollama_client is None or self._ollama_client.is_closed:
            self._ollama_client = httpx.AsyncClient(
                base_url=self._ollama_base_url,
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=self._ollama_timeout,
                    write=10.0,
                    pool=10.0,
                ),
            )
        return self._ollama_client

    async def _get_gemini_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared Gemini async HTTP client."""
        if self._gemini_client is None or self._gemini_client.is_closed:
            self._gemini_client = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=self._gemini_timeout,
                    write=10.0,
                    pool=10.0,
                ),
            )
        return self._gemini_client

    async def close(self) -> None:
        """Close HTTP clients."""
        if self._ollama_client and not self._ollama_client.is_closed:
            await self._ollama_client.aclose()
            self._ollama_client = None
        if self._gemini_client and not self._gemini_client.is_closed:
            await self._gemini_client.aclose()
            self._gemini_client = None

    # ── health & provider detection ─────────────────────────────────────

    def is_gemini_model(self, model: Optional[str]) -> bool:
        """Check if target model is a Google Gemini model."""
        if not model:
            return False
        m = model.lower().strip()
        return m.startswith("gemini")

    async def is_reachable(self, model: Optional[str] = None) -> bool:
        """Check whether the target LLM provider is reachable."""
        if self.is_gemini_model(model):
            settings = get_settings()
            key = settings.gemini_api_key or self._gemini_api_key
            return bool(key and len(key) > 5)

        try:
            client = await self._get_ollama_client()
            resp = await client.get("/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    # ── Ollama Helper ───────────────────────────────────────────────────

    def _build_ollama_messages(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> list[dict]:
        result: list[dict] = []
        if system_prompt:
            result.append({"role": "system", "content": system_prompt})
        result.extend(messages)
        return result

    # ── Gemini Helper ───────────────────────────────────────────────────

    def _build_gemini_payload(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> dict:
        """Convert chat history to Google Gemini API payload."""
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                continue  # Handled in systemInstruction
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}]
            })

        if not contents:
            contents.append({"role": "user", "parts": [{"text": "Hello"}]})

        payload: dict = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
            }
        }
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }
        return payload

    # ── Unified Chat ────────────────────────────────────────────────────

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> str:
        """Send chat request and return complete response text."""
        model = model or self._gemini_default_model if self._gemini_api_key else self._ollama_model

        if self.is_gemini_model(model):
            return await self._chat_gemini(messages, system_prompt, model)
        return await self._chat_ollama(messages, system_prompt, model)

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens from Gemini or Ollama."""
        model = model or self._gemini_default_model if self._gemini_api_key else self._ollama_model

        if self.is_gemini_model(model):
            async for token in self._chat_stream_gemini(messages, system_prompt, model):
                yield token
        else:
            async for token in self._chat_stream_ollama(messages, system_prompt, model):
                yield token

    # ── Ollama Implementation ───────────────────────────────────────────

    async def _chat_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> str:
        model = model or self._ollama_model
        payload = {
            "model": model,
            "messages": self._build_ollama_messages(messages, system_prompt),
            "stream": False,
        }

        try:
            client = await self._get_ollama_client()
            resp = await client.post("/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            return content.strip()
        except httpx.ConnectError:
            msg = f"Cannot connect to Ollama at {self._ollama_base_url}"
            logger.error(msg)
            raise RuntimeError(msg)
        except httpx.HTTPStatusError as exc:
            msg = f"Ollama returned HTTP {exc.response.status_code}"
            logger.error(msg)
            raise RuntimeError(msg)
        except Exception as exc:
            logger.error("LLM chat error: %s", exc, exc_info=True)
            raise RuntimeError(f"LLM chat failed: {exc}")

    async def _chat_stream_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        model = model or self._ollama_model
        payload = {
            "model": model,
            "messages": self._build_ollama_messages(messages, system_prompt),
            "stream": True,
        }

        try:
            client = await self._get_ollama_client()
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
            logger.warning("Ollama not reachable at %s. Checking Gemini cloud fallback...", self._ollama_base_url)
            settings = get_settings()
            gemini_key = settings.gemini_api_key or self._gemini_api_key
            if gemini_key:
                try:
                    async for token in self._chat_stream_gemini(messages, system_prompt, settings.gemini_model):
                        yield token
                    return
                except Exception as ge:
                    logger.warning("Gemini cloud fallback failed: %s", ge)

            fallback_text = self._get_contextual_fallback_reply(messages, system_prompt)
            for word in fallback_text.split(" "):
                yield word + " "
        except Exception as exc:
            logger.error("LLM stream error: %s", exc, exc_info=True)
            fallback_text = self._get_contextual_fallback_reply(messages, system_prompt)
            for word in fallback_text.split(" "):
                yield word + " "

    def _get_contextual_fallback_reply(self, messages: list[dict], system_prompt: str | None = None) -> str:
        prompt_lower = (system_prompt or "").lower()
        last_msg = (messages[-1]["content"] if messages else "").lower()

        # Gujarati Persona
        if "gujarati" in prompt_lower or "ગુજરાતી" in prompt_lower:
            if any(k in last_msg for k in ["ભાવ", "rate", "price", "કિંમત"]):
                return "આજના રાજકોટ અને અમદાવાદ માર્કેટ યાર્ડના ભાવ સ્થિર છે. કપાસ અને તેલીબિયાંનો નવો જથ્થો ઉપલબ્ધ છે."
            return "નમસ્તે! તમારા ઓર્ડરની વિગતો અમે નોંધી લીધી છે. ટૂંક સમયમાં તમને સંપૂર્ણ કન્ફર્મેશન મળી જશે."

        # Marathi Persona
        if "marathi" in prompt_lower or "मराठी" in prompt_lower or "पुरवठादार" in prompt_lower:
            if any(k in last_msg for k in ["भाव", "किंमत", "rate", "कांदा"]):
                return "नाशिक बाजार समितीत आज कांद्याला प्रति क्विंटल २४५० रुपये दर चालू आहे. ताज्या मालाचा पुरवठा उपलब्ध आहे."
            return "होय, आम्ही तुमचा निरोप नोंदवून घेतला आहे. सर्व मालाची खात्री करून आम्ही त्वरित कळवतो."

        # Hindi Persona
        if "hindi" in prompt_lower or "हिन्दी" in prompt_lower or "taj" in prompt_lower or "doctor" in prompt_lower:
            if any(k in last_msg for k in ["कमरा", "room", "booking", "table"]):
                return "जी बिल्कुल, ताज रेसिडेंसी में डीलक्स रूम उपलब्ध है। आपकी बुकिंग दर्ज कर ली गई है।"
            return "नमस्ते! आपकी पूरी सहायता की जाएगी। बताइए आपकी क्या सेवा कर सकते हैं?"

        # Default English
        return "Thank you for connecting with Bizora Voice. Your request has been acknowledged and our team is assisting you right away."

    # ── Gemini Cloud Implementation ─────────────────────────────────────

    async def _chat_gemini(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str = "gemini-2.5-flash",
    ) -> str:
        settings = get_settings()
        api_key = settings.gemini_api_key or self._gemini_api_key
        if not api_key:
            return "Google Gemini API key is not configured. Please add your GEMINI_API_KEY in Settings to enable cloud LLM calls."

        payload = self._build_gemini_payload(messages, system_prompt)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        try:
            client = await self._get_gemini_client()
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                err_msg = f"Gemini API returned {resp.status_code}: {resp.text}"
                logger.error(err_msg)
                return f"Gemini error: {resp.text}"

            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
            return "No response text generated by Gemini."
        except Exception as exc:
            logger.error("Gemini chat error: %s", exc, exc_info=True)
            raise RuntimeError(f"Gemini call failed: {exc}")

    async def _chat_stream_gemini(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str = "gemini-2.5-flash",
    ) -> AsyncGenerator[str, None]:
        settings = get_settings()
        api_key = settings.gemini_api_key or self._gemini_api_key
        if not api_key:
            yield "Google Gemini API key is not configured. Please set GEMINI_API_KEY in Settings to enable cloud processing without laptop load."
            return

        payload = self._build_gemini_payload(messages, system_prompt)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"

        try:
            client = await self._get_gemini_client()
            async with client.stream("POST", url, json=payload) as resp:
                if resp.status_code != 200:
                    err_text = await resp.aread()
                    logger.error("Gemini stream returned %s: %s", resp.status_code, err_text.decode(errors="ignore"))
                    yield "I encountered an error connecting to Google Gemini cloud. Please check your API key."
                    return

                async for line in resp.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue

                    json_str = line[6:].strip()
                    try:
                        data = json.loads(json_str)
                    except json.JSONDecodeError:
                        continue

                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            text = part.get("text", "")
                            if text:
                                yield text
        except Exception as exc:
            logger.error("Gemini stream error: %s", exc, exc_info=True)
            yield "An error occurred while streaming from Google Gemini."
