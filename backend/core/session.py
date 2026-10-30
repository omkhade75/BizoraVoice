"""
Session management for active voice calls in Bizora Voice.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid
from core.events import CallState


class CallSession:
    """Represents an active calling session."""

    def __init__(
        self,
        session_id: str,
        call_id: str,
        agent_id: Optional[str] = None,
        system_prompt: str = "You are a helpful voice assistant.",
        voice: str = "mr-IN-AarohiNeural",
        model: str = "qwen3.5:4b",
        greeting_message: Optional[str] = None,
    ):
        self.session_id = session_id
        self.call_id = call_id
        self.agent_id = agent_id
        self.system_prompt = system_prompt
        self.voice = voice
        self.model = model
        self.greeting_message = greeting_message
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
        model: str = "qwen3.5:4b",
        greeting_message: Optional[str] = None,
        session_id: Optional[str] = None,
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
