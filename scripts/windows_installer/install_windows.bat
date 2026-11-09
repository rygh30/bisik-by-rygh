@echo off
setlocal EnableDelayedExpansion
title bisik by rygh - Windows Installer

echo =======================================================
echo        bisik by rygh - Premiere Pro Extension
echo                   Windows Installer
echo =======================================================
echo.

:: Detect target CEP extensions directory
set "TARGET_DIR=%CommonProgramFiles(x86)%\Adobe\CEP\extensions\com.rygh.bisik"
if not defined CommonProgramFiles(x86) (
    set "TARGET_DIR=%CommonProgramFiles%\Adobe\CEP\extensions\com.rygh.bisik"
)

echo [1/3] Installing extension files to:
echo       %TARGET_DIR%
echo.

:: Create target directory
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: Copy extension source folders from parent directory
set "ROOT_DIR=%~dp0..\.."

xcopy /E /I /Y /Q "%ROOT_DIR%\CSXS" "%TARGET_DIR%\CSXS" >nul
xcopy /E /I /Y /Q "%ROOT_DIR%\client" "%TARGET_DIR%\client" >nul
xcopy /E /I /Y /Q "%ROOT_DIR%\host" "%TARGET_DIR%\host" >nul
xcopy /E /I /Y /Q "%ROOT_DIR%\assets" "%TARGET_DIR%\assets" >nul
copy /Y "%ROOT_DIR%\package.json" "%TARGET_DIR%\package.json" >nul

echo [✓] Extension files installed successfully!
echo.

:: Configure PlayerDebugMode in Windows Registry for CSXS 11-17
echo [2/3] Configuring Adobe CEP security permissions (PlayerDebugMode)...
for %%V in (11 12 13 14 15 16 17) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo [✓] Registry keys configured!
echo.

:: Optional AI Engine Setup
echo [3/3] AI Engine Setup (FFmpeg + Whisper CLI + AI Speech Model)
echo       Do you want to run the AI engine setup now?
set /p RUN_AI="      Run setup wizard? [Y/N] (Default: Y): "
if /i "%RUN_AI%"=="" set RUN_AI=Y
if /i "%RUN_AI%"=="Y" (
    where node >nul 2>&1
    if %errorlevel% equ 0 (
        node "%ROOT_DIR%\scripts\setup_ai_engine.js"
    ) else (
        echo [!] Node.js is not found. To set up AI dependencies, please install Node.js from https://nodejs.org/
    )
)

echo.
echo =======================================================
echo Installation Complete!
echo.
echo Open Adobe Premiere Pro and launch:
echo Window ^> Extensions ^> bisik by rygh
echo =======================================================
pause

