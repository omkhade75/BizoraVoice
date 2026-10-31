"""
REST API routes for Bizora Voice platform.
Covers:
- System Health & Diagnostics
- Platform Statistics & Cost-Savings Calculator
- Voice Catalog (Asian & Global Voices)
- Voice Agents CRUD
- Call Session Orchestration
- In-App AI Copilot Chat
- Supplier Outreach with Local Voice Notes (.wav)
"""

from typing import List, Optional
import uuid
import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from database.db import get_db
from database.models import Agent, Call, User, VoiceNoteEnquiry, CopilotMessage
from api.models import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    CallResponse,
    CallDetailResponse,
    HealthResponse,
    EngineStatus,
    StartCallRequest,
    StartCallResponse,
    PlatformStatsResponse,
    SupplierEnquiryRequest,
    SupplierEnquiryResponse,
    CopilotChatRequest,
    CopilotChatResponse,
)
from api.auth import get_current_user_optional, get_current_user_required
from engines.registry import stt_engine, tts_engine, llm_engine, vad_engine
from core.session import session_manager
from services.mailer import SupplierOutreachService, STORAGE_DIR
from services.copilot import CopilotService
from config import get_settings

router = APIRouter(prefix="/api", tags=["Bizora Voice Core"])
settings = get_settings()


# ── Health & Diagnostics ───────────────────────────────────────────────
@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Verify status of local Ollama, STT, TTS, and VAD engines."""
    ollama_ok = await llm_engine.is_reachable()
    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        ollama_reachable=ollama_ok,
        stt_status=EngineStatus(loaded=stt_engine.is_loaded, error=stt_engine.load_error),
        tts_status=EngineStatus(loaded=tts_engine.is_loaded, error=tts_engine.load_error),
        vad_status=EngineStatus(loaded=vad_engine.is_loaded, error=vad_engine.load_error),
        active_sessions_count=len(session_manager.list_sessions()),
    )


# ── Platform Stats & Cost Calculator ───────────────────────────────────
@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(db: AsyncSession = Depends(get_db)):
    """Return platform statistics including total calls, minutes, and estimated savings vs Vapi AI."""
    calls_res = await db.execute(select(Call))
    calls = calls_res.scalars().all()

    total_calls = len(calls)
    total_seconds = sum(c.duration for c in calls)
    total_minutes = round(total_seconds / 60.0, 1)

    agents_res = await db.execute(select(func.count(Agent.id)))
    total_agents = agents_res.scalar() or 0

    # Vapi AI + OpenAI + ElevenLabs averages ~$0.18/minute.
    cost_saved_usd = round(total_minutes * 0.18, 2)
    cost_saved_inr = round(cost_saved_usd * 86.5, 2)

    return PlatformStatsResponse(
        total_calls=total_calls,
        total_minutes=total_minutes,
        total_agents=total_agents,
        total_api_keys=1,
        estimated_cost_saved_usd=cost_saved_usd,
        estimated_cost_saved_inr=cost_saved_inr,
        active_sessions=len(session_manager.list_sessions()),
    )


# ── Asian & Global Voices Catalog ──────────────────────────────────────
@router.get("/voices")
async def list_voices():
    """Return rich voice catalog with language codes, genders, and accents."""
    return settings.VOICE_CATALOG


# ── AI LLM Models Catalog (Google Gemini + Local Ollama) ───────────────
@router.get("/models")
async def list_models():
    """Return available LLM providers and models."""
    return {
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini (Cloud - 0% Laptop Load)",
                "description": "Ultra-fast sub-400ms cloud inference running entirely on Google servers. Zero CPU/GPU usage on your machine.",
                "is_cloud": True,
                "models": [
                    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "recommended": True, "speed": "Sub-300ms", "context": "1M tokens"},
                    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "recommended": False, "speed": "Sub-400ms", "context": "1M tokens"},
                    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "recommended": False, "speed": "Sub-350ms", "context": "1M tokens"},
                ],
            },
            {
                "id": "ollama",
                "name": "Ollama (Self-Hosted / Local GPU)",
                "description": "Runs on local hardware for 100% offline, private, sovereign on-premise execution.",
                "is_cloud": False,
                "models": [
                    {"id": "qwen3.5:4b", "name": "Qwen 3.5 (4B - Optimized Indic)", "recommended": True, "speed": "Local", "context": "32k tokens"},
                    {"id": "qwen2.5:7b", "name": "Qwen 2.5 (7B)", "recommended": False, "speed": "Local", "context": "32k tokens"},
                    {"id": "llama3.2:3b", "name": "Llama 3.2 (3B)", "recommended": False, "speed": "Local", "context": "8k tokens"},
                    {"id": "mistral:7b", "name": "Mistral (7B)", "recommended": False, "speed": "Local", "context": "32k tokens"},
                ],
            },
        ]
    }


# ── System Configuration & Integrations ────────────────────────────────
@router.get("/config/integrations")
async def get_integrations_status():
    """Return status of integrations (Supabase, Gemini, Twilio, GSM Gateway)."""
    gemini_key = settings.gemini_api_key
    gemini_masked = (gemini_key[:4] + "..." + gemini_key[-4:]) if (gemini_key and len(gemini_key) > 8) else ""

    twilio_sid = settings.twilio_account_sid
    twilio_masked = (twilio_sid[:6] + "..." + twilio_sid[-4:]) if (twilio_sid and len(twilio_sid) > 10) else ""

    return {
        "database": {
            "type": "Supabase PostgreSQL",
            "host": "db.vsmlvtrwgkpwxwhatbhx.supabase.co",
            "status": "connected",
        },
        "gemini": {
            "configured": bool(gemini_key),
            "key_preview": gemini_masked,
            "default_model": settings.gemini_model,
        },
        "twilio": {
            "configured": bool(twilio_sid),
            "account_sid_preview": twilio_masked,
            "phone_number": settings.twilio_phone_number,
        },
        "gsm_gateway": {
            "host": settings.sip_gateway_host or "127.0.0.1",
            "port": settings.sip_gateway_port,
            "unlimited_sim_ready": True,
        },
    }


# ── AI Agents CRUD ─────────────────────────────────────────────────────
@router.get("/agents", response_model=List[AgentResponse])
async def list_agents(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List all available AI agents (user agents + public default agents)."""
    if user:
        query = select(Agent).where(
            (Agent.user_id == user.id) | (Agent.is_public == True) | (Agent.user_id == None)
        ).order_by(Agent.created_at.desc())
    else:
        query = select(Agent).order_by(Agent.created_at.desc())

    result = await db.execute(query)
    agents = result.scalars().all()
    return [AgentResponse.model_validate(a) for a in agents]


@router.post("/agents", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_in: AgentCreate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new customized AI voice agent."""
    new_agent = Agent(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=agent_in.name,
        description=agent_in.description,
        system_prompt=agent_in.system_prompt,
        voice=agent_in.voice,
        model=agent_in.model,
        language=agent_in.language,
        greeting_message=agent_in.greeting_message,
        temperature=agent_in.temperature,
        max_duration_seconds=agent_in.max_duration_seconds,
        webhook_url=agent_in.webhook_url,
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    return AgentResponse.model_validate(new_agent)


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Get single agent details by ID."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentResponse.model_validate(agent)


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    update_in: AgentUpdate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing agent."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in update_in.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return AgentResponse.model_validate(agent)


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete an agent."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.delete(agent)
    await db.commit()


# ── Call Session Management ────────────────────────────────────────────
@router.post("/calls/start", response_model=StartCallResponse)
async def start_call_session(
    req: StartCallRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Initialize a call session and return the session ID + WS URL."""
    agent = None
    if req.agent_id:
        agent = await db.get(Agent, req.agent_id)

    system_prompt = (
        req.custom_system_prompt
        or (agent.system_prompt if agent else "You are Bizora Voice, an articulate AI assistant.")
    )
    voice = req.voice or (agent.voice if agent else settings.tts_voice)
    model = agent.model if agent else settings.ollama_model
    agent_name = agent.name if agent else "Bizora Voice Assistant"
    greeting = req.greeting_message or (agent.greeting_message if agent else None)

    session = session_manager.create_session(
        agent_id=req.agent_id,
        system_prompt=system_prompt,
        voice=voice,
        model=model,
        greeting_message=greeting,
    )

    # Persist initial Call record in database
    db_call = Call(
        id=session.call_id,
        user_id=user.id if user else None,
        agent_id=req.agent_id,
        status="active",
        client_type=req.client_type or "web_dashboard",
        started_at=session.started_at,
    )
    db.add(db_call)
    await db.commit()

    return StartCallResponse(
        session_id=session.session_id,
        call_id=session.call_id,
        ws_url=f"/ws/call/{session.session_id}",
        agent_name=agent_name,
        greeting_message=greeting,
    )


@router.get("/calls", response_model=List[CallResponse])
async def list_calls(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List historical calls."""
    query = (
        select(Call)
        .options(selectinload(Call.agent))
        .order_by(desc(Call.started_at))
        .limit(100)
    )
    result = await db.execute(query)
    calls = result.scalars().all()

    resp = []
    for c in calls:
        resp.append(
            CallResponse(
                id=c.id,
                agent_id=c.agent_id,
                agent_name=c.agent.name if c.agent else "Custom Agent",
                started_at=c.started_at,
                ended_at=c.ended_at,
                duration=c.duration,
                status=c.status,
                client_type=c.client_type or "web_dashboard",
                cost_saved_usd=round((c.duration / 60.0) * 0.18, 3),
            )
        )
    return resp


@router.get("/calls/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(call_id: str, db: AsyncSession = Depends(get_db)):
    """Get full details of a specific call including conversation transcript."""
    query = (
        select(Call)
        .options(selectinload(Call.agent), selectinload(Call.messages))
        .where(Call.id == call_id)
    )
    result = await db.execute(query)
    call = result.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    return CallDetailResponse(
        id=call.id,
        agent_id=call.agent_id,
        agent_name=call.agent.name if call.agent else "Custom Agent",
        started_at=call.started_at,
        ended_at=call.ended_at,
        duration=call.duration,
        status=call.status,
        client_type=call.client_type or "web_dashboard",
        cost_saved_usd=round((call.duration / 60.0) * 0.18, 3),
        messages=[
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp,
            }
            for m in call.messages
        ],
    )


# ── In-App AI Copilot Chat ─────────────────────────────────────────────
@router.post("/copilot/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    req: CopilotChatRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Interactive AI Copilot that guides users on how to use Bizora Voice."""
    session_id = req.session_id or f"copilot_{uuid.uuid4().hex[:8]}"

    # Prepare message payload
    if req.messages:
        message_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
    elif req.message:
        message_dicts = [{"role": "user", "content": req.message}]
    else:
        message_dicts = [{"role": "user", "content": "Hello"}]

    user_context = {"user_name": user.name if user else "Developer", "plan": user.tier if user else "pro"}
    if req.context:
        user_context["extra"] = req.context

    reply_text = await CopilotService.chat(message_dicts, user_context=user_context)

    # Save to copilot messages log
    if user:
        last_user_msg = message_dicts[-1]["content"]
        db.add(CopilotMessage(user_id=user.id, session_id=session_id, role="user", content=last_user_msg))
        db.add(CopilotMessage(user_id=user.id, session_id=session_id, role="assistant", content=reply_text))
        await db.commit()

    return CopilotChatResponse(reply=reply_text, session_id=session_id)


# ── Supplier Email & Voice Note Outreach ──────────────────────────────
@router.post("/suppliers/email-with-voicenote", response_model=SupplierEnquiryResponse)
async def send_supplier_email_with_voicenote(
    req: SupplierEnquiryRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an order enquiry in the selected language (e.g. Marathi, Hindi, Gujarati),
    synthesize a voice note using self-hosted Asian models, and dispatch/prepare the email.
    """
    desc = req.items_description
    if not desc:
        parts = []
        if req.quantity:
            parts.append(req.quantity)
        if req.item_name:
            parts.append(f"of {req.item_name}")
        if req.target_price:
            parts.append(f"at target rate {req.target_price}")
        if req.custom_message:
            parts.append(f"({req.custom_message})")
        desc = " ".join(parts) if parts else "Supplies purchase inquiry"

    result = await SupplierOutreachService.dispatch_enquiry(
        supplier_email=req.supplier_email,
        supplier_name=req.supplier_name,
        items_description=desc,
        language=req.language,
        custom_voice_script=req.custom_voice_script,
        smtp_host=req.smtp_host,
        smtp_port=req.smtp_port or 587,
        smtp_user=req.smtp_user,
        smtp_password=req.smtp_password,
    )

    # Persist record in database
    enquiry = VoiceNoteEnquiry(
        user_id=user.id if user else None,
        supplier_name=req.supplier_name,
        supplier_email=req.supplier_email,
        language=req.language,
        items_description=desc,
        email_body=result["email_body"],
        voice_script=result["voice_script"],
        audio_file=result["audio_file"],
        status="sent" if result.get("email_sent") else "generated",
    )
    db.add(enquiry)
    await db.commit()

    result["audio_url"] = f"/api/voicenotes/{result['audio_file']}"
    return SupplierEnquiryResponse(**result)


@router.get("/voicenotes/{filename}")
async def get_voicenote_audio(filename: str):
    """Stream or download a self-hosted voice note audio file."""
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(STORAGE_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Voice note audio not found")
    return FileResponse(file_path, media_type="audio/wav", filename=safe_filename)
