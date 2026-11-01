"""
Session management for active voice calls in Bizora Voice.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
from core.events import CallState

# Pre-configured squad definitions for autonomous multi-agent voice workflows
DEFAULT_SQUADS_CATALOG: Dict[str, Dict[str, Any]] = {
    "squad-inbound-triage": {
        "id": "squad-inbound-triage",
        "name": "Multilingual Inbound Customer Desk",
        "members": [
            {
                "id": "member-1",
                "name": "Receptionist Triage",
                "role": "Initial Greeter & Intent Classifier",
                "language": "Marathi / Hindi / English",
                "voice": "mr-IN-AarohiNeural",
                "transferPhrase": "Let me connect you directly with our Marathi support specialist.",
                "systemPrompt": "You are the front desk triage receptionist for Bizora Voice. Greet the caller warmly, identify their need or language, and inform them that you can transfer them to our Marathi supplier closer or billing specialist.",
                "greetingMessage": "नमस्ते, बिझोरा व्हॉइस फ्रंट डेस्कवर आपले स्वागत आहे! मी तुम्हाला कशी मदत करू शकतो? आपण मराठी, हिंदी किंवा इंग्लिशमध्ये बोलू शकता.",
            },
            {
                "id": "member-2",
                "name": "Marathi Supplier Closer",
                "role": "APMC Pricing & Wholesale Negotiations",
                "language": "Marathi (मराठी)",
                "voice": "mr-IN-ManoharNeural",
                "transferPhrase": "I will transfer you to order logistics to finalize the truck freight.",
                "systemPrompt": "You are a senior wholesale APMC vegetable/commodity trader in Maharashtra. You quote realistic wholesale prices for onions (कांदा - ₹24/kg), potatoes (बटाटा - ₹18/kg), and tomatoes. Offer bulk delivery terms in Marathi.",
                "greetingMessage": "नमस्कार! मी कृषी आणि घाऊक बाजार specialist मनोहर. सांगा, आज कोणत्या मालाचे दर आणि किती क्विंटलचा सौदा करायचा आहे?",
            },
            {
                "id": "member-3",
                "name": "Billing & Account Desk",
                "role": "Payment links & Invoice inquiries",
                "language": "Hindi & English",
                "voice": "hi-IN-SwaraNeural",
                "transferPhrase": "Transferring to payment verification.",
                "systemPrompt": "You are the accounts and billing coordinator. You generate GST invoices, share UPI payment links, and confirm bank transfers for wholesale orders.",
                "greetingMessage": "Welcome to Billing & Accounts. I can send your digital GST invoice via WhatsApp or SMS, and provide UPI QR for instant settlement.",
            },
        ],
    },
    "squad-healthcare": {
        "id": "squad-healthcare",
        "name": "Dental & Hospital Patient Concierge",
        "members": [
            {
                "id": "member-4",
                "name": "Clinic Receptionist",
                "role": "General appointment intake",
                "language": "Hindi / English",
                "voice": "hi-IN-SwaraNeural",
                "transferPhrase": "Connecting you with Dr. Patil care coordinator.",
                "systemPrompt": "You are the receptionist at Dr. Patil Dental Clinic. Help patients book regular dental checkups, cleaning, and routine visits.",
                "greetingMessage": "Dr. Patil Dental Clinic में आपका स्वागत है। क्या आप नया अपॉइंटमेंट बुक करना चाहते हैं या मौजूदा चेकअप के बारे में पूछना चाहते हैं?",
            },
            {
                "id": "member-5",
                "name": "Emergency Dental Triage",
                "role": "Severe toothache & trauma assessment",
                "language": "Hindi / Marathi",
                "voice": "mr-IN-ManoharNeural",
                "transferPhrase": "Escalating to doctor immediately.",
                "systemPrompt": "You are an emergency dental triage officer. Assess pain level, bleeding, root canal emergencies, and schedule urgent priority slots.",
                "greetingMessage": "इमर्जन्सी डेंटल ट्रियाज डेस्क. जर खूप दातदुखी किंवा रक्तस्त्राव असेल तर त्वरित सांगा, आम्ही तत्काळ डॉक्टरांची वेळ देतो.",
            },
        ],
    },
}


class CallSession:
    """Represents an active calling session."""

    def __init__(
        self,
        session_id: str,
        call_id: str,
        agent_id: Optional[str] = None,
        system_prompt: str = "You are a helpful voice assistant.",
        voice: str = "mr-IN-AarohiNeural",
        model: str = "gemini-2.0-flash",
        greeting_message: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        squad_id: Optional[str] = None,
        squad_members: Optional[List[Dict[str, Any]]] = None,
        current_member_idx: int = 0,
    ):
        self.session_id = session_id
        self.call_id = call_id
        self.agent_id = agent_id
        self.system_prompt = system_prompt
        self.voice = voice
        self.model = model
        self.greeting_message = greeting_message
        self.gemini_api_key = gemini_api_key
        self.squad_id = squad_id
        self.squad_members = squad_members or (
            DEFAULT_SQUADS_CATALOG.get(squad_id, {}).get("members", []) if squad_id else []
        )
        self.current_member_idx = current_member_idx
        self.state: CallState = CallState.IDLE
        self.history: List[Dict[str, str]] = []
        self.is_muted: bool = False
        self.started_at: datetime = datetime.now(timezone.utc)
        self.interrupted: bool = False

    def add_message(self, role: str, content: str):
        """Append a message to the conversation history."""
        self.history.append({"role": role, "content": content})

    @property
    def duration_seconds(self) -> int:
        """Calculate call duration in seconds."""
        now = datetime.now(timezone.utc)
        return int((now - self.started_at).total_seconds())


class SessionManager:
    """Manages active sessions in memory."""

    def __init__(self):
        self._sessions: Dict[str, CallSession] = {}

    def create_session(
        self,
        agent_id: Optional[str] = None,
        system_prompt: str = "You are a helpful voice assistant.",
        voice: str = "mr-IN-AarohiNeural",
        model: str = "gemini-2.0-flash",
        greeting_message: Optional[str] = None,
        session_id: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        squad_id: Optional[str] = None,
        squad_members: Optional[List[Dict[str, Any]]] = None,
        current_member_idx: int = 0,
    ) -> CallSession:
        sid = session_id or str(uuid.uuid4())
        call_id = str(uuid.uuid4())
        session = CallSession(
            session_id=sid,
            call_id=call_id,
            agent_id=agent_id,
            system_prompt=system_prompt,
            voice=voice,
            model=model,
            greeting_message=greeting_message,
            gemini_api_key=gemini_api_key,
            squad_id=squad_id,
            squad_members=squad_members,
            current_member_idx=current_member_idx,
        )
        self._sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Optional[CallSession]:
        return self._sessions.get(session_id)

    def remove_session(self, session_id: str) -> Optional[CallSession]:
        return self._sessions.pop(session_id, None)

    def list_sessions(self) -> List[CallSession]:
        return list(self._sessions.values())


# Global singleton session manager
session_manager = SessionManager()
