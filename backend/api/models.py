"""
Pydantic schemas for Bizora Voice REST and WebSocket APIs.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── Auth & User Models ──────────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    company: Optional[str] = "Independent"


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    company: str
    role: str
    tier: str
    credits_minutes: float
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── API Key Models ──────────────────────────────────────────────────────
class CreateApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    raw_key: Optional[str] = None  # Only returned once on creation
    is_active: bool
    total_calls_handled: int
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Agent Models ────────────────────────────────────────────────────────
class AgentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: str = Field(..., min_length=1)
    voice: str = Field(default="mr-IN-AarohiNeural")
    model: str = Field(default="qwen3.5:4b")
    language: str = Field(default="mr")
    greeting_message: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_duration_seconds: int = Field(default=600, ge=60, le=3600)
    webhook_url: Optional[str] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    voice: Optional[str] = None
    model: Optional[str] = None
    language: Optional[str] = None
    greeting_message: Optional[str] = None
    temperature: Optional[float] = None
    max_duration_seconds: Optional[int] = None
    webhook_url: Optional[str] = None


class AgentResponse(AgentBase):
    id: str
    user_id: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Call & Message Models ──────────────────────────────────────────────
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class CallResponse(BaseModel):
    id: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: int
    status: str
    client_type: str = "web_dashboard"
    cost_saved_usd: float = 0.0

    class Config:
        from_attributes = True


class CallDetailResponse(CallResponse):
    messages: List[MessageResponse] = []


class StartCallRequest(BaseModel):
    agent_id: Optional[str] = None
    custom_system_prompt: Optional[str] = None
    voice: Optional[str] = None
    language: Optional[str] = None
    greeting_message: Optional[str] = None
    client_type: Optional[str] = "web_dashboard"


class StartCallResponse(BaseModel):
    session_id: str
    call_id: str
    ws_url: str
    agent_name: str
    greeting_message: Optional[str] = None


# ── Supplier Email & Voice Note Outreach ──────────────────────────────
class SupplierEnquiryRequest(BaseModel):
    supplier_email: str
    supplier_name: str
    items_description: Optional[str] = None
    item_name: Optional[str] = None
    quantity: Optional[str] = None
    target_price: Optional[str] = None
    language: str = Field(default="mr", description="mr=Marathi, hi=Hindi, gu=Gujarati, ta=Tamil, en=English")
    custom_voice_script: Optional[str] = None
    custom_message: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None


class SupplierEnquiryResponse(BaseModel):
    status: str
    email_sent: bool
    smtp_message: Optional[str] = None
    supplier_email: str
    supplier_name: str
    language: str
    language_name: str
    voice_used: str
    email_body: str
    voice_script: str
    audio_file: str
    audio_url: str
    created_at: str


# ── Copilot Models ─────────────────────────────────────────────────────
class CopilotMessagePayload(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class CopilotChatRequest(BaseModel):
    messages: Optional[List[CopilotMessagePayload]] = None
    message: Optional[str] = None
    context: Optional[str] = None
    session_id: Optional[str] = None


class CopilotChatResponse(BaseModel):
    reply: str
    session_id: str
    suggested_actions: Optional[List[str]] = None
    code_snippet: Optional[str] = None


# ── Platform Stats & Health ────────────────────────────────────────────
class PlatformStatsResponse(BaseModel):
    total_calls: int
    total_minutes: float
    total_agents: int
    total_api_keys: int
    estimated_cost_saved_usd: float
    estimated_cost_saved_inr: float
    active_sessions: int
    uptime_seconds: int = 86400


class EngineStatus(BaseModel):
    loaded: bool
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    ollama_reachable: bool
    stt_status: EngineStatus
    tts_status: EngineStatus
    vad_status: EngineStatus
    active_sessions_count: int
