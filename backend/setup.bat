@echo off
setlocal
cd /d "%~dp0"
echo [1/3] Creating virtual environment...
if not exist ".venv" python -m venv .venv
echo [2/3] Installing dependencies...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul
pip install -r requirements.txt
echo [3/3] Done.
echo.
echo Setup complete. Run run.bat to start the API on http://localhost:8000
pause