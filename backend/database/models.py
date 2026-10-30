"""
Database models for Bizora Voice (BizVoice).

Supports:
- User authentication & multi-tenant isolation
- Customer API Keys (bv_live_...) for Vapi-style programmatic calling
- Multi-lingual AI Voice Agents (Marathi, Hindi, Gujarati, Tamil, English)
- Call session logs & message transcripts
- Automated Voice Note Outreach campaigns
- In-App AI Copilot chat history
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    company = Column(String(100), default="Independent")
    role = Column(String(20), default="developer")  # admin, developer, member
    tier = Column(String(20), default="pro")  # free, pro, enterprise
    credits_minutes = Column(Float, default=120.0)  # Free tier minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="user")
    voicenotes = relationship("VoiceNoteEnquiry", back_populates="user")


class ApiKey(Base):
    """Customer API Keys for Vapi-style programmatic API calls."""
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="Default API Key")
    key_hash = Column(String(64), nullable=False, index=True)
    key_prefix = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    total_calls_handled = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="api_keys")


class Agent(Base):
    """Configurable AI Voice Agents."""
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    system_prompt = Column(
        Text,
        nullable=False,
        default="You are Bizora Voice, a helpful, articulate, and natural voice assistant.",
    )
    voice = Column(String(50), nullable=False, default="mr-IN-AarohiNeural")
    model = Column(String(100), nullable=False, default="qwen3.5:4b")
    language = Column(String(10), nullable=False, default="mr")  # mr, hi, gu, ta, en
    greeting_message = Column(Text, nullable=True)
    temperature = Column(Float, default=0.7)
    max_duration_seconds = Column(Integer, default=600)
    webhook_url = Column(String(255), nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="agents")
    calls = relationship("Call", back_populates="agent", cascade="all, delete-orphan")


class Call(Base):
    """Voice Call Sessions."""
    __tablename__ = "calls"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    api_key_id = Column(String(36), nullable=True)
    started_at = Column(DateTime, default=utc_now)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, default=0)  # in seconds
    status = Column(String(20), default="active")  # active, completed, failed
    client_type = Column(String(30), default="web_dashboard")  # web_dashboard, api_sdk, sip_trunk
    cost_saved_usd = Column(Float, default=0.0)  # Estimated savings vs Vapi AI ($0.15/min)

    user = relationship("User", back_populates="calls")
    agent = relationship("Agent", back_populates="calls")
    messages = relationship(
        "Message",
        back_populates="call",
        cascade="all, delete-orphan",
        order_by="Message.timestamp",
    )


class Message(Base):
    """Individual transcription messages within a call."""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    call_id = Column(String(36), ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now)

    call = relationship("Call", back_populates="messages")


class VoiceNoteEnquiry(Base):
    """Supplier Outreach Voice Notes & Emails."""
    __tablename__ = "voicenote_enquiries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    supplier_name = Column(String(100), nullable=False)
    supplier_email = Column(String(120), nullable=False)
    language = Column(String(10), nullable=False, default="mr")
    items_description = Column(Text, nullable=False)
    email_body = Column(Text, nullable=False)
    voice_script = Column(Text, nullable=False)
    audio_file = Column(String(120), nullable=False)
    status = Column(String(20), default="generated")  # generated, sent, failed
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="voicenotes")


class CopilotMessage(Base):
    """User conversations with the built-in Bizora Copilot."""
    __tablename__ = "copilot_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
