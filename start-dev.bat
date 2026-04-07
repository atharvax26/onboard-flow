@echo off
echo ========================================
echo  Onboard Flow - Starting Servers
echo ========================================
echo.

echo [1/4] Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 5 /nobreak > nul

echo [2/4] Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"
timeout /t 10 /nobreak > nul

echo [3/4] Waiting for servers to initialize...
timeout /t 3 /nobreak > nul

echo [4/4] Opening browser...
start http://localhost:8081

echo.
echo ========================================
echo  Servers are running!
echo ========================================
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:8081
echo ========================================
echo.
echo If the browser doesn't open automatically,
echo please navigate to: http://localhost:8081
echo.
echo Press any key to close this window...
pause > nul
