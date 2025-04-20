@echo off
echo Starting ParkOS Development Environment

:: Set environment variables
set PYTHONPATH=%~dp0backend
set NODE_ENV=development

:: Start the backend in a new window
start "ParkOS Backend" cmd /c "cd /d %~dp0backend && echo Installing backend dependencies... && pip install -r requirements.txt && echo Starting backend server... && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Give the backend time to start
timeout /t 5

:: Start the frontend in a new window
start "ParkOS Frontend" cmd /c "cd /d %~dp0frontend && echo Installing frontend dependencies... && npm install && echo Starting frontend server... && npm run dev"

echo Both services are starting in separate windows.
echo Backend will be available at http://localhost:8000
echo Frontend will be available at http://localhost:3000
