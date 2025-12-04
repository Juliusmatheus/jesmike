@echo off
echo ========================================
echo SME Platform - Quick Start Script
echo ========================================
echo.

echo Checking if backend dependencies are installed...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)
echo.

echo Starting backend server...
start "SME Backend Server" cmd /k "npm run dev"
echo Backend server starting on http://localhost:5000
echo.

cd ..
echo Checking if frontend dependencies are installed...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed.
)
echo.

echo Starting frontend application...
timeout /t 3 /nobreak > nul
start "SME Frontend App" cmd /k "npm start"
echo Frontend application starting on http://localhost:3000
echo.

echo ========================================
echo Platform is starting!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
pause > nul