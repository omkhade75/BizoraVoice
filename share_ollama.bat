@echo off
title Bizora Voice - Share Ollama to Cloud
echo ===================================================
echo   BIZORA VOICE - SHARE LOCAL OLLAMA WITH CLOUD
echo ===================================================
echo.
echo Starting secure tunnel for port 11434 (Hotspot Compatible)...
echo.
echo Your public link will appear below (e.g. https://xxxx.loca.lt):
echo.
echo To STOP sharing at any time: close this window or press CTRL+C.
echo ===================================================
echo.

npx --yes localtunnel --port 11434
pause
