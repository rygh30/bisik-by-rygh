#!/usr/bin/env bash
# ==============================================================================
# bisik by rygh - AI Engine and Dependency Setup
# Standalone automated configuration script for macOS (Apple Silicon & Intel)
# ==============================================================================

# Change directory to the script's enclosing folder
cd "$(dirname "$0")"

clear
echo "==============================================================="
echo "       bisik by rygh - AI Engine and Dependency Setup          "
echo "==============================================================="
echo "This automated setup configures the local audio processing and"
echo "speech recognition engines (FFmpeg + Whisper CLI) required for"
echo "100% offline transcription in Adobe Premiere Pro."
echo "==============================================================="
echo ""

# -----------------------------------------------------------------
# 1. Configure PATH for Apple Silicon (/opt/homebrew) and Intel (/usr/local)
# -----------------------------------------------------------------
if [ -f "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# -----------------------------------------------------------------
# 2. Check Homebrew Package Manager
# -----------------------------------------------------------------
if ! command -v brew &>/dev/null; then
  echo "---------------------------------------------------------------"
  echo "[INFO] Homebrew package manager was not detected on your Mac."
  echo "       Homebrew is required to install FFmpeg and Whisper CLI."
  echo "---------------------------------------------------------------"
  echo ""
  read -p "Install Homebrew automatically now? [Y/n] (Default: Y): " ans_brew
  ans_brew=${ans_brew:-Y}
  if [[ "$ans_brew" =~ ^[Yy]$ ]]; then
    echo ""
    echo ">> Installing Homebrew via official Apple/Homebrew installer..."
    echo ">> NOTE: macOS may prompt for your administrator password."
    unset NONINTERACTIVE
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Reload and register PATH after Homebrew installation
    if [ -f "/opt/homebrew/bin/brew" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
      if [ -f "$HOME/.zprofile" ]; then
        grep -qs "brew shellenv" "$HOME/.zprofile" || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
      else
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' > "$HOME/.zprofile"
      fi
    elif [ -f "/usr/local/bin/brew" ]; then
      eval "$(/usr/local/bin/brew shellenv)"
      if [ -f "$HOME/.zprofile" ]; then
        grep -qs "brew shellenv" "$HOME/.zprofile" || echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.zprofile"
      else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' > "$HOME/.zprofile"
      fi
    fi
  else
    echo ""
    echo "[WARNING] Homebrew installation skipped. Please install manually from https://brew.sh/"
    echo ""
    read -n 1 -s -r -p "Press any key to exit..."
    echo ""
    exit 1
  fi
fi

if command -v brew &>/dev/null; then
  echo "[OK] Homebrew detected: $(command -v brew)"
else
  echo "---------------------------------------------------------------"
  echo "[ERROR] Homebrew was not detected in PATH."
  echo "        Please install Homebrew manually in a new Terminal window:"
  echo '        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "---------------------------------------------------------------"
  echo ""
  read -n 1 -s -r -p "Press any key to exit..."
  echo ""
  exit 1
fi
echo ""

# -----------------------------------------------------------------
# 3. Check & Install FFmpeg (Audio Extraction Engine)
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[1/3] CHECKING FFMPEG (Audio Extraction Engine)..."
echo "---------------------------------------------------------------"
if command -v ffmpeg &>/dev/null; then
  echo "[OK] FFmpeg is already installed: $(command -v ffmpeg)"
else
  echo "[INFO] FFmpeg not found. Installing via Homebrew..."
  if brew install ffmpeg; then
    echo "[OK] FFmpeg installed successfully: $(command -v ffmpeg 2>/dev/null || echo "Homebrew bin")"
  else
    echo "[WARNING] brew install ffmpeg encountered an error. Please verify your connection."
  fi
fi
echo ""

# -----------------------------------------------------------------
# 4. Check & Install Whisper CLI (Speech Recognition Engine)
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[2/3] CHECKING WHISPER CLI (Speech Recognition Engine)..."
echo "---------------------------------------------------------------"
if command -v whisper-cli &>/dev/null; then
  echo "[OK] Whisper CLI is already installed: $(command -v whisper-cli)"
elif command -v whisper-cpp &>/dev/null; then
  echo "[OK] Whisper CLI is already installed: $(command -v whisper-cpp)"
else
  echo "[INFO] Whisper CLI not found. Installing via Homebrew..."
  if brew install whisper-cpp; then
    echo "[OK] Whisper CLI installed successfully: $(command -v whisper-cli 2>/dev/null || command -v whisper-cpp 2>/dev/null || echo "Homebrew bin")"
  else
    echo "[WARNING] brew install whisper-cpp encountered an error. Please verify your connection."
  fi
fi
echo ""

# -----------------------------------------------------------------
# 5. Check & Download Whisper AI Speech Models
# -----------------------------------------------------------------
echo "---------------------------------------------------------------"
echo "[3/3] CHECKING WHISPER AI SPEECH MODELS..."
echo "---------------------------------------------------------------"
MODEL_DIR="$HOME/.whisper-models"
mkdir -p "$MODEL_DIR"

EXISTING_MODELS=()
for f in "$MODEL_DIR"/*.bin; do
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
    PROCEED_DOWNLOAD=false
  else
    PROCEED_DOWNLOAD=true
  fi
else
  PROCEED_DOWNLOAD=true
fi

if [ "$PROCEED_DOWNLOAD" = true ]; then
  echo ""
  echo "Select the Whisper speech recognition model to download:"
  echo "  [1] Tiny     (~75 MB)   - Ultra-fast, minimal memory (~1 GB RAM)"
  echo "  [2] Base     (~145 MB)  - Fast, good general transcription (~1 GB RAM)"
  echo "  [3] Small    (~460 MB)  - Balanced speed and higher quality (~2 GB RAM)"
  echo "  [4] Medium   (~1.5 GB)  - High accuracy for multilingual speech (~5 GB RAM)"
  echo "  [5] Large-v3 (~3.1 GB)  - MAXIMUM ACCURACY (RECOMMENDED)"
  echo "                          Best word timestamps, punctuation, complex audio (~6 GB RAM)"
  echo "  [6] Skip download (I will provide a model manually)"
  echo ""
  echo "NOTE: Option [5] (Large-v3, ~3.1 GB) is strongly recommended for professional"
  echo "      video production to achieve maximum accuracy and punctuation precision."
  echo ""
  read -p "Enter your choice [1-6] (Default: 5 - Large-v3 Recommended): " model_choice
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
    6)
      MODEL_NAME=""
      ;;
    *)
      MODEL_NAME="ggml-large-v3.bin"
      MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
      ;;
  esac

  if [ -n "$MODEL_NAME" ]; then
    echo ""
    echo ">> Downloading $MODEL_NAME from HuggingFace CDN..."
    echo ">> Destination: $MODEL_DIR/$MODEL_NAME"
    echo "Please wait, downloading may take several minutes depending on connection speed..."
    if curl -fL --progress-bar "$MODEL_URL" -o "$MODEL_DIR/$MODEL_NAME"; then
      echo "[OK] Model successfully downloaded to: $MODEL_DIR/$MODEL_NAME"
    else
      echo "[WARNING] Download interrupted or failed."
      echo "          You can download manually from: $MODEL_URL"
      echo "          and place the file into: $MODEL_DIR"
    fi
  else
    echo "[INFO] Skipping model download. Please place your *.bin model into: $MODEL_DIR"
  fi
fi

# -----------------------------------------------------------------
# 6. Summary & Completion
# -----------------------------------------------------------------
WHISPER_RESOLVED=$(command -v whisper-cli 2>/dev/null || command -v whisper-cpp 2>/dev/null || echo "")
FFMPEG_RESOLVED=$(command -v ffmpeg 2>/dev/null || echo "")

echo ""
echo "==============================================================="
echo "                 AI ENGINE SETUP COMPLETED                     "
echo "==============================================================="
echo "Component Status:"
echo "  - FFmpeg Audio Engine  : $([ -n "$FFMPEG_RESOLVED" ] && echo "[OK] READY ($FFMPEG_RESOLVED)" || echo "[WARNING] NOT DETECTED")"
echo "  - Whisper AI CLI       : $([ -n "$WHISPER_RESOLVED" ] && echo "[OK] READY ($WHISPER_RESOLVED)" || echo "[WARNING] NOT DETECTED")"
echo "  - Speech Model Folder  : $([ -d "$MODEL_DIR" ] && echo "[OK] READY ($MODEL_DIR)" || echo "[WARNING] MISSING")"
echo ""
echo "Next Steps:"
echo "  1. If not already installed, double-click:"
echo "     1_Install_Bisik_Extension.pkg"
echo "  2. Launch Adobe Premiere Pro."
echo "  3. In the top menu, navigate to: Window > Extensions > bisik by rygh"
echo "==============================================================="
echo ""
read -n 1 -s -r -p "Press any key to close this window..."
echo ""
exit 0
