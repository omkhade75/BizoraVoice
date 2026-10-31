"""
Speech-to-Text engine using faster-whisper.

Provides transcription of raw PCM 16-bit 16kHz mono audio using the
faster-whisper library (CTranslate2 backend). The model is loaded lazily
on first use so the server can start even if the model isn't cached yet.
"""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

import numpy as np

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

from config import get_settings

logger = logging.getLogger(__name__)


class STTEngine:
    """Faster-whisper speech-to-text engine with lazy model loading."""

    def __init__(self) -> None:
        self._model: WhisperModel | None = None
        self._lock = threading.Lock()
        self._loaded = False
        self._load_error: str | None = None
        settings = get_settings()
        self._model_size = settings.whisper_model_size
        self._device = settings.whisper_device
        self._compute_type = settings.whisper_compute_type

    # ── public state ────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        """Whether the model has been successfully loaded."""
        return self._loaded

    @property
    def load_error(self) -> str | None:
        """Error message if model loading failed, else None."""
        return self._load_error

    # ── model lifecycle ─────────────────────────────────────────────────

    def _resolve_device(self) -> tuple[str, str]:
        """Determine device and compute type, auto-detecting CUDA."""
        device = self._device
        compute_type = self._compute_type

        if device == "auto":
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                device = "cpu"

        if compute_type == "auto":
            compute_type = "float16" if device == "cuda" else "int8"

        return device, compute_type

    def load_model(self) -> None:
        """Load the whisper model (thread-safe, idempotent)."""
        if self._loaded:
            return

        with self._lock:
            if self._loaded:
                return
            try:
                from faster_whisper import WhisperModel

                device, compute_type = self._resolve_device()
                logger.info(
                    "Loading faster-whisper model=%s device=%s compute=%s",
                    self._model_size, device, compute_type,
                )
                self._model = WhisperModel(
                    self._model_size,
                    device=device,
                    compute_type=compute_type,
                )
                self._loaded = True
                self._load_error = None
                logger.info("STT model loaded successfully")
            except Exception as exc:
                self._load_error = str(exc)
                logger.error("Failed to load STT model: %s", exc, exc_info=True)

    def _ensure_model(self) -> "WhisperModel":
        """Return the model, loading it if necessary."""
        if not self._loaded:
            self.load_model()
        if self._model is None:
            raise RuntimeError(f"STT model not available: {self._load_error}")
        return self._model

    # ── audio helpers ───────────────────────────────────────────────────

    @staticmethod
    def pcm_bytes_to_float32(audio_bytes: bytes) -> np.ndarray:
        """Convert raw PCM 16-bit mono bytes to a float32 numpy array in [-1, 1].

        Args:
            audio_bytes: Raw PCM 16-bit signed little-endian mono audio.

        Returns:
            Float32 numpy array normalized to [-1.0, 1.0].
        """
        audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
        return audio_int16.astype(np.float32) / 32768.0

    # ── transcription ───────────────────────────────────────────────────

    def transcribe(self, audio_bytes: bytes, language: str | None = None) -> str:
        """Transcribe a complete audio segment.

        Args:
            audio_bytes: Raw PCM 16-bit 16kHz mono audio bytes.
            language: Optional language code (e.g. 'mr', 'hi', 'gu', 'en').

        Returns:
            Transcribed text string (empty string if nothing detected).
        """
        if len(audio_bytes) < 1600:  # less than 50ms of audio
            return ""

        try:
            model = self._ensure_model()
            audio_np = self.pcm_bytes_to_float32(audio_bytes)

            segments, info = model.transcribe(
                audio_np,
                beam_size=3,
                language=language if language and language != "all" else None,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=400,
                    speech_pad_ms=150,
                ),
            )
            text_parts: list[str] = []
            for segment in segments:
                stripped = segment.text.strip()
                if stripped:
                    text_parts.append(stripped)

            return " ".join(text_parts)
        except Exception as exc:
            logger.warning("Transcription unavailable on current instance: %s", exc)
            return ""

    def transcribe_stream(self, audio_chunk: bytes) -> str:
        """Transcribe a VAD-buffered audio chunk.

        This is functionally identical to `transcribe` but is named
        separately to clarify its role in streaming pipelines where
        the VAD engine accumulates audio and hands complete speech
        segments to this method.

        Args:
            audio_chunk: Raw PCM 16-bit 16kHz mono audio bytes
                         representing a complete speech segment.

        Returns:
            Transcribed text string.
        """
        return self.transcribe(audio_chunk)
