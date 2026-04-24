@echo off
setlocal

set "ROOT=%~dp0smart-city"

if not exist "%ROOT%\frontend\package.json" (
  echo Frontend package.json not found at "%ROOT%\frontend"
  exit /b 1
)

if not exist "%ROOT%\backend\package.json" (
  echo Backend package.json not found at "%ROOT%\backend"
  exit /b 1
)

start "CivicPulse Frontend" cmd /k "cd /d "%ROOT%\frontend" && npm.cmd run dev"
start "CivicPulse Backend" cmd /k "cd /d "%ROOT%\backend" && npm.cmd run dev"

echo Started frontend and backend terminals.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000

endlocal
