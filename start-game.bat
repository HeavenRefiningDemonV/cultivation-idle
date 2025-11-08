@echo off
REM Cultivation Idle - Startup Script (Windows)

echo.
echo ========================================
echo   Cultivation Idle - Starting Game
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    call npm install
    echo.
)

REM Start the dev server
echo [*] Launching game server...
echo.
echo Game will be available at: http://localhost:5173/
echo.
echo Press Ctrl+C to stop the server
echo ----------------------------------------
echo.

call npm run dev

pause
