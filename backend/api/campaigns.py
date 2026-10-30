"""
Campaign API Router for Bizora Voice.

Provides:
- CSV/JSON Contact list import
- Outbound calling campaign creation
- Live execution (Twilio / GSM Gateway / Simulation)
- Per-contact status, durations, and dynamic variable transcripts
- Multi-tenant isolation (user campaigns partitioned securely)
"""

import json
from typing import List, Optional
from datetime import datetime, timezone
import asyncio

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database.db import get_db, async_session_factory
from database.models import Campaign, CampaignContact, Agent, User
from api.models import (
    CampaignCreate,
    CampaignResponse,
    CampaignDetailResponse,
    CampaignContactResponse,
)
from api.auth import get_current_user_optional
from services.telephony import TelephonyService

router = APIRouter(prefix="/api/campaigns", tags=["Outbound Calling Campaigns"])


def _to_campaign_response(camp: Campaign, agent_name: Optional[str] = None) -> CampaignResponse:
    usd = camp.cost_saved_usd or 0.0
    return CampaignResponse(
        id=camp.id,
        name=camp.name,
        description=camp.description,
        agent_id=camp.agent_id,
        agent_name=agent_name or (camp.agent.name if camp.agent else "Unknown Agent"),
        status=camp.status,
        telephony_provider=camp.telephony_provider,
        caller_phone=camp.caller_phone,
        total_contacts=camp.total_contacts,
        completed_calls=camp.completed_calls,
        failed_calls=camp.failed_calls,
        total_duration_sec=camp.total_duration_sec or 0,
        cost_saved_usd=round(usd, 2),
        cost_saved_inr=round(usd * 86.5, 2),
        created_at=camp.created_at.isoformat() if camp.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """List all campaigns for current user or platform."""
    query = select(Campaign).options(selectinload(Campaign.agent)).order_by(desc(Campaign.created_at))
    if user:
        query = query.where(Campaign.user_id == user.id)

    res = await db.execute(query)
    campaigns = res.scalars().all()
    return [_to_campaign_response(c) for c in campaigns]


@router.post("", response_model=CampaignDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreate,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new outbound calling campaign with an uploaded contact list.
    Supports dynamic variables (e.g. {{name}}, {{amount}}, {{item}}).
    """
    # 1. Verify Agent exists
    agent_res = await db.execute(select(Agent).where(Agent.id == payload.agent_id))
    agent = agent_res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Selected AI Voice Agent not found")

    user_id = user.id if user else None

    # 2. Create Campaign Record
    campaign = Campaign(
        user_id=user_id,
        agent_id=agent.id,
        name=payload.name,
        description=payload.description,
        status="draft",
        telephony_provider=payload.telephony_provider,
        caller_phone=payload.caller_phone or "+918000000000",
        total_contacts=len(payload.contacts),
        completed_calls=0,
        failed_calls=0,
        total_duration_sec=0,
        cost_saved_usd=0.0,
    )
    db.add(campaign)
    await db.flush()

    # 3. Add Contacts
    contact_responses = []
    for c in payload.contacts:
        vars_str = json.dumps(c.variables) if c.variables else "{}"
        contact = CampaignContact(
            campaign_id=campaign.id,
            name=c.name.strip(),
            phone_number=c.phone_number.strip(),
            variables=vars_str,
            status="pending",
        )
        db.add(contact)
        await db.flush()

        contact_responses.append(
            CampaignContactResponse(
                id=contact.id,
                name=contact.name,
                phone_number=contact.phone_number,
                variables=c.variables,
                status=contact.status,
                duration=0,
            )
        )

    await db.commit()

    base_resp = _to_campaign_response(campaign, agent_name=agent.name)
    return CampaignDetailResponse(
        **base_resp.model_dump(),
        contacts=contact_responses,
    )


@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
async def get_campaign(
    campaign_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get campaign status, aggregates, and full contact list with transcripts."""
    res = await db.execute(
        select(Campaign)
        .options(selectinload(Campaign.agent), selectinload(Campaign.contacts))
        .where(Campaign.id == campaign_id)
    )
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contacts_resp = []
    for c in camp.contacts:
        vars_dict = {}
        try:
            if c.variables:
                vars_dict = json.loads(c.variables)
        except Exception:
            pass

        contacts_resp.append(
            CampaignContactResponse(
                id=c.id,
                name=c.name,
                phone_number=c.phone_number,
                variables=vars_dict,
                status=c.status,
                duration=c.duration,
                transcript=c.transcript,
                call_sid=c.call_sid,
                attempted_at=c.attempted_at.isoformat() if c.attempted_at else None,
            )
        )

    base_resp = _to_campaign_response(camp)
    return CampaignDetailResponse(
        **base_resp.model_dump(),
        contacts=contacts_resp,
    )


@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Launch batch outbound dialing for all pending contacts in the campaign.
    Runs asynchronously in the background.
    """
    res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if camp.status == "running":
        return {"status": "already_running", "message": "Campaign is already in progress."}

    camp.status = "running"
    await db.commit()

    # Launch background task
    background_tasks.add_task(
        TelephonyService.run_campaign_batch,
        campaign_id=campaign_id,
        db_session_factory=async_session_factory,
        delay_between_calls=0.8,
    )

    return {
        "status": "started",
        "campaign_id": campaign_id,
        "message": f"Outbound calling launched for campaign '{camp.name}'. Calls are dialing via [{camp.telephony_provider}].",
    }


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Pause an active campaign."""
    res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp.status = "paused"
    await db.commit()
    return {"status": "paused", "campaign_id": campaign_id}


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a campaign and all associated contacts."""
    res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await db.delete(camp)
    await db.commit()
    return {"status": "deleted", "campaign_id": campaign_id}
