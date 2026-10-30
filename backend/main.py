"""
Bizora Voice - Standalone Self-Hosted Voice AI Calling Platform (Vapi AI Alternative)
FastAPI Server Entry Point.
"""

from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database.db import init_db
from api.rest import router as rest_router
from api.websocket import ws_router
from api.auth import auth_router, api_keys_router
from engines.registry import llm_engine

# Configure logging
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("bizoravoice")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: database initialization and teardown."""
    logger.info("Initializing Bizora Voice database...")
    await init_db()
    logger.info("Bizora Voice database ready.")

    # Check Ollama connection
    ollama_ok = await llm_engine.is_reachable()
    if ollama_ok:
        logger.info(f"Ollama connected successfully at {settings.ollama_base_url}")
    else:
        logger.warning(
            f"Ollama is not reachable at {settings.ollama_base_url}. "
            "Make sure 'ollama serve' is running."
        )

    yield

    logger.info("Shutting down Bizora Voice...")
    await llm_engine.close()


app = FastAPI(
    title="Bizora Voice",
    description="Enterprise-Grade Standalone Self-Hosted Voice AI Platform (No External API Keys)",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(api_keys_router)
app.include_router(rest_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "name": "Bizora Voice Platform",
        "version": "2.0.0",
        "tagline": "The 100% Self-Hosted Vapi.ai Alternative for Voice AI Agents",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "stats_url": "/api/stats",
        "copilot_url": "/api/copilot/chat",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
