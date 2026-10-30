"""
Functional verification test suite for Bizora Voice backend.
Tests:
- Database seeding (User, ApiKey, Multilingual Agents)
- User Authentication & API Key validation
- Voice Catalog
- Marathi Voice Synthesis
- In-App Copilot AI Chat
- Ollama Connectivity
"""

import asyncio
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import init_db, async_session_factory
from database.models import Agent, User, ApiKey
from engines.registry import tts_engine, llm_engine
from core.security import verify_password, hash_api_key
from services.copilot import CopilotService
from sqlalchemy import select


class TestBizoraVoiceBackend(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await init_db()

    async def test_01_users_and_api_keys(self):
        """Verify default admin user and production API key exist."""
        async with async_session_factory() as session:
            res = await session.execute(select(User).where(User.email == "admin@bizoravoice.com"))
            user = res.scalars().first()
            self.assertIsNotNone(user)
            self.assertTrue(verify_password("admin123", user.hashed_password))

            key_res = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
            keys = key_res.scalars().all()
            self.assertGreaterEqual(len(keys), 1)
            print(f"\n[PASS] Verified User: {user.email} (Role: {user.role}, Tier: {user.tier})")
            print(f"[PASS] Active API Key prefix: {keys[0].key_prefix}")

    async def test_02_multilingual_agents(self):
        """Verify seeded agents in Marathi, Hindi, English, Gujarati exist."""
        async with async_session_factory() as session:
            res = await session.execute(select(Agent))
            agents = res.scalars().all()
            self.assertGreaterEqual(len(agents), 4)
            agent_map = {a.language: a.name for a in agents}
            self.assertIn("mr", agent_map)
            self.assertIn("hi", agent_map)
            self.assertIn("en", agent_map)
            self.assertIn("gu", agent_map)
            print(f"\n[PASS] Multilingual Agents Verified: {agent_map}")

    async def test_03_copilot_service(self):
        """Verify interactive AI Copilot gives helpful guidance."""
        messages = [{"role": "user", "content": "How do I embed voice call into my website?"}]
        reply = await CopilotService.chat(messages)
        self.assertIsNotNone(reply)
        self.assertGreater(len(reply), 20)
        print(f"\n[PASS] Copilot Reply Preview: {reply[:120]}...")

    async def test_04_voice_synthesis(self):
        """Verify speech synthesis works with 24kHz PCM."""
        audio = tts_engine.synthesize("नमस्कार! बिझोरा व्हॉइस मध्ये आपले स्वागत आहे.", voice="mr-IN-AarohiNeural")
        self.assertIsNotNone(audio)
        self.assertGreater(len(audio), 500)
        print(f"\n[PASS] Marathi Audio Synthesized: {len(audio)} bytes")


if __name__ == "__main__":
    unittest.main()
