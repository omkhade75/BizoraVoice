import base64
import json
import pytest
from fastapi.testclient import TestClient
from main import app
from database.db import init_db


@pytest.mark.asyncio
async def test_twilio_websocket_media_stream():
    await init_db()
    client = TestClient(app)

    with client.websocket_connect("/ws/call/twilio_test_live_call_99") as ws:
        # 1. Twilio handshake
        ws.send_text(json.dumps({
            "event": "connected",
            "protocol": "Call",
            "version": "1.0.0"
        }))

        # 2. Twilio stream start event
        ws.send_text(json.dumps({
            "event": "start",
            "sequenceNumber": "1",
            "streamSid": "MZ_unit_test_stream",
            "start": {
                "streamSid": "MZ_unit_test_stream",
                "callSid": "CA_unit_test_call",
                "customParameters": {
                    "caller": "+919822012345",
                    "agentId": "taj-hotel"
                }
            }
        }))

        # Read ready event and greeting messages
        received_types = []
        received_events = []
        for _ in range(25):
            msg = ws.receive_text()
            data = json.loads(msg)
            if "type" in data:
                received_types.append(data["type"])
            if "event" in data:
                received_events.append(data["event"])
                if data["event"] == "media":
                    assert "payload" in data.get("media", {})
                    assert data["streamSid"] == "MZ_unit_test_stream"
                    break

        assert "media" in received_events
        print("PASS: Twilio received real audio media stream from Agent!")

        # 3. Simulate caller audio packet from mobile phone
        fake_mulaw_chunk = base64.b64encode(b"\xff" * 160).decode("ascii")
        ws.send_text(json.dumps({
            "event": "media",
            "streamSid": "MZ_unit_test_stream",
            "media": {
                "payload": fake_mulaw_chunk
            }
        }))

        # 4. Caller hangs up phone
        ws.send_text(json.dumps({
            "event": "stop",
            "streamSid": "MZ_unit_test_stream"
        }))
