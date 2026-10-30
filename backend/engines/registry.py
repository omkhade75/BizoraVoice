"""
Engine registry holding singletons for STT, TTS, LLM, and VAD.
"""

from engines.stt_engine import STTEngine
from engines.tts_engine import TTSEngine
from engines.llm_engine import LLMEngine
from engines.vad_engine import VADEngine

stt_engine = STTEngine()
tts_engine = TTSEngine()
llm_engine = LLMEngine()
vad_engine = VADEngine()
