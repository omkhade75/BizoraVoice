"""
Text-to-Speech engine supporting Kokoro (offline) and Edge-TTS (multilingual Indic / Marathi).

Generates PCM 16-bit 24kHz mono audio from text.
Supports both English voices (af_heart, etc.) and Indian regional voices (mr-IN-AarohiNeural, mr-IN-ManoharNeural).
"""

from __future__ import annotations

import asyncio
import io
import logging
import re
import threading
from collections.abc import AsyncGenerator

import numpy as np
import soundfile as sf
import edge_tts

from config import get_settings

logger = logging.getLogger(__name__)


class TTSEngine:
    """Hybrid TTS engine supporting Kokoro and Edge-TTS for Marathi/Indic languages."""

    def __init__(self) -> None:
        self._pipeline = None
        self._lock = threading.Lock()
        self._loaded = False
        self._load_error: str | None = None
        settings = get_settings()
        self._voice = settings.tts_voice
        self._sample_rate = settings.tts_sample_rate

    @property
    def is_loaded(self) -> bool:
        return True

    @property
    def load_error(self) -> str | None:
        return self._load_error

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    @staticmethod
    def float32_to_pcm16(audio_np: np.ndarray) -> bytes:
        """Convert float32 numpy array to raw PCM 16-bit bytes."""
        audio_clamped = np.clip(audio_np, -1.0, 1.0)
        return (audio_clamped * 32767).astype(np.int16).tobytes()

    def load_model(self) -> None:
        """Attempt to load the kokoro TTS pipeline for offline English voices."""
        if self._loaded:
            return

        with self._lock:
            if self._loaded:
                return
            try:
                from kokoro import KPipeline
                logger.info("Loading kokoro TTS pipeline (lang_code='a')...")
                self._pipeline = KPipeline(lang_code="a")
                self._loaded = True
                self._load_error = None
                logger.info("TTS pipeline loaded successfully")
            except Exception as exc:
                self._load_error = str(exc)
                logger.warning("Kokoro offline TTS not available (%s), Edge-TTS will be used as primary engine.", exc)

    def _is_edge_voice(self, voice: str) -> bool:
        """Check if the voice should be handled by Edge-TTS (e.g. Marathi or Neural voices)."""
        return "Neural" in voice or voice.startswith(
            ("mr-", "hi-", "gu-", "ta-", "te-", "bn-", "en-IN-", "kn-", "ml-")
        )

    def synthesize_edge(self, text: str, voice: str) -> bytes:
        """Synthesize speech using Edge-TTS (with gTTS fallback) and return raw PCM 16-bit 24kHz audio bytes."""
        async def _run():
            try:
                comm = edge_tts.Communicate(text, voice, connect_timeout=15)
                raw_audio = bytearray()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        raw_audio.extend(chunk["data"])
                
                if raw_audio:
                    data, sr = sf.read(io.BytesIO(raw_audio), dtype="int16")
                    return data.tobytes()
            except Exception as e:
                logger.warning(f"Edge-TTS stream error: {e}, falling back to gTTS")

            # Fallback to gTTS for Marathi, Hindi, and Indian English
            try:
                from gtts import gTTS
                lang = "mr" if voice.startswith("mr") else ("hi" if voice.startswith("hi") else "en")
                tts_obj = gTTS(text=text, lang=lang, slow=False)
                mp3_buf = io.BytesIO()
                tts_obj.write_to_fp(mp3_buf)
                mp3_buf.seek(0)
                data, sr = sf.read(mp3_buf, dtype="int16")
                return data.tobytes()
            except Exception as ge:
                logger.warning(f"gTTS fallback also failed: {ge}")
                return b""

        def _run_in_isolated_thread():
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            try:
                return new_loop.run_until_complete(asyncio.wait_for(_run(), timeout=12.0))
            finally:
                new_loop.close()

        try:
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                fut = pool.submit(_run_in_isolated_thread)
                return fut.result(timeout=14.0)
        except Exception as exc:
            logger.warning("Edge-TTS synthesis timed out or failed: %s, returning empty audio", exc)
            return b""

    _SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?|।])\s+")

    @classmethod
    def split_sentences(cls, text: str) -> list[str]:
        """Split text into sentences for chunked streaming."""
        sentences = cls._SENTENCE_SPLIT_RE.split(text.strip())
        return [s.strip() for s in sentences if s.strip()]

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        """Synthesize text to raw PCM 16-bit 24kHz mono audio."""
        if not text or not text.strip():
            return b""

        voice = voice or self._voice

        # 1. If voice is Marathi / Indic Neural voice, try Edge-TTS
        if self._is_edge_voice(voice):
            edge_audio = self.synthesize_edge(text, voice)
            if edge_audio:
                return edge_audio

        # 2. Otherwise try Kokoro
        if self._pipeline is None and not self._loaded:
            self.load_model()

        if self._pipeline is not None:
            try:
                audio_parts: list[np.ndarray] = []
                for result in self._pipeline(text, voice=voice):
                    if result.audio is not None and len(result.audio) > 0:
                        audio_parts.append(result.audio)

                if audio_parts:
                    combined = np.concatenate(audio_parts)
                    audio_clamped = np.clip(combined, -1.0, 1.0)
                    return (audio_clamped * 32767).astype(np.int16).tobytes()
            except Exception as exc:
                logger.error("Kokoro TTS failed: %s, falling back to Edge-TTS", exc)

        # Final attempt: try default Indian Edge-TTS voice if custom voice failed
        if not self._is_edge_voice(voice):
            edge_audio = self.synthesize_edge(text, "en-IN-NeerjaNeural")
            if edge_audio:
                return edge_audio

        logger.warning("TTS synthesis produced no audio for text: %s", text[:40])
        return b""

    def synthesize_wav(self, text: str, voice: str | None = None) -> bytes:
        """Synthesize text and return complete WAV bytes with header for browser playback."""
        pcm_bytes = self.synthesize(text, voice)
        if not pcm_bytes:
            return b""
        audio_int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
        buf = io.BytesIO()
        sf.write(buf, audio_int16, self._sample_rate, format="WAV", subtype="PCM_16")
        buf.seek(0)
        return buf.read()

    async def synthesize_stream(
        self, text: str, voice: str | None = None
    ) -> AsyncGenerator[bytes, None]:
        """Yield PCM audio chunks sentence-by-sentence."""
        if not text or not text.strip():
            return

        sentences = self.split_sentences(text)
        if not sentences:
            sentences = [text.strip()]

        for sentence in sentences:
            audio_bytes = self.synthesize(sentence, voice=voice)
            if audio_bytes:
                yield audio_bytes
