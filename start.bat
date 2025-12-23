@echo off
setlocal
echo Starting WA Blast Pro Server...
echo --------------------------------

if exist "node_modules" (
    echo Dependencies already installed. Skipping 'npm install'.
    echo    (Delete 'node_modules' folder manually if you need to reinstall)
) else (
    echo 'node_modules' not found. Installing dependencies...
    call npm install --no-audit --no-fund --loglevel=error
)

echo.
echo Starting Server...
node server.js
pause
