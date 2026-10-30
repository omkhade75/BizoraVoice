"""
Event system for BizVoice pipeline.
"""

from enum import Enum
from typing import Callable, Any, Dict, List
import asyncio
import logging

logger = logging.getLogger(__name__)


class CallState(str, Enum):
    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"


class EventEmitter:
    """Simple async event emitter for pipeline communication."""

    def __init__(self):
        self._handlers: Dict[str, List[Callable[..., Any]]] = {}

    def on(self, event_name: str, handler: Callable[..., Any]):
        """Register an event listener."""
        if event_name not in self._handlers:
            self._handlers[event_name] = []
        self._handlers[event_name].append(handler)

    def off(self, event_name: str, handler: Callable[..., Any]):
        """Deregister an event listener."""
        if event_name in self._handlers:
            self._handlers[event_name] = [h for h in self._handlers[event_name] if h != handler]

    async def emit(self, event_name: str, *args, **kwargs):
        """Emit an event asynchronously to all listeners."""
        handlers = self._handlers.get(event_name, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(*args, **kwargs)
                else:
                    handler(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error executing handler for event {event_name}: {e}")
