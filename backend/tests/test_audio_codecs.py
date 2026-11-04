import base64
from core.audio_codecs import (
    mulaw_to_pcm16,
    pcm16_to_mulaw,
    resample_8k_to_16k,
    resample_pcm_to_8k,
    twilio_media_to_pcm16k,
    pcm_to_twilio_media,
)


def test_codec_encode_decode():
    raw_pcm = b"\x00\x00\x10\x27\xf0\xd8\x00\x00" * 80  # 640 bytes
    b64 = pcm_to_twilio_media(raw_pcm, 24000)
    assert isinstance(b64, str) and len(b64) > 0

    pcm_16k = twilio_media_to_pcm16k(b64)
    assert isinstance(pcm_16k, bytes) and len(pcm_16k) > 0


def test_twilio_media_packet():
    # Simulate an incoming Twilio 8kHz mu-law audio chunk (160 bytes = 20ms)
    fake_mulaw = b"\xff" * 160
    b64_in = base64.b64encode(fake_mulaw).decode("ascii")
    pcm_out = twilio_media_to_pcm16k(b64_in)
    # 160 bytes mu-law (8kHz) -> 320 bytes PCM (8kHz) -> 640 bytes PCM (16kHz)
    assert len(pcm_out) == 640
