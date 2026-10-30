"""
Bizora Copilot AI Service.

An intelligent in-app voice/developer copilot that assists customers with:
- Platform onboarding and usage instructions
- Agent prompt generation in multiple languages (Marathi, Hindi, English, Gujarati)
- Generating copy-pasteable SDK code (cURL, React, Next.js, Python, Node.js)
- Cost savings explanations and hardware sizing
- Telephony & SIP configuration guides (Jio, Airtel, GSM gateways)
"""

import logging
from typing import List, Dict, Any, Optional
from engines.registry import llm_engine

logger = logging.getLogger(__name__)

COPILOT_SYSTEM_PROMPT = """You are Bizora Copilot, the AI architect and guide for Bizora Voice — the self-hosted, zero-API-key voice AI calling platform (alternative to Vapi.ai).

Your goal is to guide users, developers, and businesses on how to use Bizora Voice effectively:
1. HOW TO MAKE CALLS:
   - Web Dashboard: Select an agent, hit 'Start Voice Call', talk in your microphone.
   - Programmatic API: Make a POST request to `/api/calls/start` with your API Key, then connect your audio stream to `ws://localhost:8000/ws/call/{session_id}`.
   - Audio specs: Input PCM 16-bit 16kHz mono, Output PCM 16-bit 24kHz mono.

2. ASIAN & REGIONAL VOICES:
   - Marathi: mr-IN-AarohiNeural (Female), mr-IN-ManoharNeural (Male)
   - Hindi: hi-IN-SwaraNeural, hi-IN-MadhurNeural
   - Gujarati: gu-IN-DhwaniNeural, gu-IN-NiranjanNeural
   - Tamil: ta-IN-PallaviNeural, ta-IN-ValluvarNeural
   - English: af_heart, am_adam, en-IN-NeerjaNeural

3. COST ADVANTAGES:
   - Vapi AI + OpenAI + ElevenLabs charges ~$0.15 to $0.25 per minute.
   - Bizora Voice is 100% self-hosted: ₹0 per minute for AI (using faster-whisper + Ollama + neural voices).
   - For phone calls (+91): A single Jio/Airtel SIM with a 4G VoLTE GSM Gateway provides unlimited calls for ₹299/month total!

4. TONE & STYLE:
   - Crisp, polite, encouraging, highly technical when needed, and direct.
   - Provide ready-to-use code snippets in Python, JavaScript/React, or cURL whenever asked.
   - You can speak and reply in English, Marathi (मराठी), Hindi (हिन्दी), or Gujarati if the user asks in those languages.
"""


class CopilotService:
    """Manages conversations with the in-app Bizora Copilot."""

    @staticmethod
    async def chat(
        messages: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Generate response from Copilot using local Ollama model."""
        context_str = ""
        if user_context:
            context_str = f"\nUser Context: {user_context}\n"

        system_instruction = COPILOT_SYSTEM_PROMPT + context_str

        try:
            response = await llm_engine.chat(
                messages=messages,
                system_prompt=system_instruction,
            )
            return response.strip()
        except Exception as e:
            logger.error(f"Copilot error: {e}")
            return (
                "Hello! I am Bizora Copilot. You can use Bizora Voice to create AI voice agents, "
                "make real-time voice calls, generate voice notes for suppliers in Marathi and Hindi, "
                "or integrate via API keys without any external cloud fees. How can I help you right now?"
            )
