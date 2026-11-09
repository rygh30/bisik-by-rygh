@echo off
setlocal
title bisik by rygh - AI Engine Setup

echo ===============================================================
echo        bisik by rygh - AI Engine and Dependency Setup            
echo ===============================================================
echo Starting automated setup wizard...
echo.

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%setup_ai_engine.ps1"

if not exist "%PS_SCRIPT%" (
    echo [ERROR] setup_ai_engine.ps1 was not found in:
    echo         %SCRIPT_DIR%
    echo Please make sure all files from the ZIP archive are extracted together.
    echo.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

echo.
pause
