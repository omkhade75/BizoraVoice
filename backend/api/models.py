"""
Pydantic schemas for Bizora Voice REST and WebSocket APIs.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator


# ── Auth & User Models ──────────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    company: Optional[str] = "Independent"


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str


class GoogleAuthRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    name: str = Field(..., min_length=1)
    avatar: Optional[str] = None
    credential: Optional[str] = None
    supabase_uid: Optional[str] = None


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
    provider: str = Field(default="ollama")  # ollama, google_gemini
    language: str = Field(default="mr")
    greeting_message: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_duration_seconds: int = Field(default=600, ge=60, le=3600)
    webhook_url: Optional[str] = None
    version: str = Field(default="v1.0.0")
    is_published: bool = Field(default=False)
    silence_timeout_ms: int = Field(default=2000)
    tools_config: Optional[str] = Field(default="[]")
    knowledge_base_id: Optional[str] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    voice: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    language: Optional[str] = None
    greeting_message: Optional[str] = None
    temperature: Optional[float] = None
    max_duration_seconds: Optional[int] = None
    webhook_url: Optional[str] = None
    version: Optional[str] = None
    is_published: Optional[bool] = None
    silence_timeout_ms: Optional[int] = None
    tools_config: Optional[str] = None
    knowledge_base_id: Optional[str] = None


class AgentResponse(AgentBase):
    id: str
    user_id: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Workspace Models ────────────────────────────────────────────────────
class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    tier: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


# ── Squads Multi-Agent Models ───────────────────────────────────────────
class SquadMemberCreate(BaseModel):
    agent_id: str
    role_description: Optional[str] = "Specialist Agent"
    is_entry_point: bool = False


class SquadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    handoff_rules: Optional[str] = "[]"
    members: List[SquadMemberCreate] = []


class SquadResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    handoff_rules: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    members: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


# ── Tools & Webhooks Models ─────────────────────────────────────────────
class ToolCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)
    tool_type: str = "http_webhook"
    endpoint_url: Optional[str] = None
    method: str = "POST"
    headers: Optional[Union[str, Dict[str, Any]]] = "{}"
    parameters_schema: Optional[Union[str, Dict[str, Any]]] = "{}"
    timeout_seconds: int = 5

    @field_validator("headers", "parameters_schema", mode="before")
    @classmethod
    def serialize_json_fields(cls, v):
        if isinstance(v, (dict, list)):
            import json
            return json.dumps(v)
        return v or "{}"


class ToolResponse(ToolCreate):
    id: str
    user_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ToolTestRequest(BaseModel):
    tool_id: Optional[str] = None
    payload: Dict[str, Any] = {}


class ToolTestResponse(BaseModel):
    status: str
    status_code: int
    execution_time_ms: int
    response_body: Any
    error: Optional[str] = None


# ── Knowledge Base Models ───────────────────────────────────────────────
class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class KnowledgeDocumentResponse(BaseModel):
    id: str
    knowledge_base_id: str
    filename: str
    file_type: str
    chunk_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    total_documents: int
    created_at: datetime
    updated_at: datetime
    documents: List[KnowledgeDocumentResponse] = []

    class Config:
        from_attributes = True


# ── User Provider Settings ──────────────────────────────────────────────
class UserSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None


class UserSettingsResponse(BaseModel):
    has_gemini_key: bool
    has_elevenlabs_key: bool
    has_deepgram_key: bool
    gemini_key_preview: Optional[str] = None


# ── Evaluations Models ──────────────────────────────────────────────────
class EvaluationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    agent_id: Optional[str] = None
    rubric: Optional[Union[str, Dict[str, Any], List[Any]]] = "[]"

    @field_validator("rubric", mode="before")
    @classmethod
    def serialize_rubric(cls, v):
        if isinstance(v, (dict, list)):
            import json
            return json.dumps(v)
        return v or "[]"


class EvaluationResponse(BaseModel):
    id: str
    name: str
    agent_id: Optional[str] = None
    rubric: str
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationRunResponse(BaseModel):
    evaluation_id: str
    score_percentage: float
    passed: bool
    criteria_results: List[Dict[str, Any]]



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
    gemini_api_key: Optional[str] = None


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


# ── Bulk Outbound Calling Campaigns ─────────────────────────────────────
class CampaignContactCreate(BaseModel):
    name: str
    phone_number: str
    variables: Optional[Dict[str, Any]] = None


class CampaignCreate(BaseModel):
    name: str
    agent_id: str
    description: Optional[str] = None
    telephony_provider: str = "simulation"  # twilio, sip_gsm, simulation
    caller_phone: Optional[str] = None
    contacts: List[CampaignContactCreate]


class CampaignContactResponse(BaseModel):
    id: str
    name: str
    phone_number: str
    variables: Optional[Dict[str, Any]] = None
    status: str
    duration: int = 0
    transcript: Optional[str] = None
    call_sid: Optional[str] = None
    attempted_at: Optional[str] = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    status: str
    telephony_provider: str
    caller_phone: Optional[str] = None
    total_contacts: int
    completed_calls: int
    failed_calls: int
    total_duration_sec: int
    cost_saved_usd: float
    cost_saved_inr: float
    created_at: str


class CampaignDetailResponse(CampaignResponse):
    contacts: List[CampaignContactResponse]


# ── Telephony & Twilio Number Import Models ─────────────────────────────
class TwilioCredentialsRequest(BaseModel):
    account_sid: str = Field(..., min_length=10)
    auth_token: str = Field(..., min_length=10)


class TwilioAvailableNumber(BaseModel):
    phone_number: str
    friendly_name: str
    provider_sid: str
    capabilities: Dict[str, bool] = {"voice": True, "sms": True}
    already_imported: bool = False


class TwilioImportRequest(BaseModel):
    account_sid: Optional[str] = None
    auth_token: Optional[str] = None
    numbers: List[Dict[str, Any]]  # List of { phone_number, friendly_name, provider_sid }
    agent_id: Optional[str] = None
    auto_configure_webhook: bool = True


class PhoneNumberCreate(BaseModel):
    phone_number: str
    friendly_name: Optional[str] = None
    provider: str = "twilio"  # twilio or gsm_gateway
    agent_id: Optional[str] = None


class PhoneNumberUpdate(BaseModel):
    friendly_name: Optional[str] = None
    agent_id: Optional[str] = None
    status: Optional[str] = None


class PhoneNumberResponse(BaseModel):
    id: str
    phone_number: str
    friendly_name: Optional[str] = None
    provider: str
    provider_sid: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    capabilities: str
    status: str
    webhook_url: Optional[str] = None
    created_at: str

