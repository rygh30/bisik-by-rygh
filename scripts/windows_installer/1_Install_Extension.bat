@echo off
setlocal EnableDelayedExpansion
title bisik by rygh - Premiere Pro Extension Windows Installer

echo ===============================================================
echo        bisik by rygh - Premiere Pro Extension Installer        
echo ===============================================================
echo This installer will unpack and configure the bisik extension
echo for Adobe Premiere Pro on your Windows system.
echo ===============================================================
echo.

:: 1. Locate Adobe CEP Extensions directory (prefer system directory, fallback to user AppData)
set "TARGET_DIR=%CommonProgramFiles(x86)%\Adobe\CEP\extensions\com.rygh.bisik"
if not defined CommonProgramFiles(x86) (
    set "TARGET_DIR=%CommonProgramFiles%\Adobe\CEP\extensions\com.rygh.bisik"
)

:: Check if system-wide directory is writable, otherwise use user profile directory
mkdir "%TARGET_DIR%" >nul 2>&1
if not exist "%TARGET_DIR%" (
    set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.rygh.bisik"
    mkdir "!TARGET_DIR!" >nul 2>&1
)

echo [1/3] Target Installation Directory:
echo       !TARGET_DIR!
echo.

:: 2. Unpack bisik_by_rygh.zxp package
set "ZXP_FILE=%~dp0bisik_by_rygh.zxp"
if not exist "%ZXP_FILE%" (
    echo [ERROR] Package file not found: %ZXP_FILE%
    echo Please make sure bisik_by_rygh.zxp is in the same folder as this script.
    pause
    exit /b 1
)

echo [2/3] Extracting extension files...
set "TEMP_ZIP=%TEMP%\bisik_installer_%RANDOM%.zip"
copy /Y "%ZXP_FILE%" "%TEMP_ZIP%" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Expand-Archive -Path '%TEMP_ZIP%' -DestinationPath '!TARGET_DIR!' -Force" >nul 2>&1

if exist "%TEMP_ZIP%" del /F /Q "%TEMP_ZIP%" >nul 2>&1

if not exist "!TARGET_DIR!\CSXS\manifest.xml" (
    echo [ERROR] Failed to extract extension files to target directory.
    echo Please try running this script as Administrator.
    pause
    exit /b 1
)

echo [OK] Extension files successfully installed!
echo.

:: 3. Configure PlayerDebugMode in Windows Registry for CSXS 11-17
echo [3/3] Configuring Adobe CEP security permissions in Windows Registry...
for %%V in (11 12 13 14 15 16 17) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo [OK] Registry keys configured (CSXS.11 through CSXS.17)!
echo.

echo ===============================================================
echo                  INSTALLATION COMPLETED                        
echo ===============================================================
echo Next Steps:
echo 1. Run 2_Setup_AI_Engine.bat to configure FFmpeg and Whisper AI.
echo 2. Launch Adobe Premiere Pro.
echo 3. Navigate to: Window ^> Extensions ^> bisik by rygh
echo ===============================================================
echo.
pause
