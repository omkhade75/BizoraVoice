"""
Voice Activity Detection engine using Silero VAD.

Detects speech segments in PCM audio using the Silero VAD model loaded
via torch.hub.  Provides per-chunk speech detection and confidence scoring,
plus a stateful buffer that accumulates speech frames and signals when a
complete utterance is ready for transcription.
"""

from __future__ import annotations

import logging
import threading
import time

import numpy as np

from config import get_settings

logger = logging.getLogger(__name__)


class VADEngine:
    """Silero VAD engine with speech buffering."""

    def __init__(self) -> None:
        self._model = None
        self._lock = threading.Lock()
        self._loaded = False
        self._load_error: str | None = None

        settings = get_settings()
        self._threshold = settings.vad_threshold
        self._min_speech_ms = settings.vad_min_speech_ms
        self._min_silence_ms = settings.vad_min_silence_ms
        self._sample_rate = settings.input_sample_rate

        # ── stateful buffer ─────────────────────────────────────────────
        self._speech_buffer: bytearray = bytearray()
        self._is_speaking = False
        self._silence_start: float | None = None
        self._speech_start: float | None = None

    # ── public state ────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def load_error(self) -> str | None:
        return self._load_error

    # ── model lifecycle ─────────────────────────────────────────────────

    def load_model(self) -> None:
        """Load Silero VAD model via torch.hub (thread-safe, idempotent)."""
        if self._loaded:
            return

        with self._lock:
            if self._loaded:
                return
            try:
                import torch

                logger.info("Loading Silero VAD model...")
                model, utils = torch.hub.load(
                    repo_or_dir="snakers4/silero-vad",
                    model="silero_vad",
                    force_reload=False,
                    trust_repo=True,
                )
                self._model = model
                self._get_speech_timestamps = utils[0]  # noqa: unused but available
                self._loaded = True
                self._load_error = None
                logger.info("VAD model loaded successfully")
            except Exception as exc:
                self._load_error = str(exc)
                logger.error("Failed to load VAD model: %s", exc, exc_info=True)

    def _ensure_model(self):
        """Return the model, loading it if necessary."""
        if not self._loaded:
            self.load_model()
        if self._model is None:
            raise RuntimeError(f"VAD model not available: {self._load_error}")
        return self._model

    # ── audio helpers ───────────────────────────────────────────────────

    @staticmethod
    def pcm_bytes_to_float32(audio_bytes: bytes) -> np.ndarray:
        """Convert raw PCM 16-bit mono bytes to float32 in [-1, 1]."""
        audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
        return audio_int16.astype(np.float32) / 32768.0

    # ── detection ───────────────────────────────────────────────────────

    def is_speech(self, audio_chunk: bytes, sample_rate: int = 16000) -> bool:
        """Check whether an audio chunk contains speech.

        Args:
            audio_chunk: Raw PCM 16-bit mono audio.
            sample_rate: Sample rate of the audio (default 16000).

        Returns:
            True if speech is detected above the configured threshold.
        """
        _, confidence = self.process_audio_chunk(audio_chunk, sample_rate)
        return confidence >= self._threshold

    def process_audio_chunk(
        self, audio_chunk: bytes, sample_rate: int = 16000
    ) -> tuple[bool, float]:
        """Process an audio chunk and return speech status + confidence.

        The Silero VAD model expects chunks of specific sizes (512 samples
        for 16kHz). If the input is smaller we pad, if larger we take the
        last window.

        Args:
            audio_chunk: Raw PCM 16-bit mono audio.
            sample_rate: Audio sample rate.

        Returns:
            Tuple of (is_speech, confidence_float).
        """
        audio_np = self.pcm_bytes_to_float32(audio_chunk)
        rms = float(np.sqrt(np.mean(audio_np**2))) if len(audio_np) > 0 else 0.0

        confidence = 0.0
        try:
            import torch
            model = self._ensure_model()
            window_size = 512 if sample_rate == 16000 else 256
            if len(audio_np) < window_size:
                padded = np.zeros(window_size, dtype=np.float32)
                padded[: len(audio_np)] = audio_np
                audio_np_window = padded
            elif len(audio_np) > window_size:
                audio_np_window = audio_np[-window_size:]
            else:
                audio_np_window = audio_np

            tensor = torch.from_numpy(audio_np_window)
            confidence = model(tensor, sample_rate).item()
        except Exception as exc:
            # Energy-based RMS voice fallback if Silero model is not cached
            confidence = min(1.0, rms * 15.0)

        is_speech = confidence >= self._threshold or rms > 0.02
        return is_speech, confidence

    # ── stateful buffering ──────────────────────────────────────────────

    def reset(self) -> None:
        """Reset the internal speech buffer and state."""
        self._speech_buffer = bytearray()
        self._is_speaking = False
        self._silence_start = None
        self._speech_start = None
        # Reset the Silero model's internal hidden state
        if self._model is not None:
            try:
                self._model.reset_states()
            except Exception:
                pass

    def feed_audio(self, audio_chunk: bytes) -> bytes | None:
        """Feed audio and return buffered speech when an utterance ends.

        Call this repeatedly with small audio chunks (e.g. 20-30ms).
        When the engine detects that the speaker has stopped (silence
        duration exceeds `vad_min_silence_ms`), it returns the complete
        buffered speech audio. Otherwise returns None.

        Args:
            audio_chunk: Raw PCM 16-bit 16kHz mono audio.

        Returns:
            Complete speech segment bytes when utterance ends, else None.
        """
        speech_detected = self.is_speech(audio_chunk, self._sample_rate)
        now = time.monotonic()

        if speech_detected:
            self._silence_start = None

            if not self._is_speaking:
                # Speech just started
                self._is_speaking = True
                self._speech_start = now
                self._speech_buffer = bytearray()
                logger.debug("Speech started")

            self._speech_buffer.extend(audio_chunk)
            return None

        # No speech detected
        if self._is_speaking:
            # Still buffer audio during short silence gaps within speech
            self._speech_buffer.extend(audio_chunk)

            if self._silence_start is None:
                self._silence_start = now

            silence_duration_ms = (now - self._silence_start) * 1000

            if silence_duration_ms >= self._min_silence_ms:
                # Enough silence — utterance is complete
                speech_duration_ms = (now - (self._speech_start or now)) * 1000

                if speech_duration_ms >= self._min_speech_ms:
                    result = bytes(self._speech_buffer)
                    logger.debug(
                        "Utterance complete: %.0fms speech, %d bytes",
                        speech_duration_ms,
                        len(result),
                    )
                    self.reset()
                    return result
                else:
                    # Too short — discard as noise
                    logger.debug(
                        "Discarding short utterance: %.0fms", speech_duration_ms
                    )
                    self.reset()
                    return None

        return None
