"""
Security & Authentication helper module for Bizora Voice.

Handles:
- Password hashing & verification using PBKDF2-HMAC-SHA256 with random salt
- JWT generation and decoding for session auth
- API Key generation (bv_live_...) & SHA-256 verification for programmatic developer access
"""

import datetime
import hashlib
import hmac
import secrets
from typing import Optional, Dict, Any, Tuple
import jwt

from config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        if "$" not in hashed_password:
            return False
        salt, stored_hash = hashed_password.split("$", 1)
        computed_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        ).hex()
        return hmac.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False


def create_access_token(payload: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create signed JWT access token."""
    to_encode = payload.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.jwt_expire_minutes
        )
    to_encode.update({"exp": expire})
    token = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token."""
    try:
        decoded = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return decoded
    except Exception:
        return None


def generate_api_key() -> Tuple[str, str, str]:
    """
    Generate customer API key (like Vapi AI).
    Format: bv_live_<32_random_hex>
    Returns:
        (raw_key, key_hash, key_prefix)
    """
    random_part = secrets.token_hex(16)
    raw_key = f"bv_live_{random_part}"
    key_prefix = raw_key[:12] + "..."
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_hash, key_prefix


def hash_api_key(key: str) -> str:
    """Hash raw API key using SHA-256 for fast indexed lookup."""
    return hashlib.sha256(key.strip().encode("utf-8")).hexdigest()
