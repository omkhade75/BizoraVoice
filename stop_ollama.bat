@echo off
title Bizora Voice - Stop Ollama
echo ===================================================
echo   STOPPING LOCAL OLLAMA SERVER
echo ===================================================
echo.
echo Terminating Ollama processes to free 100%% of your GPU and RAM...

taskkill /F /IM "ollama.exe" 2>nul
taskkill /F /IM "ollama app.exe" 2>nul

echo.
echo ===================================================
echo  [SUCCESS] Ollama is completely stopped.
echo  Your laptop is now at 0%% AI load.
echo  Website callers will automatically use Cloud Gemini!
echo ===================================================
echo.
pause
