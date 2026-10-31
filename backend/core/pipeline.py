"""
Main voice pipeline orchestrator for BizVoice.
Wired as: VAD -> STT -> LLM -> TTS -> Audio Output
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional, Callable, Awaitable

from core.events import CallState
from core.session import CallSession
from engines.stt_engine import STTEngine
from engines.tts_engine import TTSEngine
from engines.llm_engine import LLMEngine
from engines.vad_engine import VADEngine

logger = logging.getLogger(__name__)


class VoicePipeline:
    """Manages full audio lifecycle for a single voice call."""

    def __init__(
        self,
        session: CallSession,
        stt_engine: STTEngine,
        tts_engine: TTSEngine,
        llm_engine: LLMEngine,
        vad_engine: Optional[VADEngine] = None,
        on_transcript: Optional[Callable[[str, str, bool], Awaitable[None]]] = None,
        on_state_change: Optional[Callable[[CallState], Awaitable[None]]] = None,
    ):
        self.session = session
        self.stt = stt_engine
        self.tts = tts_engine
        self.llm = llm_engine
        self.vad = vad_engine or VADEngine()
        self.on_transcript = on_transcript
        self.on_state_change = on_state_change
        self._is_processing_response = False
        self._current_gen_task: Optional[asyncio.Task] = None

    async def set_state(self, new_state: CallState):
        """Update session state and notify callback."""
        if self.session.state != new_state:
            self.session.state = new_state
            if self.on_state_change:
                await self.on_state_change(new_state)

    async def handle_audio_frame(self, audio_bytes: bytes) -> AsyncGenerator[bytes, None]:
        """
        Process a chunk of incoming raw PCM 16-bit 16kHz mono audio from user.
        Yields synthesized PCM 16-bit 24kHz audio chunks when assistant replies.
        """
        if self.session.is_muted:
            return

        # Check for barge-in / user interruption while assistant is thinking or speaking
        if self.session.state in (CallState.THINKING, CallState.SPEAKING):
            is_speech, conf = self.vad.process_audio_chunk(audio_bytes, 16000)
            if is_speech and conf > 0.6:
                logger.info(f"User interrupted assistant! (Confidence: {conf:.2f})")
                self.session.interrupted = True
                if self._current_gen_task and not self._current_gen_task.done():
                    self._current_gen_task.cancel()
                self._is_processing_response = False
                await self.set_state(CallState.LISTENING)
                self.vad.reset()
                return

        # Feed audio chunk into VAD buffer
        utterance_audio = self.vad.feed_audio(audio_bytes)

        if self.session.state == CallState.IDLE:
            await self.set_state(CallState.LISTENING)

        # If VAD determined the speaker finished speaking
        if utterance_audio:
            logger.info(f"Utterance captured: {len(utterance_audio)} bytes. Transcribing...")
            await self.set_state(CallState.THINKING)

            # 1. Speech-to-Text
            loop = asyncio.get_running_loop()
            lang = getattr(self.session, "language", None)
            transcription = await loop.run_in_executor(None, self.stt.transcribe, utterance_audio, lang)
            transcription = transcription.strip()

            if not transcription:
                logger.info("Empty transcription or noise. Back to listening.")
                await self.set_state(CallState.LISTENING)
                return

            logger.info(f"User transcript: '{transcription}'")
            self.session.add_message("user", transcription)

            if self.on_transcript:
                await self.on_transcript("user", transcription, True)

            # 2. LLM + TTS Streaming Generation
            self.session.interrupted = False
            self._is_processing_response = True

            async for audio_chunk in self._generate_response():
                if self.session.interrupted:
                    logger.info("Response output stopped due to user interruption.")
                    break
                yield audio_chunk

            self._is_processing_response = False
            if not self.session.interrupted:
                await self.set_state(CallState.LISTENING)

    async def handle_user_text(self, text: str) -> AsyncGenerator[bytes, None]:
        """Process user text directly from client SpeechRecognition or prompt without audio STT delay."""
        if not text or not text.strip():
            return
        clean_text = text.strip()
        logger.info(f"Processing direct user text utterance: '{clean_text}'")
        await self.set_state(CallState.THINKING)
        self.session.add_message("user", clean_text)
        if self.on_transcript:
            await self.on_transcript("user", clean_text, True)

        self.session.interrupted = False
        self._is_processing_response = True

        async for audio_chunk in self._generate_response():
            if self.session.interrupted:
                break
            yield audio_chunk

        self._is_processing_response = False
        if not self.session.interrupted:
            await self.set_state(CallState.LISTENING)

    async def _generate_response(self) -> AsyncGenerator[bytes, None]:
        """Query LLM and synthesize response speech sentence by sentence."""
        assistant_reply_full = []
        sentence_buffer = ""

        try:
            # Stream tokens from LLM (Gemini Cloud or Ollama)
            async for token in self.llm.chat_stream(
                messages=self.session.history,
                system_prompt=self.session.system_prompt,
                model=self.session.model,
                api_key=self.session.gemini_api_key,
            ):
                if self.session.interrupted:
                    break

                assistant_reply_full.append(token)
                sentence_buffer += token

                # If sentence boundary reached, synthesize and yield speech
                if any(punct in sentence_buffer for punct in [". ", "? ", "! ", ".\n", "?\n", "!\n"]):
                    sentences = self.tts.split_sentences(sentence_buffer)
                    if len(sentences) > 1:
                        # Synthesize all complete sentences except the last trailing partial
                        for sentence in sentences[:-1]:
                            if self.session.interrupted:
                                break
                            clean_sentence = sentence.strip()
                            if clean_sentence:
                                await self.set_state(CallState.SPEAKING)
                                loop = asyncio.get_running_loop()
                                audio_bytes = await loop.run_in_executor(
                                    None, self.tts.synthesize, clean_sentence, self.session.voice
                                )
                                if audio_bytes and not self.session.interrupted:
                                    yield audio_bytes
                        sentence_buffer = sentences[-1]

            # Synthesize whatever remains in sentence_buffer
            remainder = sentence_buffer.strip()
            if remainder and not self.session.interrupted:
                await self.set_state(CallState.SPEAKING)
                loop = asyncio.get_running_loop()
                audio_bytes = await loop.run_in_executor(
                    None, self.tts.synthesize, remainder, self.session.voice
                )
                if audio_bytes and not self.session.interrupted:
                    yield audio_bytes

            # Save full assistant response to session history
            complete_text = "".join(assistant_reply_full).strip()
            if complete_text:
                logger.info(f"Assistant complete response: '{complete_text}'")
                self.session.add_message("assistant", complete_text)
                if self.on_transcript:
                    await self.on_transcript("assistant", complete_text, True)

        except asyncio.CancelledError:
            logger.info("LLM/TTS generation cancelled.")
        except Exception as e:
            logger.error(f"Error generating pipeline response: {e}", exc_info=True)
            fallback_text = "I'm sorry, I encountered a temporary problem processing that."
            self.session.add_message("assistant", fallback_text)
            if self.on_transcript:
                await self.on_transcript("assistant", fallback_text, True)
            loop = asyncio.get_running_loop()
            err_audio = await loop.run_in_executor(
                None, self.tts.synthesize, fallback_text, self.session.voice
            )
            if err_audio:
                yield err_audio
