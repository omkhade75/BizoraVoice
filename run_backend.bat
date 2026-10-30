@echo off
echo ===================================================
echo   Starting BizVoice Backend (FastAPI + WebSocket)
echo   Local Engines: faster-whisper + Ollama + Kokoro
echo ===================================================

cd /d "%~dp0backend"

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo Installing backend dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting FastAPI server at http://localhost:8000
python main.py
pause
