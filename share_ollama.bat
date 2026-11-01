@echo off
title Bizora Voice - Share Ollama to Cloud
echo ===================================================
echo   BIZORA VOICE - SHARE LOCAL OLLAMA WITH CLOUD
echo ===================================================
echo.
echo Starting permanent fixed tunnel for port 11434...
echo.
echo Your permanent link is:
echo   https://bizora-om-voice.loca.lt
echo.
echo Put this link in Render once. You never have to change it!
echo.
echo To STOP sharing at any time: close this window or press CTRL+C.
echo ===================================================
echo.

npx --yes localtunnel --port 11434 --subdomain bizora-om-voice
pause
