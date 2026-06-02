@echo off
REM ============================================
REM 🚀 RentNow - Deploy Script (Windows)
REM ============================================
echo.
echo === RentNow - Quick Start ===
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

REM Check .env.local
if not exist ".env.local" (
    echo.
    echo [WARNING] No .env.local found.
    echo Creating from .env.example...
    copy .env.example .env.local >nul
    echo.
    echo [ACTION REQUIRED] Edit .env.local with your API keys:
    echo   - NEXT_PUBLIC_SUPABASE_URL
    echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo   - MP_ACCESS_TOKEN
    echo   - GEMINI_API_KEY
    echo.
    pause
) else (
    echo [OK] .env.local found
)

echo.
echo Starting development server...
echo Open http://localhost:3000 in your browser
echo.
call npm run dev

pause
