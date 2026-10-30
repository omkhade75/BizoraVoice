@echo off
title Bizora Voice - Self-Hosted Voice AI Platform
echo =====================================================================
echo   BIZORA VOICE - 100%% SELF-HOSTED ENTERPRISE CALLING PLATFORM
echo   Zero External API Keys • Vapi.ai Alternative • Regional Indic TTS
echo =====================================================================
echo.
echo [1/2] Starting Bizora Voice Backend (FastAPI on Port 8000)...
start "Bizora Voice Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo [2/2] Starting Bizora Voice Frontend (Next.js on Port 3000)...
start "Bizora Voice Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo   SUCCESS! Services are starting up:
echo   - Web Dashboard:     http://localhost:3000
echo   - Backend API Docs:  http://localhost:8000/docs
echo   - Health Endpoint:   http://localhost:8000/api/health
echo   - Local LLM:         http://localhost:11434 (Ollama)
echo =====================================================================
echo.
pause
