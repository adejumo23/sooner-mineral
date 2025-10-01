@echo off
echo 🚀 Starting Sooner Mineral Application Servers...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Start backend server in a new window
echo 📡 Starting backend server...
start "Backend Server" cmd /k "npm run server"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new window
echo 🌐 Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo 📊 Server Status:
echo Backend (API):  http://localhost:3001
echo Frontend (UI):  http://localhost:5173
echo Health Check:   http://localhost:3001/api/health
echo.
echo ✅ Both servers are starting...
echo 🌐 Open http://localhost:5173 in your browser
echo.
echo Press any key to exit this window (servers will continue running)
pause >nul
