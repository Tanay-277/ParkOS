@echo off
echo Starting ParkOS Development Environment

echo Starting backend server...
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start cmd /k "cd frontend && npm install && npm run dev"

echo ParkOS development environment started!
echo Backend API: http://localhost:8000/docs
echo Frontend: http://localhost:3000
