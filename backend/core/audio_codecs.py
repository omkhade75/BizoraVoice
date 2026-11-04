"""
Audio Codecs and Resampling for Telephony & Twilio Media Streams.
Zero-dependency, pure Python implementation compatible with Python 3.11, 3.12, 3.13+.
"""

import base64
import struct
from typing import List

# G.711 mu-law constants
BIAS = 0x84
CLIP = 32635

# Build static 256-entry lookup table for ultra-fast mu-law decoding (8-bit mu-law -> 16-bit linear PCM)
_DECODE_TABLE: List[int] = []
for _i in range(256):
    _u = ~_i & 0xFF
    _sign = _u & 0x80
    _exponent = (_u >> 4) & 0x07
    _mantissa = _u & 0x0F
    _sample = ((_mantissa << 3) + BIAS) << _exponent
    _sample -= BIAS
    if not _sign:
        _sample = -_sample
    _DECODE_TABLE.append(_sample)


def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
    """Decode 8-bit G.711 mu-law bytes to 16-bit signed linear PCM (little endian)."""
    pcm = bytearray(len(mulaw_bytes) * 2)
    for idx, b in enumerate(mulaw_bytes):
        s = _DECODE_TABLE[b]
        pcm[idx * 2] = s & 0xFF
        pcm[idx * 2 + 1] = (s >> 8) & 0xFF
    return bytes(pcm)


def pcm16_to_mulaw(pcm_bytes: bytes) -> bytes:
    """Encode 16-bit signed linear PCM (little endian) to 8-bit G.711 mu-law bytes."""
    num_samples = len(pcm_bytes) // 2
    if num_samples == 0:
        return b""
    samples = struct.unpack(f"<{num_samples}h", pcm_bytes)
    out = bytearray(num_samples)
    for i, sample in enumerate(samples):
        sign = 0x80 if sample < 0 else 0x00
        if sample < 0:
            sample = -sample
        if sample > CLIP:
            sample = CLIP
        sample += BIAS
        exponent = 7
        for exp in range(8):
            if sample <= (0x80 << (exp + 1)) - 1:
                exponent = exp
                break
        mantissa = (sample >> (exponent + 3)) & 0x0F
        out[i] = ~(sign | (exponent << 4) | mantissa) & 0xFF
    return bytes(out)


def resample_8k_to_16k(pcm_8k: bytes) -> bytes:
    """Upsample 8kHz 16-bit linear PCM to 16kHz linear PCM by 2x sample duplication."""
    num_samples = len(pcm_8k) // 2
    if num_samples == 0:
        return b""
    samples = struct.unpack(f"<{num_samples}h", pcm_8k)
    out: List[int] = []
    for s in samples:
        out.extend((s, s))
    return struct.pack(f"<{len(out)}h", *out)


def resample_pcm_to_8k(pcm_bytes: bytes, source_rate: int = 24000) -> bytes:
    """
    Downsample 16-bit linear PCM from source_rate (typically 24kHz or 16kHz) to 8kHz for telephony.
    Uses clean integer step decimation.
    """
    num_samples = len(pcm_bytes) // 2
    if num_samples == 0:
        return b""
    samples = struct.unpack(f"<{num_samples}h", pcm_bytes)
    step = max(1, source_rate // 8000)  # 24k -> 3, 16k -> 2
    downsampled = samples[::step]
    return struct.pack(f"<{len(downsampled)}h", *downsampled)


def twilio_media_to_pcm16k(base64_payload: str) -> bytes:
    """Decode Twilio inbound base64 mu-law audio to 16kHz linear PCM bytes for VAD/STT."""
    mulaw_bytes = base64.b64decode(base64_payload)
    pcm_8k = mulaw_to_pcm16(mulaw_bytes)
    return resample_8k_to_16k(pcm_8k)


def pcm_to_twilio_media(pcm_bytes: bytes, source_rate: int = 24000) -> str:
    """Convert agent TTS linear PCM audio (24kHz or 16kHz) to Twilio outbound base64 mu-law."""
    pcm_8k = resample_pcm_to_8k(pcm_bytes, source_rate=source_rate)
    mulaw_bytes = pcm16_to_mulaw(pcm_8k)
    return base64.b64encode(mulaw_bytes).decode("ascii")
