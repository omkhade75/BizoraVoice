"""
Telephony and Twilio Number Import Router for Bizora Voice.

Enables:
1. Direct Twilio Number Import (BYOT - Bring Your Own Twilio)
   - Live query of all Twilio account phone numbers
   - 1-click import into Bizora Voice
   - Automated Voice Webhook binding
2. 4G VoLTE GSM Gateway Management (Jio/Airtel ₹299/mo Unlimited SIM)
3. Inbound Call Routing: Maps incoming caller phone numbers directly to assigned AI Agents.
"""

import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Form, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database.db import get_db
from database.models import PhoneNumber, Agent, User
from api.models import (
    TwilioCredentialsRequest,
    TwilioAvailableNumber,
    TwilioImportRequest,
    PhoneNumberCreate,
    PhoneNumberUpdate,
    PhoneNumberResponse,
)
from api.auth import get_current_user_optional
from services.telephony import TelephonyService
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api/telephony", tags=["Telephony & Phone Numbers"])


def _to_phone_response(pn: PhoneNumber, agent_name: Optional[str] = None) -> PhoneNumberResponse:
    return PhoneNumberResponse(
        id=pn.id,
        phone_number=pn.phone_number,
        friendly_name=pn.friendly_name,
        provider=pn.provider,
        provider_sid=pn.provider_sid,
        agent_id=pn.agent_id,
        agent_name=agent_name or (pn.agent.name if pn.agent else "None (Unassigned)"),
        capabilities=pn.capabilities or '{"voice": true}',
        status=pn.status,
        webhook_url=pn.webhook_url,
        created_at=pn.created_at.isoformat() if pn.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.get("/numbers", response_model=List[PhoneNumberResponse])
async def list_numbers(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List all registered numbers (Twilio imported and GSM gateways)."""
    query = select(PhoneNumber).options(selectinload(PhoneNumber.agent)).order_by(desc(PhoneNumber.created_at))
    if user:
        query = query.where(PhoneNumber.user_id == user.id)

    res = await db.execute(query)
    numbers = res.scalars().all()
    return [_to_phone_response(n) for n in numbers]


@router.post("/twilio/query-numbers", response_model=List[TwilioAvailableNumber])
async def query_twilio_numbers(
    payload: TwilioCredentialsRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Live query Twilio account for all incoming phone numbers.
    Flags whether each number is already imported in Bizora Voice.
    """
    acc_sid = payload.account_sid.strip()
    auth_token = payload.auth_token.strip()

    raw_numbers = await TelephonyService.fetch_twilio_account_numbers(acc_sid, auth_token)

    # Check which numbers are already in local database
    existing_res = await db.execute(select(PhoneNumber.phone_number))
    existing_nums = set(existing_res.scalars().all())

    results = []
    for item in raw_numbers:
        num = item["phone_number"]
        results.append(
            TwilioAvailableNumber(
                phone_number=num,
                friendly_name=item.get("friendly_name") or num,
                provider_sid=item.get("provider_sid") or f"PN_{num}",
                capabilities=item.get("capabilities", {"voice": True, "sms": True}),
                already_imported=num in existing_nums,
            )
        )
    return results


@router.post("/twilio/import", response_model=List[PhoneNumberResponse])
async def import_twilio_numbers(
    payload: TwilioImportRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Import selected Twilio numbers into Bizora Voice and optionally bind webhook.
    """
    acc_sid = payload.account_sid or settings.twilio_account_sid
    auth_token = payload.auth_token or settings.twilio_auth_token
    agent_id = payload.agent_id
    user_id = user.id if user else None

    # Check if agent exists
    agent = None
    if agent_id:
        agent_res = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = agent_res.scalar_one_or_none()

    imported: List[PhoneNumber] = []
    webhook_url = f"{settings.public_base_url}/api/telephony/twilio/incoming"

    for num_item in payload.numbers:
        phone_no = num_item.get("phone_number")
        if not phone_no:
            continue

        friendly = num_item.get("friendly_name") or phone_no
        prov_sid = num_item.get("provider_sid")

        # Check existing
        existing = await db.execute(select(PhoneNumber).where(PhoneNumber.phone_number == phone_no))
        rec = existing.scalar_one_or_none()
        if not rec:
            rec = PhoneNumber(
                user_id=user_id,
                agent_id=agent.id if agent else None,
                phone_number=phone_no,
                friendly_name=friendly,
                provider="twilio",
                provider_sid=prov_sid,
                capabilities='{"voice": true, "sms": true}',
                status="active",
                webhook_url=webhook_url,
            )
            db.add(rec)
            await db.flush()
        else:
            rec.friendly_name = friendly
            rec.provider_sid = prov_sid
            if agent:
                rec.agent_id = agent.id
            rec.webhook_url = webhook_url
            rec.status = "active"

        # Auto-configure webhook on Twilio
        if payload.auto_configure_webhook and acc_sid and auth_token and prov_sid:
            await TelephonyService.configure_twilio_webhook(acc_sid, auth_token, prov_sid, webhook_url)

        imported.append(rec)

    await db.commit()
    for item in imported:
        await db.refresh(item)

    return [_to_phone_response(n, agent.name if agent else None) for n in imported]


@router.post("/numbers", response_model=PhoneNumberResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_number(
    payload: PhoneNumberCreate,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Register a custom number (e.g. 4G VoLTE GSM Gateway SIM or SIP trunk)."""
    existing = await db.execute(select(PhoneNumber).where(PhoneNumber.phone_number == payload.phone_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This phone number is already registered")

    agent = None
    if payload.agent_id:
        agent_res = await db.execute(select(Agent).where(Agent.id == payload.agent_id))
        agent = agent_res.scalar_one_or_none()

    new_num = PhoneNumber(
        user_id=user.id if user else None,
        agent_id=agent.id if agent else None,
        phone_number=payload.phone_number,
        friendly_name=payload.friendly_name or payload.phone_number,
        provider=payload.provider,
        capabilities='{"voice": true, "sms": false}',
        status="active",
    )
    db.add(new_num)
    await db.commit()
    await db.refresh(new_num)
    return _to_phone_response(new_num, agent.name if agent else None)


@router.put("/numbers/{number_id}", response_model=PhoneNumberResponse)
async def update_number(
    number_id: str,
    payload: PhoneNumberUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update assigned AI agent, friendly name, or active status."""
    res = await db.execute(select(PhoneNumber).options(selectinload(PhoneNumber.agent)).where(PhoneNumber.id == number_id))
    num_rec = res.scalar_one_or_none()
    if not num_rec:
        raise HTTPException(status_code=404, detail="Phone number not found")

    if payload.friendly_name is not None:
        num_rec.friendly_name = payload.friendly_name
    if payload.agent_id is not None:
        num_rec.agent_id = payload.agent_id if payload.agent_id != "" else None
    if payload.status is not None:
        num_rec.status = payload.status

    await db.commit()
    await db.refresh(num_rec)
    return _to_phone_response(num_rec)


@router.delete("/numbers/{number_id}")
async def delete_number(
    number_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Remove a phone number from Bizora Voice."""
    res = await db.execute(select(PhoneNumber).where(PhoneNumber.id == number_id))
    num_rec = res.scalar_one_or_none()
    if not num_rec:
        raise HTTPException(status_code=404, detail="Phone number not found")

    await db.delete(num_rec)
    await db.commit()
    return {"success": True, "message": f"Number {num_rec.phone_number} removed"}


@router.post("/twilio/incoming")
async def handle_twilio_incoming_call(
    From: str = Form(...),
    To: str = Form(...),
    CallSid: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio Voice Webhook Handler.
    When a customer dials an imported Twilio number, Twilio invokes this endpoint.
    Bizora Voice looks up the assigned AI Agent and streams bi-directional audio.
    """
    logger.info(f"Incoming call from {From} to {To} (CallSid: {CallSid})")

    # Find assigned agent for this number
    num_res = await db.execute(select(PhoneNumber).where(PhoneNumber.phone_number == To))
    phone_rec = num_res.scalar_one_or_none()

    agent_id = phone_rec.agent_id if phone_rec and phone_rec.agent_id else None
    if not agent_id:
        # Fallback to first available agent
        first_agent = await db.execute(select(Agent).limit(1))
        a = first_agent.scalar_one_or_none()
        agent_id = a.id if a else "default"

    session_id = f"inbound_{CallSid or datetime.now().strftime('%Y%m%d%H%M%S')}"
    base_ws = settings.public_base_url.replace("http://", "ws://").replace("https://", "wss://")
    stream_url = f"{base_ws}/ws/call/{session_id}"

    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{stream_url}">
            <Parameter name="sessionId" value="{session_id}"/>
            <Parameter name="agentId" value="{agent_id}"/>
            <Parameter name="caller" value="{From}"/>
        </Stream>
    </Connect>
</Response>"""

    return Response(content=twiml_response, media_type="application/xml")
