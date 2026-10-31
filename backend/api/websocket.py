"""
WebSocket endpoint for real-time bidirectional audio streaming in Bizora Voice.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.events import CallState
from core.session import session_manager
from core.pipeline import VoicePipeline
from database.db import async_session_factory
from database.models import Call, Message
from engines.registry import stt_engine, tts_engine, llm_engine, vad_engine

logger = logging.getLogger(__name__)
ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/call/{session_id}")
async def call_websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint handling real-time audio transport.
    - Incoming binary: Raw PCM 16-bit 16kHz mono audio from browser mic.
    - Outgoing binary: Raw PCM 16-bit 24kHz mono audio from TTS.
    - Incoming text: JSON control commands (mute, end, ping).
    - Outgoing text: JSON events (transcript, state change, errors).
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected for session {session_id}")

    session = session_manager.get_session(session_id)
    if not session:
        session = session_manager.create_session(session_id=session_id)

    async def send_json_safe(payload: dict):
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception:
            pass

    async def on_transcript_callback(role: str, text: str, is_final: bool = True):
        # 1. Send live transcript to client
        await send_json_safe({
            "type": "transcript",
            "role": role,
            "text": text,
            "is_final": is_final,
        })
        # 2. Persist transcript message to database
        try:
            async with async_session_factory() as db:
                msg = Message(
                    call_id=session.call_id,
                    role=role,
                    content=text,
                    timestamp=datetime.now(timezone.utc),
                )
                db.add(msg)
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to persist message to DB: {e}")

    async def on_state_callback(state: CallState):
        await send_json_safe({
            "type": "state",
            "state": state.value,
        })

    pipeline = VoicePipeline(
        session=session,
        stt_engine=stt_engine,
        tts_engine=tts_engine,
        llm_engine=llm_engine,
        vad_engine=vad_engine,
        on_transcript=on_transcript_callback,
        on_state_change=on_state_callback,
    )

    # Initial ready notification
    await send_json_safe({
        "type": "ready",
        "session_id": session.session_id,
        "call_id": session.call_id,
        "state": CallState.LISTENING.value,
    })

    # Play initial greeting if configured
    if session.greeting_message and session.greeting_message.strip():
        greeting = session.greeting_message.strip()
        logger.info(f"Speaking initial greeting: '{greeting}'")
        await pipeline.set_state(CallState.SPEAKING)
        session.add_message("assistant", greeting)
        await on_transcript_callback("assistant", greeting, True)

        try:
            loop = asyncio.get_running_loop()
            greeting_audio = await loop.run_in_executor(
                None, tts_engine.synthesize, greeting, session.voice
            )
            if greeting_audio:
                await websocket.send_bytes(greeting_audio)
        except Exception as e:
            logger.error(f"Failed to synthesize initial greeting audio: {e}")

    await pipeline.set_state(CallState.LISTENING)

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                audio_bytes = message["bytes"]
                async for output_chunk in pipeline.handle_audio_frame(audio_bytes):
                    try:
                        await websocket.send_bytes(output_chunk)
                    except Exception as e:
                        logger.error(f"Error sending audio chunk: {e}")
                        break

            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")

                    if msg_type == "mute":
                        session.is_muted = bool(data.get("value", False))
                        await send_json_safe({"type": "info", "message": f"Mute set to {session.is_muted}"})

                    elif msg_type == "end":
                        logger.info("Client requested call termination.")
                        break

                    elif msg_type == "ping":
                        await send_json_safe({"type": "pong"})

                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON: {message['text']}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {e}", exc_info=True)
    finally:
        # Finalize Call record in database
        try:
            async with async_session_factory() as db:
                call = await db.get(Call, session.call_id)
                if call:
                    call.ended_at = datetime.now(timezone.utc)
                    call.duration = session.duration_seconds
                    call.status = "completed"
                    call.cost_saved_usd = round((session.duration_seconds / 60.0) * 0.18, 3)
                    await db.commit()
        except Exception as e:
            logger.error(f"Failed to update Call record on close: {e}")

        session_manager.remove_session(session_id)
        logger.info(f"Session {session_id} cleaned up.")
