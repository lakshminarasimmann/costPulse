@echo off
echo ======================================================================
echo   FREIGHTTIGER SMART SHIPPING COST ASSISTANT
echo   Starting Backend (FastAPI :8000) and Frontend (Vite :3000)...
echo ======================================================================

start "FreightTiger Backend (FastAPI)" cmd /k "python backend/main.py"
start "FreightTiger Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo Services started!
echo Frontend UI: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
echo ======================================================================
pause
