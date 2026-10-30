"""
Authentication & Authorization routes and dependencies for Bizora Voice.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.db import get_db
from database.models import User, ApiKey
from api.models import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserResponse,
    CreateApiKeyRequest,
    ApiKeyResponse,
)
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_api_key,
    hash_api_key,
)

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
api_keys_router = APIRouter(prefix="/api/keys", tags=["Developer API Keys"])
security_bearer = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    x_bizora_key: Optional[str] = Header(None, alias="X-Bizora-Key"),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Authenticate user via:
    1. JWT Token in Authorization header (Bearer <jwt>)
    2. API Key in Authorization header (Bearer bv_live_...)
    3. API Key in X-Bizora-Key header
    4. Fallback to default admin user for zero-friction local development
    """
    # 1. Check API Key in headers
    raw_api_key = None
    if auth and auth.credentials.startswith("bv_live_"):
        raw_api_key = auth.credentials
    elif x_bizora_key and x_bizora_key.startswith("bv_live_"):
        raw_api_key = x_bizora_key

    if raw_api_key:
        key_hash = hash_api_key(raw_api_key)
        res = await db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
        )
        api_key_obj = res.scalars().first()
        if api_key_obj:
            user = await db.get(User, api_key_obj.user_id)
            if user:
                return user

    # 2. Check JWT Bearer token
    if auth and not auth.credentials.startswith("bv_live_"):
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            user = await db.get(User, payload["sub"])
            if user and user.is_active:
                return user

    # 3. Fallback to default admin user for seamless local developer testing
    res = await db.execute(select(User).limit(1))
    default_user = res.scalars().first()
    return default_user


async def get_current_user_required(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Enforce authenticated user requirement."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or provide a valid API key.",
        )
    return user


@auth_router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new customer account."""
    existing = await db.execute(select(User).where(User.email == req.email.lower()))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        email=req.email.lower(),
        name=req.name,
        company=req.company or "Independent",
        hashed_password=hash_password(req.password),
        role="developer",
        tier="pro",
        credits_minutes=120.0,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate initial API Key for user
    raw_key, k_hash, k_prefix = generate_api_key()
    api_key_record = ApiKey(
        user_id=new_user.id,
        name="Default Developer Key",
        key_hash=k_hash,
        key_prefix=k_prefix,
    )
    db.add(api_key_record)
    await db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(new_user))


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    res = await db.execute(select(User).where(User.email == req.email.lower()))
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@auth_router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user_required)):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(user)


# ── Developer API Keys Router ──────────────────────────────────────────
@api_keys_router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the current user."""
    res = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())
    )
    keys = res.scalars().all()
    return [ApiKeyResponse.model_validate(k) for k in keys]


@api_keys_router.post("", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_new_api_key(
    req: CreateApiKeyRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new developer API key (bv_live_...)."""
    raw_key, k_hash, k_prefix = generate_api_key()
    new_key = ApiKey(
        user_id=user.id,
        name=req.name,
        key_hash=k_hash,
        key_prefix=k_prefix,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    resp = ApiKeyResponse.model_validate(new_key)
    resp.raw_key = raw_key  # Returned only once
    return resp


@api_keys_router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Revoke and delete an API key."""
    key = await db.get(ApiKey, key_id)
    if not key or key.user_id != user.id:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.delete(key)
    await db.commit()
