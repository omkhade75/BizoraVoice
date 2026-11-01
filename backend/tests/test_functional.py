"""
Functional verification test suite for Bizora Voice backend.
Tests:
- Database seeding (User, ApiKey, Multilingual Agents)
- User Authentication & API Key validation
- Voice Catalog
- Marathi Voice Synthesis
- In-App Copilot AI Chat
- Outbound Campaign DB Flow
- Telephony Outbound Dialer
"""

import asyncio
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import init_db, async_session_factory, engine
from database.models import Agent, User, ApiKey, Campaign, CampaignContact
from engines.registry import tts_engine
from core.security import verify_password
from services.copilot import CopilotService
from services.telephony import TelephonyService
from sqlalchemy import select
import uuid


class TestBizoraVoiceBackend(unittest.TestCase):

    def test_full_platform_suite(self):
        async def _run():
            await init_db()

            # 1. Users and API Keys
            async with async_session_factory() as session:
                res = await session.execute(select(User).where(User.email == "admin@bizoravoice.com"))
                user = res.scalars().first()
                self.assertIsNotNone(user, "Default admin user must exist")
                self.assertTrue(verify_password("admin123", user.hashed_password))

                key_res = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
                keys = key_res.scalars().all()
                self.assertGreaterEqual(len(keys), 1, "Admin user must have an API key")
                print(f"\n[PASS] Verified User: {user.email} (Role: {user.role}, Tier: {user.tier})")
                print(f"[PASS] Active API Key prefix: {keys[0].key_prefix}")

            # 2. Multilingual Agents
            async with async_session_factory() as session:
                res = await session.execute(select(Agent))
                agents = res.scalars().all()
                self.assertGreaterEqual(len(agents), 4, "Must have at least 4 default agents")
                agent_map = {a.language: a.name for a in agents}
                self.assertIn("mr", agent_map, "Marathi agent must be present")
                self.assertIn("hi", agent_map, "Hindi agent must be present")
                self.assertIn("en", agent_map, "English agent must be present")
                print(f"[PASS] Multilingual Agents Verified: {agent_map}")

            # 3. Copilot Service
            messages = [{"role": "user", "content": "How do I embed voice call into my website?"}]
            reply = await CopilotService.chat(messages)
            self.assertIsNotNone(reply)
            self.assertGreater(len(reply), 20)
            print(f"[PASS] Copilot Reply Verified ({len(reply)} chars): {reply[:80]}...")

            # 4. Voice Synthesis (TTS)
            audio = tts_engine.synthesize("नमस्कार! बिझोरा व्हॉइस मध्ये आपले स्वागत आहे.", voice="mr-IN-AarohiNeural")
            self.assertIsNotNone(audio)
            self.assertGreater(len(audio), 500)
            print(f"[PASS] Marathi Audio Synthesized: {len(audio)} bytes")

            # 5. Campaigns and Contacts Flow
            camp_id = str(uuid.uuid4())
            async with async_session_factory() as session:
                camp = Campaign(
                    id=camp_id,
                    name="Unit Test Agro Outreach",
                    agent_id="marathi-supplier-agent",
                    status="draft",
                    telephony_provider="simulation",
                    total_contacts=2,
                )
                session.add(camp)
                c1 = CampaignContact(campaign_id=camp_id, name="Test Farmer 1", phone_number="+919800000001", status="pending")
                c2 = CampaignContact(campaign_id=camp_id, name="Test Farmer 2", phone_number="+919800000002", status="pending")
                session.add_all([c1, c2])
                await session.commit()

                check = await session.execute(select(Campaign).where(Campaign.id == camp_id))
                saved_camp = check.scalar_one_or_none()
                self.assertIsNotNone(saved_camp)
                self.assertEqual(saved_camp.total_contacts, 2)
                print(f"[PASS] Campaign and Contacts DB Flow Verified: {saved_camp.name}")

            # 6. Telephony Outbound Dialer
            res = await TelephonyService.dial_number(
                to_number="+919822099999",
                from_number="+918000000000",
                provider="simulation",
                variables={"item": "Turmeric", "amount": "₹3,200"},
            )
            self.assertTrue(res["success"])
            self.assertEqual(res["status"], "completed")
            self.assertIn("SIM_", res["call_sid"])
            print(f"[PASS] Outbound Dialer Simulation Verified: {res['call_sid']}")

            await engine.dispose()

        asyncio.run(_run())


if __name__ == "__main__":
    unittest.main()
