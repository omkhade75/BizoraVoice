"""
Async database connection and session management for Bizora Voice.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, text
from config import get_settings
from database.models import Base, Agent, User, ApiKey, Workspace, WorkspaceMember, Evaluation
from core.security import hash_password, hash_api_key

settings = get_settings()

_db_url = settings.database_url
_is_pg = "postgresql" in _db_url

connect_args = {}
if _is_pg:
    connect_args["ssl"] = "require"
    connect_args["statement_cache_size"] = 0
    connect_args["timeout"] = 30.0
    connect_args["command_timeout"] = 30.0

# Pool tuning args are only valid for connection-pooled engines (PostgreSQL).
# SQLite uses NullPool internally and rejects these keywords.
_engine_kwargs: dict = dict(
    connect_args=connect_args,
    echo=settings.debug,
    future=True,
)
if _is_pg:
    _engine_kwargs.update(
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_recycle=300,
    )

engine = create_async_engine(_db_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining async db session."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables, run incremental column migrations, and seed default records."""
    async with engine.begin() as conn:
        # Safe column migrations for PostgreSQL
        if "postgresql" in settings.database_url:
            stmts = [
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'ollama';",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'v1.0.0';",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS silence_timeout_ms INTEGER DEFAULT 2000;",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS tools_config TEXT DEFAULT '[]';",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base_id VARCHAR(36);",
                "ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS account_sid VARCHAR(100);",
                "ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS encrypted_auth_token TEXT;",
                "ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT '+1';",
                "ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS stt_ms INTEGER DEFAULT 120;",
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS llm_ms INTEGER DEFAULT 180;",
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS tts_ms INTEGER DEFAULT 80;",
            ]
            for s in stmts:
                try:
                    await conn.execute(text(s))
                except Exception:
                    pass
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # 1. Seed Default Admin User if empty
        user_result = await session.execute(select(User))
        users = user_result.scalars().all()
        admin_user = None

        if not users:
            admin_user = User(
                id="default-admin-user",
                email="admin@bizoravoice.com",
                name="Bizora Admin",
                company="Bizora Technologies",
                hashed_password=hash_password("admin123"),
                role="admin",
                tier="enterprise",
                credits_minutes=9999.0,
            )
            session.add(admin_user)
            await session.flush()

            # Seed Default API Key (bv_live_demo998877665544332211)
            raw_key = "bv_live_demo998877665544332211"
            api_key = ApiKey(
                id="default-api-key-1",
                user_id=admin_user.id,
                name="Primary Production Key",
                key_hash=hash_api_key(raw_key),
                key_prefix="bv_live_demo...",
                is_active=True,
            )
            session.add(api_key)
            await session.flush()

            # Seed Default Workspace
            default_ws = Workspace(
                id="default-workspace-admin",
                name="Default Production Workspace",
                owner_id=admin_user.id,
                tier="enterprise",
            )
            session.add(default_ws)
            ws_member = WorkspaceMember(
                id="default-member-admin",
                workspace_id=default_ws.id,
                user_id=admin_user.id,
                role="owner",
            )
            session.add(ws_member)
        else:
            admin_user = users[0]

        # 2. Seed Default Multilingual Agents if none exist
        agent_result = await session.execute(select(Agent))
        agents = agent_result.scalars().all()
        if not agents:
            agents_to_seed = [
                Agent(
                    id="taj-hotel",
                    user_id=admin_user.id if admin_user else None,
                    name="Taj Residency Front Desk & Concierge",
                    description="Hotel concierge and room reservation AI assistant with real-time room availability booking.",
                    system_prompt=(
                        "You are the Concierge at Taj Residency Mumbai. "
                        "Greet guests politely with 'Namaste! Welcome to Taj Residency. How may I assist you with your reservation today?'. "
                        "Speak in fluent, elegant English or Hindi as requested. Keep responses under 2 sentences for phone clarity."
                    ),
                    voice="en-IN-NeerjaNeural",
                    model=settings.ollama_model,
                    language="en",
                    greeting_message="Namaste! Welcome to Taj Residency. How may I assist you with your reservation today?",
                    is_public=True,
                ),
                Agent(
                    id="marathi-supplier-agent",
                    user_id=admin_user.id if admin_user else None,
                    name="Marathi Supplier Outreach (मराठी पुरवठादार)",
                    description="Specialized in negotiating prices, stock availability, and delivery with Maharashtra suppliers.",
                    system_prompt=(
                        "You are Bizora Voice calling a local supplier in Maharashtra, India. "
                        "You must speak in polite, natural, business Marathi (मराठी). "
                        "Your goal is to check product availability, confirm quantities, verify delivery timeline, and confirm prices. "
                        "Keep answers short and conversational (1-2 sentences) so it sounds like a real phone call. "
                        "Format response with Marathi text for voice output."
                    ),
                    voice="mr-IN-AarohiNeural",
                    model=settings.ollama_model,
                    language="mr",
                    greeting_message="नमस्कार! आम्ही बिझोरा व्हॉइस कडून बोलत आहोत. आपल्याकडे नवीन मालाची उपलब्धता आहे का?",
                    is_public=True,
                ),
                Agent(
                    id="hindi-customer-care",
                    user_id=admin_user.id if admin_user else None,
                    name="Hindi Customer Care (हिन्दी ग्राहक सेवा)",
                    description="Handles customer queries, order status, and assistance in clear conversational Hindi.",
                    system_prompt=(
                        "आप बिज़ोरा वॉइस के आधिकारिक एआई सहायक हैं। "
                        "ग्राहकों से बहुत ही विनम्र, पेशेवर और स्पष्ट हिन्दी में बातचीत करें। "
                        "संक्षिप्त और सटीक उत्तर दें (1-2 वाक्य)।"
                    ),
                    voice="hi-IN-SwaraNeural",
                    model=settings.ollama_model,
                    language="hi",
                    greeting_message="नमस्ते! बिज़ोरा वॉइस सहायता केंद्र में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?",
                    is_public=True,
                ),
                Agent(
                    id="english-enterprise-sales",
                    user_id=admin_user.id if admin_user else None,
                    name="English Enterprise Sales & Support",
                    description="Professional B2B executive voice assistant for client qualification and onboarding.",
                    system_prompt=(
                        "You are Bizora Voice Enterprise Sales Representative. "
                        "Engage with prospective clients, explain voice AI automation capabilities, "
                        "and collect their business requirements concisely."
                    ),
                    voice="af_heart",
                    model=settings.ollama_model,
                    language="en",
                    greeting_message="Hello! Thanks for connecting with Bizora Voice. How can I assist your enterprise today?",
                    is_public=True,
                ),
                Agent(
                    id="gujarati-commerce-agent",
                    user_id=admin_user.id if admin_user else None,
                    name="Gujarati Trade & Commerce (ગુજરાતી વેપાર)",
                    description="Expert in Gujarati business terminology, inventory checks, and dispatch inquiries.",
                    system_prompt=(
                        "તમે બિઝોરા વૉઇસના પ્રતિનિધિ છો. "
                        "ગુજરાતી વેપારીઓ અને સપ્લાયર્સ સાથે આદરપૂર્વક અને વ્યવહારિક ગુજરાતીમાં વાતચીત કરો. "
                        "જવાબો ટૂંકા અને સ્પષ્ટ રાખો."
                    ),
                    voice="gu-IN-DhwaniNeural",
                    model=settings.ollama_model,
                    language="gu",
                    greeting_message="નમસ્તે! બિઝોરા વૉઇસમાં આપનું સ્વાગત છે. આપના ઓર્ડર વિષે શું માહિતી જોઈએ છે?",
                    is_public=True,
                ),
            ]
            session.add_all(agents_to_seed)
        else:
            # Ensure maya (Medicare & Mediclaim Policy Advisory Agent) exists
            maya_agent = await session.get(Agent, "agent_maya_medicare")
            if not maya_agent:
                session.add(
                    Agent(
                        id="agent_maya_medicare",
                        user_id=None,
                        name="maya",
                        description="Medicare & Mediclaim Policy Advisory Agent",
                        system_prompt="You are Maya, a warm, polite, and persuasive health insurance advisory specialist at Bizora Medicare. You speak fluently in Marathi, Hindi, and English, matching the caller. Explain Arogya Sanjeevani (Plan 1: ₹450/mo, ₹5-10L cover) and Family Floater (Plan 2: ₹850/mo, ₹25L cover), 80D tax deductions, and dispatch brochures over WhatsApp.",
                        greeting_message="हॅलो नमस्कार! मी बिझोरा मेडिकेअर कडून माया बोलतेय. आपण दोन मिनिटे बोलू शकता का?",
                        voice="mr-IN-AarohiNeural",
                        model="gemini-2.0-flash",
                        language="mr",
                        provider="google_gemini",
                        is_public=True,
                        temperature=0.7,
                        max_duration_seconds=600,
                    )
                )

        # 3. Seed Default Evaluations if they do not exist
        import json
        default_eval_items = [
            {
                "id": "eval-inbound-greeting",
                "name": "Inbound Politeness & Intent Verification",
                "rubric": json.dumps([
                    {"criterion": "Polite greeting in customer preferred language (Marathi/Hindi)", "weight": 1.0},
                    {"criterion": "Accurate intent capture without conversational loop", "weight": 1.0},
                    {"criterion": "Clear next step or confirmed appointment given", "weight": 1.0},
                ]),
            },
            {
                "id": "eval-supplier-quote",
                "name": "APMC Onion Pricing & Quantity Compliance",
                "rubric": json.dumps([
                    {"criterion": "Quotes correct mandi price range", "weight": 1.0},
                    {"criterion": "Confirms vehicle freight and delivery timeline", "weight": 1.0},
                    {"criterion": "Avoids hallucinations on payment credit terms", "weight": 1.0},
                ]),
            },
        ]
        for item in default_eval_items:
            existing_eval = await session.get(Evaluation, item["id"])
            if not existing_eval:
                session.add(Evaluation(
                    id=item["id"],
                    user_id=admin_user.id if admin_user else None,
                    name=item["name"],
                    rubric=item["rubric"],
                ))

        await session.commit()
