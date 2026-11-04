"""
WebSocket endpoint for real-time bidirectional audio streaming in Bizora Voice.
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.events import CallState
from core.session import session_manager
from core.pipeline import VoicePipeline
from core.audio_codecs import twilio_media_to_pcm16k, pcm_to_twilio_media
from database.db import async_session_factory
from database.models import Call, Message, Agent
from engines.registry import stt_engine, tts_engine, llm_engine, vad_engine
from sqlalchemy import select

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

    # Check if this connection is a Twilio Media Stream or a Web Browser
    is_phone_call = (
        session_id.startswith("twilio_")
        or session_id.startswith("inbound_")
        or session_id.startswith("call_")
        or session_id.startswith("CA")
    )
    is_twilio = False
    twilio_stream_sid = None

    async def send_audio_chunk(audio_chunk: bytes):
        nonlocal is_twilio, twilio_stream_sid
        if is_twilio and twilio_stream_sid:
            try:
                # Twilio requires 20ms to 50ms chunks (2400 bytes at 24kHz)
                chunk_size = 2400
                for i in range(0, len(audio_chunk), chunk_size):
                    sub = audio_chunk[i : i + chunk_size]
                    tw_payload = pcm_to_twilio_media(sub, 24000)
                    await send_json_safe({
                        "event": "media",
                        "streamSid": twilio_stream_sid,
                        "media": {"payload": tw_payload},
                    })
                    # Continuous pacing for clean, uninterrupted telephony audio
                    await asyncio.sleep(0.015)
            except Exception as ex:
                logger.error(f"Error sending audio to Twilio: {ex}")
        elif not is_phone_call:
            try:
                await websocket.send_bytes(audio_chunk)
            except Exception:
                pass

    async def on_auto_transfer_callback(target_ref: str):
        if not session.squad_members:
            return
        target_idx = None
        for idx, m in enumerate(session.squad_members):
            if m.get("id") == target_ref or f"member-{idx+1}" == target_ref or str(idx) == target_ref:
                target_idx = idx
                break
        if target_idx is None:
            m_match = re.search(r"\d+", target_ref)
            if m_match:
                n = int(m_match.group(0)) - 1
                if 0 <= n < len(session.squad_members):
                    target_idx = n

        if target_idx is not None and target_idx != session.current_member_idx:
            target_agent = session.squad_members[target_idx]
            session.current_member_idx = target_idx
            session.voice = target_agent.get("voice", session.voice)
            session.system_prompt = target_agent.get("systemPrompt", session.system_prompt)
            logger.info(f"Auto-Handoff: Switched squad to step {target_idx + 1}: {target_agent.get('name')}")

            await send_json_safe({
                "type": "agent_transferred",
                "agent_idx": target_idx,
                "agent_name": target_agent.get("name"),
                "voice": session.voice,
                "transfer_phrase": target_agent.get("transferPhrase", ""),
            })

            # Play new agent's greeting message
            greeting = target_agent.get("greetingMessage")
            if greeting:
                session.add_message("assistant", greeting)
                await on_transcript_callback("assistant", greeting, True)
                try:
                    loop = asyncio.get_running_loop()
                    g_audio = await loop.run_in_executor(None, tts_engine.synthesize, greeting, session.voice)
                    if g_audio:
                        await send_audio_chunk(g_audio)
                except Exception as ex:
                    logger.error(f"Error speaking new agent greeting: {ex}")

    pipeline = VoicePipeline(
        session=session,
        stt_engine=stt_engine,
        tts_engine=tts_engine,
        llm_engine=llm_engine,
        vad_engine=vad_engine,
        on_transcript=on_transcript_callback,
        on_state_change=on_state_callback,
        on_auto_transfer=on_auto_transfer_callback,
    )

    # Initial ready notification for web clients
    await send_json_safe({
        "type": "ready",
        "session_id": session.session_id,
        "call_id": session.call_id,
        "state": CallState.LISTENING.value,
    })

    # Play initial greeting ONLY for web browser (Twilio telephone will trigger on 'start' event)
    if not is_phone_call and session.greeting_message and session.greeting_message.strip():
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
                await send_audio_chunk(greeting_audio)
        except Exception as e:
            logger.error(f"Failed to synthesize initial greeting audio: {e}")

    await pipeline.set_state(CallState.LISTENING)

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                audio_bytes = message["bytes"]
                async for output_chunk in pipeline.handle_audio_frame(audio_bytes):
                    await send_audio_chunk(output_chunk)

            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    event_name = data.get("event")
                    msg_type = data.get("type")

                    # ==========================================
                    # TWILIO TELEPHONY PROTOCOL HANDLERS
                    # ==========================================
                    if event_name == "connected":
                        is_twilio = True
                        logger.info(f"Twilio Media Stream established for session {session_id}")

                    elif event_name == "start":
                        is_twilio = True
                        start_info = data.get("start", {})
                        twilio_stream_sid = data.get("streamSid") or start_info.get("streamSid")
                        custom_params = start_info.get("customParameters", {})
                        req_agent_id = custom_params.get("agentId")
                        caller_phone = custom_params.get("caller")

                        logger.info(
                            f"Twilio call started: stream={twilio_stream_sid}, caller={caller_phone}, agent_id={req_agent_id}"
                        )

                        # Load agent profile if passed
                        if req_agent_id:
                            try:
                                async with async_session_factory() as db:
                                    a_res = await db.execute(select(Agent).where(Agent.id == req_agent_id))
                                    agent_rec = a_res.scalar_one_or_none()
                                    if agent_rec:
                                        session.agent_id = agent_rec.id
                                        session.voice = agent_rec.voice or session.voice
                                        session.system_prompt = agent_rec.system_prompt or session.system_prompt
                                        session.greeting_message = agent_rec.greeting_message or session.greeting_message
                            except Exception as ex:
                                logger.error(f"Error loading agent {req_agent_id} for Twilio: {ex}")

                        # Trigger initial greeting into caller's telephone speaker immediately!
                        initial_greeting = session.greeting_message or "नमस्कार! मी Bizora Voice AI सहाय्यक आहे. मी आपली काय मदत करू शकतो?"
                        logger.info(f"Streaming initial greeting to Twilio telephone line: '{initial_greeting}'")
                        await pipeline.set_state(CallState.SPEAKING)
                        session.add_message("assistant", initial_greeting)
                        await on_transcript_callback("assistant", initial_greeting, True)

                        try:
                            loop = asyncio.get_running_loop()
                            g_audio = await loop.run_in_executor(
                                None, tts_engine.synthesize, initial_greeting, session.voice
                            )
                            if g_audio:
                                await send_audio_chunk(g_audio)
                        except Exception as ex:
                            logger.error(f"Error speaking Twilio initial greeting: {ex}")

                        await pipeline.set_state(CallState.LISTENING)

                    elif event_name == "media":
                        # Inbound audio frame from caller's mobile phone microphone
                        is_twilio = True
                        media_obj = data.get("media", {})
                        b64_payload = media_obj.get("payload")
                        if not twilio_stream_sid:
                            twilio_stream_sid = data.get("streamSid")

                        if b64_payload:
                            pcm_16k = twilio_media_to_pcm16k(b64_payload)
                            async for output_chunk in pipeline.handle_audio_frame(pcm_16k):
                                await send_audio_chunk(output_chunk)

                    elif event_name == "stop":
                        logger.info(f"Twilio call ended by phone caller (Stream {twilio_stream_sid})")
                        break

                    # ==========================================
                    # BROWSER / WEB CLIENT HANDLERS
                    # ==========================================
                    elif msg_type == "mute":
                        session.is_muted = bool(data.get("value", False))
                        await send_json_safe({"type": "info", "message": f"Mute set to {session.is_muted}"})

                    elif msg_type == "end":
                        logger.info("Client requested call termination.")
                        break

                    elif msg_type in ("user_utterance", "text_prompt"):
                        user_text = data.get("text", "").strip()
                        if user_text:
                            logger.info(f"Received user utterance from client: '{user_text}'")

                            # Fast-path squad direct handoff check
                            did_direct_transfer = False
                            if session.squad_members and len(session.squad_members) > 1:
                                u_lower = user_text.lower()
                                cur_idx = session.current_member_idx
                                t_idx = None
                                t_phrase = ""

                                if cur_idx == 0:
                                    if any(w in u_lower for w in ["मराठी", "सप्लायर", "supplier", "कांदा", "बटाटा", "closer", "व्यापारी", "बाजार", "मंडी", "दर", "खरेदी", "माल", "मनोहर"]):
                                        t_idx = 1
                                        t_phrase = "नक्कीच! मी आपल्याला त्वरित आमचे कृषी व घाऊक बाजार तज्ज्ञ मनोहर यांच्याकडे जोडत आहे."
                                    elif any(w in u_lower for w in ["billing", "bill", "बिल", "खाते", "payment", "पेमेंट", "invoice", "पावती"]):
                                        t_idx = 2 if len(session.squad_members) > 2 else 1
                                        t_phrase = "अवश्य! मी आपल्याला त्वरित आमच्या बिलिंग आणि अकाउंट्स डेस्ककडे ट्रान्सफर करत आहे."
                                elif cur_idx == 1:
                                    if any(w in u_lower for w in ["billing", "bill", "बिल", "खाते", "payment", "पेमेंट", "invoice", "पावती", "हिशोब"]):
                                        t_idx = 2 if len(session.squad_members) > 2 else None
                                        t_phrase = "होय, सौद्याची अधिकृत वजन पावती आणि GST देयक तयार करण्यासाठी मी आपल्याला बिलिंग डेस्ककडे जोडत आहे."

                                if t_idx is not None and t_idx != cur_idx and t_idx < len(session.squad_members):
                                    did_direct_transfer = True
                                    target_agent = session.squad_members[t_idx]
                                    session.add_message("user", user_text)
                                    await on_transcript_callback("user", user_text, True)

                                    # Speak transfer phrase in current receptionist voice
                                    await pipeline.set_state(CallState.SPEAKING)
                                    await on_transcript_callback("assistant", f"🔄 [Warm Transfer to {target_agent.get('name')}]: {t_phrase}", True)
                                    try:
                                        loop = asyncio.get_running_loop()
                                        t_audio = await loop.run_in_executor(None, tts_engine.synthesize, t_phrase, session.voice)
                                        if t_audio:
                                            await send_audio_chunk(t_audio)
                                    except Exception as ex:
                                        logger.error(f"Error speaking transfer phrase: {ex}")

                                    # Switch active agent in session
                                    session.current_member_idx = t_idx
                                    session.voice = target_agent.get("voice", session.voice)
                                    session.system_prompt = target_agent.get("systemPrompt", session.system_prompt)

                                    await send_json_safe({
                                        "type": "agent_transferred",
                                        "agent_idx": t_idx,
                                        "agent_name": target_agent.get("name"),
                                        "voice": session.voice,
                                        "transfer_phrase": t_phrase,
                                    })

                                    # Speak new specialist's greeting in new voice
                                    greeting = target_agent.get("greetingMessage") or "नमस्कार! मी कृषी आणि घाऊक बाजार specialist मनोहर. सांगा, आज कोणत्या मालाचा सौदा करायचा आहे?"
                                    session.add_message("assistant", greeting)
                                    await on_transcript_callback("assistant", greeting, True)
                                    try:
                                        loop = asyncio.get_running_loop()
                                        g_audio = await loop.run_in_executor(None, tts_engine.synthesize, greeting, session.voice)
                                        if g_audio:
                                            await send_audio_chunk(g_audio)
                                    except Exception as ex:
                                        logger.error(f"Error speaking specialist greeting: {ex}")

                                    await pipeline.set_state(CallState.LISTENING)

                            if not did_direct_transfer:
                                async for output_chunk in pipeline.handle_user_text(user_text):
                                    await send_audio_chunk(output_chunk)

                    elif msg_type in ("switch_agent", "transfer", "handoff"):
                        agent_name = data.get("agent_name", "Specialist Agent")
                        new_voice = data.get("voice")
                        new_prompt = data.get("system_prompt")
                        transfer_phrase = data.get("transfer_phrase", f"Connecting you with {agent_name}.")
                        target_idx = data.get("agent_idx", None)
                        if target_idx is not None and isinstance(target_idx, int):
                            session.current_member_idx = target_idx
                        if new_voice:
                            session.voice = new_voice
                        if new_prompt:
                            session.system_prompt = new_prompt
                        logger.info(f"Squad live handoff: Switched active agent to '{agent_name}', voice '{new_voice}'")

                        await send_json_safe({
                            "type": "agent_transferred",
                            "agent_idx": session.current_member_idx,
                            "agent_name": agent_name,
                            "voice": session.voice,
                            "transfer_phrase": transfer_phrase,
                        })

                        await pipeline.set_state(CallState.SPEAKING)
                        session.add_message("assistant", transfer_phrase)
                        await on_transcript_callback("assistant", f"🔄 [Warm Transfer to {agent_name}]: {transfer_phrase}", True)

                        try:
                            loop = asyncio.get_running_loop()
                            handoff_audio = await loop.run_in_executor(
                                None, tts_engine.synthesize, transfer_phrase, session.voice
                            )
                            if handoff_audio:
                                await send_audio_chunk(handoff_audio)
                        except Exception as e:
                            logger.error(f"Failed to synthesize handoff cue: {e}")

                        await pipeline.set_state(CallState.LISTENING)

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
