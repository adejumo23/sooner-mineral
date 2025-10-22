@echo off
echo Restarting development server to pick up API changes...

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the development server
echo Starting development server...
npm run dev





