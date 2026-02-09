@echo off
REM Crammer+ Backend Startup Script

echo Starting Crammer+ Backend...
cd /d "%~dp0"

REM Set Python path
set PYTHONPATH=%CD%

REM Run the application
python -m app.main

pause
