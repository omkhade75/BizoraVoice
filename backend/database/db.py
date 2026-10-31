"""
Async database connection and session management for Bizora Voice.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from config import get_settings
from database.models import Base, Agent, User, ApiKey
from core.security import hash_password, hash_api_key

settings = get_settings()

connect_args = {}
if "postgresql" in settings.database_url:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
)

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
    """Initialize database tables and seed default users, API keys, and voice agents."""
    async with engine.begin() as conn:
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
        else:
            admin_user = users[0]

        # 2. Seed Default Multilingual Agents if none exist
        agent_result = await session.execute(select(Agent))
        agents = agent_result.scalars().all()
        if not agents:
            agents_to_seed = [
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

        await session.commit()
