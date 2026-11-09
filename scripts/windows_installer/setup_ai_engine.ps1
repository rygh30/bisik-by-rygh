# ==============================================================================
# bisik by rygh - AI Engine and Dependency Setup (PowerShell)
# ==============================================================================
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Helper function: High-speed download with native curl.exe or Invoke-WebRequest (No slow blue progress bar)
function Download-FileFast {
    param (
        [string]$Url,
        [string]$DestinationPath
    )
    $downloadSuccess = $false
    
    # Prefer native curl.exe (standard in Windows 10/11) with clean 1-line progress bar
    if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
        & curl.exe -fL --progress-bar -o $DestinationPath $Url
        if ($LASTEXITCODE -eq 0 -and (Test-Path $DestinationPath) -and ((Get-Item $DestinationPath).Length -gt 0)) {
            $downloadSuccess = $true
        }
    }
    
    # Fallback to Invoke-WebRequest without slow GUI progress bar
    if (-not $downloadSuccess) {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $DestinationPath -UseBasicParsing
    }
}

$userProfile = if ($env:USERPROFILE) { $env:USERPROFILE } else { $env:HOME }
$binDir = Join-Path $userProfile "whisper-cpp"
$modelDir = Join-Path $userProfile ".whisper-models"

if (!(Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }
if (!(Test-Path $modelDir)) { New-Item -ItemType Directory -Path $modelDir -Force | Out-Null }

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       bisik by rygh - AI Engine and Dependency Setup          " -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This wizard configures the local audio processing and speech"
Write-Host "recognition engines (FFmpeg + Whisper CLI) required for"
Write-Host "100% offline transcription in Adobe Premiere Pro."
Write-Host "==============================================================="
Write-Host ""

# -----------------------------------------------------------------
# 1. Check & Install Whisper CLI (Speech Recognition Engine)
# -----------------------------------------------------------------
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[1/3] CHECKING WHISPER CLI (Speech Recognition Engine)..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray

$whisperInstalled = $false
$whisperPath = $null

if (Get-Command whisper-cli -ErrorAction SilentlyContinue) {
    $whisperInstalled = $true
    $whisperPath = (Get-Command whisper-cli).Source
} elseif (Get-Command whisper-cpp -ErrorAction SilentlyContinue) {
    $whisperInstalled = $true
    $whisperPath = (Get-Command whisper-cpp).Source
} elseif (Test-Path "$binDir\whisper-cli.exe") {
    $whisperInstalled = $true
    $whisperPath = "$binDir\whisper-cli.exe"
} elseif (Test-Path "$binDir\whisper-cpp.exe") {
    $whisperInstalled = $true
    $whisperPath = "$binDir\whisper-cpp.exe"
}

if ($whisperInstalled) {
    Write-Host "[OK] Whisper CLI is already installed: $whisperPath" -ForegroundColor Green
} else {
    Write-Host "[INFO] Whisper CLI not found. Downloading official binaries (~22 MB)..." -ForegroundColor Cyan
    Write-Host "       Destination: $binDir" -ForegroundColor DarkGray
    $whisperZip = "$env:TEMP\whisper-bin-x64.zip"
    $whisperExt = "$env:TEMP\whisper_extract_$((Get-Random))"
    
    try {
        Download-FileFast -Url "https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip" -DestinationPath $whisperZip
        Write-Host "Extracting binaries..." -ForegroundColor DarkGray
        Expand-Archive -Path $whisperZip -DestinationPath $whisperExt -Force
        Copy-Item "$whisperExt\Release\*" -Destination $binDir -Force
        if (Test-Path "$binDir\whisper-cli.exe") {
            Copy-Item "$binDir\whisper-cli.exe" "$binDir\whisper-cpp.exe" -Force
        }
        Write-Host "[OK] Whisper CLI successfully installed to: $binDir\whisper-cli.exe" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to download or extract Whisper CLI: $_" -ForegroundColor Red
    } finally {
        Remove-Item -Recurse -Force $whisperExt -ErrorAction SilentlyContinue
        Remove-Item -Force $whisperZip -ErrorAction SilentlyContinue
    }
}
Write-Host ""

# -----------------------------------------------------------------
# 2. Check & Install FFmpeg (Audio Extraction Engine)
# -----------------------------------------------------------------
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[2/3] CHECKING FFMPEG (Audio Extraction Engine)..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray

$ffmpegInstalled = $false
$ffmpegPath = $null

if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    $ffmpegInstalled = $true
    $ffmpegPath = (Get-Command ffmpeg).Source
} elseif (Test-Path "$binDir\ffmpeg.exe") {
    $ffmpegInstalled = $true
    $ffmpegPath = "$binDir\ffmpeg.exe"
} elseif (Test-Path "C:\ffmpeg\bin\ffmpeg.exe") {
    $ffmpegInstalled = $true
    $ffmpegPath = "C:\ffmpeg\bin\ffmpeg.exe"
} elseif (Test-Path "C:\Program Files\ffmpeg\bin\ffmpeg.exe") {
    $ffmpegInstalled = $true
    $ffmpegPath = "C:\Program Files\ffmpeg\bin\ffmpeg.exe"
}

if ($ffmpegInstalled) {
    Write-Host "[OK] FFmpeg is already installed: $ffmpegPath" -ForegroundColor Green
} else {
    Write-Host "[INFO] FFmpeg not found. Downloading portable build (~110 MB)..." -ForegroundColor Cyan
    Write-Host "       Destination: $binDir" -ForegroundColor DarkGray
    $ffmpegZip = "$env:TEMP\ffmpeg-essentials.zip"
    $ffmpegExt = "$env:TEMP\ffmpeg_extract_$((Get-Random))"
    
    try {
        # Download from fast CDN using curl.exe / WebClient
        Download-FileFast -Url "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -DestinationPath $ffmpegZip
        if (!(Test-Path $ffmpegZip) -or ((Get-Item $ffmpegZip).Length -lt 5000000)) {
            Write-Host "Falling back to Gyan CDN..." -ForegroundColor DarkGray
            Download-FileFast -Url "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -DestinationPath $ffmpegZip
        }
        Write-Host "Extracting ffmpeg.exe..." -ForegroundColor DarkGray
        Expand-Archive -Path $ffmpegZip -DestinationPath $ffmpegExt -Force
        $ffmpegExe = Get-ChildItem -Path $ffmpegExt -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1
        if ($ffmpegExe) {
            Copy-Item $ffmpegExe.FullName -Destination "$binDir\ffmpeg.exe" -Force
        }
        $ffprobeExe = Get-ChildItem -Path $ffmpegExt -Filter "ffprobe.exe" -Recurse | Select-Object -First 1
        if ($ffprobeExe) {
            Copy-Item $ffprobeExe.FullName -Destination "$binDir\ffprobe.exe" -Force
        }
        Write-Host "[OK] FFmpeg successfully installed to: $binDir\ffmpeg.exe" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to download or extract FFmpeg: $_" -ForegroundColor Red
    } finally {
        Remove-Item -Recurse -Force $ffmpegExt -ErrorAction SilentlyContinue
        Remove-Item -Force $ffmpegZip -ErrorAction SilentlyContinue
    }
}
Write-Host ""

# Register %USERPROFILE%\whisper-cpp into permanent User PATH
try {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$binDir*") {
        $newPath = if ([string]::IsNullOrEmpty($userPath)) { $binDir } else { $userPath.TrimEnd(';') + ';' + $binDir }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    }
} catch { }
$env:PATH = "$binDir;$env:PATH"

# -----------------------------------------------------------------
# 3. Check & Download Whisper AI Speech Models
# -----------------------------------------------------------------
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[3/3] CHECKING WHISPER AI SPEECH MODELS..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray

$existingModels = Get-ChildItem -Path $modelDir -Filter "*.bin" -ErrorAction SilentlyContinue
if ($existingModels.Count -gt 0) {
    Write-Host "[OK] Found existing speech model(s) in $modelDir :" -ForegroundColor Green
    foreach ($m in $existingModels) {
        Write-Host "     - $($m.Name)" -ForegroundColor Cyan
    }
    Write-Host ""
    $ans = Read-Host "Would you like to download another model? [y/N] (Default: N)"
    if ($ans -match '^[Yy]$') {
        $proceedModel = $true
    } else {
        $proceedModel = $false
    }
} else {
    $proceedModel = $true
}

if ($proceedModel) {
    Write-Host ""
    Write-Host "Select the Whisper speech recognition model to download:"
    Write-Host "  [1] Tiny     (~75 MB)   - Ultra-fast, minimal memory (~1 GB RAM)"
    Write-Host "  [2] Base     (~145 MB)  - Fast, good general transcription (~1 GB RAM)"
    Write-Host "  [3] Small    (~460 MB)  - Balanced speed and higher quality (~2 GB RAM)"
    Write-Host "  [4] Medium   (~1.5 GB)  - High accuracy for multilingual speech (~5 GB RAM)"
    Write-Host "  [5] Large-v3 (~3.1 GB)  - MAXIMUM ACCURACY (RECOMMENDED)" -ForegroundColor Yellow
    Write-Host "                          Best word timestamps, punctuation, complex audio (~6 GB RAM)"
    Write-Host "  [6] Skip download (I will provide a model manually)"
    Write-Host ""
    Write-Host "NOTE: Option [5] (Large-v3, ~3.1 GB) is strongly recommended for professional" -ForegroundColor Cyan
    Write-Host "      video production to achieve maximum accuracy and punctuation precision." -ForegroundColor Cyan
    Write-Host ""
    $choice = Read-Host "Enter your choice [1-6] (Default: 5 - Large-v3 Recommended)"
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "5" }

    $modelName = $null
    $modelUrl = $null

    switch ($choice) {
        "1" { $modelName = "ggml-tiny.bin"; $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin" }
        "2" { $modelName = "ggml-base.bin"; $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" }
        "3" { $modelName = "ggml-small.bin"; $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin" }
        "4" { $modelName = "ggml-medium.bin"; $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin" }
        "5" { $modelName = "ggml-large-v3.bin"; $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin" }
        default { $modelName = $null }
    }

    if ($modelName) {
        Write-Host ""
        Write-Host ">> Downloading $modelName from HuggingFace CDN..." -ForegroundColor Cyan
        Write-Host ">> Destination: $modelDir\$modelName" -ForegroundColor DarkGray
        Write-Host "Please wait, downloading may take several minutes depending on connection speed..."
        try {
            Download-FileFast -Url $modelUrl -DestinationPath "$modelDir\$modelName"
            Write-Host "[OK] Model successfully downloaded to: $modelDir\$modelName" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Download interrupted: $_" -ForegroundColor Yellow
            Write-Host "          You can download manually from: $modelUrl"
            Write-Host "          and place the file into: $modelDir"
        }
    } else {
        Write-Host "[INFO] Skipping model download. Please place your *.bin model into: $modelDir" -ForegroundColor Cyan
    }
}

# -----------------------------------------------------------------
# 4. Summary & Completion
# -----------------------------------------------------------------
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "                 AI ENGINE SETUP COMPLETED                     " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "Installation summary:"
Write-Host "  - Binaries Directory : $binDir"
Write-Host "  - Model Directory    : $modelDir"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. If not already installed, run: 1_Install_Extension.bat"
Write-Host "  2. Launch Adobe Premiere Pro."
Write-Host "  3. In the top menu, navigate to: Window > Extensions > bisik by rygh"
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
