@echo off
title Bizora Voice - Local Ollama Server
echo ===================================================
echo   BIZORA VOICE - LOCAL OLLAMA SERVER CONTROL
echo ===================================================
echo.
echo Starting Ollama with model qwen3.5:4b...
echo While this window is open, your laptop will process voice AI calls.
echo.
echo To STOP the server and free your GPU/RAM at any time:
echo   - Press CTRL + C, OR
echo   - Simply CLOSE this black window, OR
echo   - Run stop_ollama.bat
echo ===================================================
echo.

ollama run qwen3.5:4b
pause
