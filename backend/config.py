"""
Bizora Voice (BizVoice) configuration module.

Loads settings from environment variables with sensible defaults.
Uses pydantic-settings for validation and type coercion.
"""

from functools import lru_cache
from typing import ClassVar, Dict, Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ──────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    log_level: str = "info"

    # ── Security & Authentication ───────────────────────────────────────
    jwt_secret: str = "bizora_voice_super_secure_production_jwt_secret_key_2026_x99"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ── CORS ────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── Ollama LLM ──────────────────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3.5:4b"
    ollama_timeout: int = 120

    # ── STT (faster-whisper) ────────────────────────────────────────────
    whisper_model_size: str = "base"
    whisper_device: str = "auto"
    whisper_compute_type: str = "auto"

    # ── TTS ─────────────────────────────────────────────────────────────
    tts_voice: str = "mr-IN-AarohiNeural"
    tts_sample_rate: int = 24000

    # ── VAD (Silero) ────────────────────────────────────────────────────
    vad_threshold: float = 0.5
    vad_min_speech_ms: int = 250
    vad_min_silence_ms: int = 700

    # ── Audio ───────────────────────────────────────────────────────────
    input_sample_rate: int = 16000
    output_sample_rate: int = 24000

    # ── Database ────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./bizvoice.db"

    # ── Telephony & Outbound Calling ────────────────────────────────────
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    sip_gateway_host: str = ""
    sip_gateway_port: int = 5060
    sip_gateway_user: str = ""
    sip_gateway_password: str = ""
    public_base_url: str = "http://localhost:8000"

    # ── Session ─────────────────────────────────────────────────────────
    max_sessions: int = 100
    session_timeout_seconds: int = 3600

    # ── Asian & Global Voice Catalog ────────────────────────────────────
    VOICE_CATALOG: ClassVar[List[Dict[str, Any]]] = [
        # Marathi
        {"id": "mr-IN-AarohiNeural", "name": "Aarohi (आरोगी)", "language": "Marathi", "code": "mr", "gender": "Female", "accent": "Maharashtra, India", "type": "neural"},
        {"id": "mr-IN-ManoharNeural", "name": "Manohar (मनोहर)", "language": "Marathi", "code": "mr", "gender": "Male", "accent": "Maharashtra, India", "type": "neural"},
        # Hindi
        {"id": "hi-IN-SwaraNeural", "name": "Swara (स्वरा)", "language": "Hindi", "code": "hi", "gender": "Female", "accent": "India", "type": "neural"},
        {"id": "hi-IN-MadhurNeural", "name": "Madhur (मधुर)", "language": "Hindi", "code": "hi", "gender": "Male", "accent": "India", "type": "neural"},
        # Gujarati
        {"id": "gu-IN-DhwaniNeural", "name": "Dhwani (ધ્વનિ)", "language": "Gujarati", "code": "gu", "gender": "Female", "accent": "Gujarat, India", "type": "neural"},
        {"id": "gu-IN-NiranjanNeural", "name": "Niranjan (નિરંજન)", "language": "Gujarati", "code": "gu", "gender": "Male", "accent": "Gujarat, India", "type": "neural"},
        # Tamil
        {"id": "ta-IN-PallaviNeural", "name": "Pallavi (பல்லவி)", "language": "Tamil", "code": "ta", "gender": "Female", "accent": "Tamil Nadu, India", "type": "neural"},
        {"id": "ta-IN-ValluvarNeural", "name": "Valluvar (வள்ளுவர்)", "language": "Tamil", "code": "ta", "gender": "Male", "accent": "Tamil Nadu, India", "type": "neural"},
        # Telugu
        {"id": "te-IN-ShrutiNeural", "name": "Shruti (శ్రుతి)", "language": "Telugu", "code": "te", "gender": "Female", "accent": "Andhra / Telangana", "type": "neural"},
        {"id": "te-IN-MohanNeural", "name": "Mohan (మోహన్)", "language": "Telugu", "code": "te", "gender": "Male", "accent": "Andhra / Telangana", "type": "neural"},
        # Bengali
        {"id": "bn-IN-TanishaaNeural", "name": "Tanishaa (তানিশা)", "language": "Bengali", "code": "bn", "gender": "Female", "accent": "West Bengal, India", "type": "neural"},
        # Indian English
        {"id": "en-IN-NeerjaNeural", "name": "Neerja", "language": "Indian English", "code": "en-IN", "gender": "Female", "accent": "India", "type": "neural"},
        {"id": "en-IN-PrabhatNeural", "name": "Prabhat", "language": "Indian English", "code": "en-IN", "gender": "Male", "accent": "India", "type": "neural"},
        # Global English (Kokoro / Neural)
        {"id": "af_heart", "name": "Heart (US Soft)", "language": "English", "code": "en", "gender": "Female", "accent": "US", "type": "neural"},
        {"id": "af_bella", "name": "Bella (US Expressive)", "language": "English", "code": "en", "gender": "Female", "accent": "US", "type": "neural"},
        {"id": "am_adam", "name": "Adam (US Professional)", "language": "English", "code": "en", "gender": "Male", "accent": "US", "type": "neural"},
        {"id": "am_michael", "name": "Michael (US Executive)", "language": "English", "code": "en", "gender": "Male", "accent": "US", "type": "neural"},
    ]

    @property
    def AVAILABLE_VOICES(self) -> list[str]:
        return [v["id"] for v in self.VOICE_CATALOG]

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"debug", "info", "warning", "error", "critical"}
        if v.lower() not in allowed:
            raise ValueError(f"log_level must be one of {allowed}")
        return v.lower()


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()
