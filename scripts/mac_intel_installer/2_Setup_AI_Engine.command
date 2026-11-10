#!/usr/bin/env bash
# ==============================================================================
# bisik by rygh - AI Engine & Dependency Setup (Intel macOS Edition)
# 100% Standalone & Portable — Zero Homebrew or Administrator Privileges Required
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

clear
echo "==============================================================="
echo "       bisik by rygh - AI Engine Setup (Intel macOS)           "
echo "==============================================================="
echo "This automated setup configures the local audio processing and"
echo "speech recognition engines (FFmpeg + Whisper CLI) required for"
echo "100% offline transcription in Adobe Premiere Pro on Intel Macs."
echo ""
echo "No Homebrew or root administrator permissions required."
echo "Everything installs directly to your user folder: ~/whisper-cpp"
echo "==============================================================="
echo ""

PORTABLE_DIR="$HOME/whisper-cpp"
MODEL_DIR="$HOME/.whisper-models"
mkdir -p "$PORTABLE_DIR"
mkdir -p "$MODEL_DIR"

# Ensure portable directory is prioritized in PATH for this session
export PATH="$PORTABLE_DIR:/usr/local/bin:/opt/homebrew/bin:$PATH"

# -----------------------------------------------------------------
# 1. Check & Install Whisper CLI (Speech Recognition Engine)
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[1/3] CONFIGURING WHISPER CLI (Speech Recognition Engine)..."
echo "---------------------------------------------------------------"

WHISPER_BIN="$PORTABLE_DIR/whisper-cli"

if [ -f "$WHISPER_BIN" ] && [ -x "$WHISPER_BIN" ]; then
  echo "[OK] Whisper CLI is already configured: $WHISPER_BIN"
elif command -v whisper-cli &>/dev/null; then
  echo "[OK] Whisper CLI found in system PATH: $(command -v whisper-cli)"
  WHISPER_BIN="$(command -v whisper-cli)"
else
  echo "[INFO] Installing precompiled standalone Whisper CLI for Intel x86_64..."
  if [ -f "$SCRIPT_DIR/bin/whisper-cli" ]; then
    cp -f "$SCRIPT_DIR/bin/whisper-cli" "$PORTABLE_DIR/whisper-cli"
    cp -f "$SCRIPT_DIR/bin/whisper-cli" "$PORTABLE_DIR/whisper-cpp"
    chmod 755 "$PORTABLE_DIR/whisper-cli" "$PORTABLE_DIR/whisper-cpp"
    xattr -cr "$PORTABLE_DIR/whisper-cli" "$PORTABLE_DIR/whisper-cpp" 2>/dev/null || true
    echo "[OK] Whisper CLI successfully copied to: $PORTABLE_DIR/whisper-cli"
  else
    echo "[INFO] Local binary not found in installer package. Downloading from repository..."
    TEMP_WHISPER="/tmp/whisper-cli-x86_64"
    # Fallback to direct download if ever separated
    curl -fL --progress-bar "https://github.com/ggml-org/whisper.cpp/releases/download/v1.7.4/whisper-cli" -o "$TEMP_WHISPER" 2>/dev/null || true
    if [ -f "$TEMP_WHISPER" ]; then
      mv -f "$TEMP_WHISPER" "$PORTABLE_DIR/whisper-cli"
      cp -f "$PORTABLE_DIR/whisper-cli" "$PORTABLE_DIR/whisper-cpp"
      chmod 755 "$PORTABLE_DIR/whisper-cli" "$PORTABLE_DIR/whisper-cpp"
      xattr -cr "$PORTABLE_DIR/whisper-cli" "$PORTABLE_DIR/whisper-cpp" 2>/dev/null || true
    fi
  fi
fi

# Verify Whisper CLI executable
if [ -x "$PORTABLE_DIR/whisper-cli" ] || command -v whisper-cli &>/dev/null; then
  INSTALLED_WHISPER="${PORTABLE_DIR}/whisper-cli"
  [ ! -x "$INSTALLED_WHISPER" ] && INSTALLED_WHISPER="$(command -v whisper-cli)"
  echo "[OK] Verified: $INSTALLED_WHISPER"
else
  echo "[ERROR] Could not configure Whisper CLI. Please ensure bin/whisper-cli is present."
  read -n 1 -s -r -p "Press any key to exit..."
  echo ""
  exit 1
fi
echo ""

# -----------------------------------------------------------------
# 2. Check & Install FFmpeg (Audio Extraction Engine)
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[2/3] CONFIGURING FFMPEG (Audio Extraction Engine)..."
echo "---------------------------------------------------------------"

FFMPEG_BIN="$PORTABLE_DIR/ffmpeg"

if [ -f "$FFMPEG_BIN" ] && [ -x "$FFMPEG_BIN" ]; then
  echo "[OK] Portable FFmpeg is already configured: $FFMPEG_BIN"
elif command -v ffmpeg &>/dev/null; then
  echo "[OK] FFmpeg found in system PATH: $(command -v ffmpeg)"
  FFMPEG_BIN="$(command -v ffmpeg)"
else
  echo "[INFO] Standalone FFmpeg not found on your system."
  echo "       Downloading official static FFmpeg for Intel macOS (~28 MB)..."
  echo "       Destination: $PORTABLE_DIR/ffmpeg"
  echo ""
  
  FFMPEG_GZ="$PORTABLE_DIR/ffmpeg.gz"
  rm -f "$FFMPEG_GZ"
  if curl -fL --progress-bar "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64.gz" -o "$FFMPEG_GZ"; then
    echo ">> Extracting binary..."
    gzip -d -f "$FFMPEG_GZ"
    chmod 755 "$PORTABLE_DIR/ffmpeg"
    xattr -cr "$PORTABLE_DIR/ffmpeg" 2>/dev/null || true
    echo "[OK] FFmpeg successfully installed to: $PORTABLE_DIR/ffmpeg"
  else
    echo "[WARNING] Primary FFmpeg download source failed. Trying alternative..."
    if curl -fL --progress-bar "https://evermeet.cx/ffmpeg/getrelease/zip" -o "/tmp/ffmpeg-intel.zip"; then
      unzip -q -o "/tmp/ffmpeg-intel.zip" -d "$PORTABLE_DIR"
      chmod 755 "$PORTABLE_DIR/ffmpeg" 2>/dev/null || true
      xattr -cr "$PORTABLE_DIR/ffmpeg" 2>/dev/null || true
      rm -f "/tmp/ffmpeg-intel.zip"
      echo "[OK] FFmpeg successfully installed to: $PORTABLE_DIR/ffmpeg"
    else
      echo "[ERROR] Failed to download FFmpeg automatically."
      echo "        Please download ffmpeg for macOS manually and place it into: $PORTABLE_DIR/ffmpeg"
    fi
  fi
fi

# Verify FFmpeg executable
if [ -x "$PORTABLE_DIR/ffmpeg" ] || command -v ffmpeg &>/dev/null; then
  INSTALLED_FFMPEG="${PORTABLE_DIR}/ffmpeg"
  [ ! -x "$INSTALLED_FFMPEG" ] && INSTALLED_FFMPEG="$(command -v ffmpeg)"
  FF_VER="$("$INSTALLED_FFMPEG" -version 2>/dev/null | head -n 1)"
  echo "[OK] Verified: $INSTALLED_FFMPEG"
  echo "     $FF_VER"
else
  echo "[ERROR] FFmpeg binary not operational."
  read -n 1 -s -r -p "Press any key to exit..."
  echo ""
  exit 1
fi
echo ""

# -----------------------------------------------------------------
# 3. Check & Download Whisper AI Speech Models
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[3/3] CHECKING WHISPER AI SPEECH MODELS..."
echo "---------------------------------------------------------------"

EXISTING_MODELS=()
for f in "$MODEL_DIR"/*.bin "$PORTABLE_DIR"/models/*.bin "$PORTABLE_DIR"/*.bin; do
  if [ -f "$f" ]; then
    EXISTING_MODELS+=("$(basename "$f")")
  fi
done

if [ ${#EXISTING_MODELS[@]} -gt 0 ]; then
  echo "[OK] Found existing speech models in $MODEL_DIR:"
  for m in "${EXISTING_MODELS[@]}"; do
    echo "     - $m"
  done
  echo ""
  read -p "Would you like to download another model? [y/N] (Default: N): " ans_extra
  ans_extra=${ans_extra:-N}
  if [[ ! "$ans_extra" =~ ^[Yy]$ ]]; then
    echo ">> Keeping existing models. Skipping model download."
    SKIP_MODEL=1
  fi
fi

if [ "${SKIP_MODEL:-0}" -ne 1 ]; then
  echo "Select a Whisper AI speech model to download:"
  echo "  [1] Tiny   (~75 MB)   - Ultra-fast, low memory"
  echo "  [2] Base   (~145 MB)  - Fast, good for clear dialogue"
  echo "  [3] Small  (~460 MB)  - Balanced speed & accuracy"
  echo "  [4] Medium (~1.5 GB)  - High accuracy"
  echo "  [5] Large-v3 (~3.1 GB) - Maximum professional precision [RECOMMENDED]"
  echo "  [6] Large-v3-Turbo (~1.6 GB) - High precision, 3x faster inference"
  echo "  [S] Skip model download"
  echo ""
  read -p "Enter choice [1-6, S] (Default: 5): " model_choice
  model_choice=${model_choice:-5}

  case "$model_choice" in
    1)
      MODEL_NAME="ggml-tiny.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
      ;;
    2)
      MODEL_NAME="ggml-base.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
      ;;
    3)
      MODEL_NAME="ggml-small.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
      ;;
    4)
      MODEL_NAME="ggml-medium.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
      ;;
    5)
      MODEL_NAME="ggml-large-v3.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
      ;;
    6)
      MODEL_NAME="ggml-large-v3-turbo.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
      ;;
    [Ss]*)
      MODEL_NAME=""
      ;;
    *)
      MODEL_NAME="ggml-large-v3.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
      ;;
  esac

  if [ -n "$MODEL_NAME" ]; then
    echo ""
    echo ">> Downloading $MODEL_NAME from HuggingFace..."
    echo ">> Target path: $MODEL_DIR/$MODEL_NAME"
    echo "Please wait, download speed depends on your internet connection..."
    if curl -fL --progress-bar "$MODEL_URL" -o "$MODEL_DIR/$MODEL_NAME"; then
      echo "[OK] Model successfully downloaded to: $MODEL_DIR/$MODEL_NAME"
    else
      echo "[WARNING] Download interrupted. You can download manually from:"
      echo "          $MODEL_URL"
      echo "          and place it into: $MODEL_DIR"
    fi
  else
    echo "[INFO] Model download skipped."
  fi
fi
echo ""

# -----------------------------------------------------------------
# 4. PATH Registration and Extended Attribute Sanitization
# -----------------------------------------------------------------
SHELL_PROFILES=("$HOME/.zprofile" "$HOME/.bash_profile" "$HOME/.profile")
PATH_ENTRY='export PATH="$HOME/whisper-cpp:$PATH"'

for prof in "${SHELL_PROFILES[@]}"; do
  if [ -f "$prof" ]; then
    if ! grep -qs "whisper-cpp" "$prof"; then
      echo "" >> "$prof"
      echo "# Added by bisik by rygh (Intel macOS setup)" >> "$prof"
      echo "$PATH_ENTRY" >> "$prof"
    fi
  fi
done

# Clear Gatekeeper quarantine on the portable folder
xattr -cr "$PORTABLE_DIR" 2>/dev/null || true
xattr -cr "$MODEL_DIR" 2>/dev/null || true

# -----------------------------------------------------------------
# 5. Final Summary
# -----------------------------------------------------------------
echo "==============================================================="
echo "        AI ENGINE SETUP COMPLETED SUCCESSFULLY!                "
echo "==============================================================="
echo "Components configured on your Intel Mac:"
echo "  - Whisper CLI: $PORTABLE_DIR/whisper-cli"
echo "  - FFmpeg:      $PORTABLE_DIR/ffmpeg"
echo "  - AI Models:   $MODEL_DIR"
echo ""
echo "Next Steps:"
echo "  1. If you haven't already, run: 1_Install_Bisik_Extension.pkg"
echo "  2. Launch Adobe Premiere Pro."
echo "  3. Open menu: Window > Extensions > bisik by rygh."
echo "==============================================================="
echo ""
read -n 1 -s -r -p "Press any key to close this installer..."
echo ""
exit 0
