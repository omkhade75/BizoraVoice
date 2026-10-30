@echo off
echo ===================================================
echo   Starting BizVoice Frontend (Next.js Dashboard)
echo   Accessible at http://localhost:3000
echo ===================================================

cd /d "%~dp0frontend"
npm run dev
pause
