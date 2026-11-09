#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "======================================================="
echo "       bisik by rygh — macOS AI Engine Setup           "
echo "======================================================="
echo ""

# Ensure Homebrew is in PATH for both Apple Silicon and Intel Macs
if [ -f "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# Step 1: Check Homebrew package manager
if ! command -v brew &>/dev/null; then
  echo "[!] Homebrew package manager was not found on your Mac."
  echo "    Homebrew is needed to install FFmpeg and Whisper AI CLI."
  echo ""
  read -p "    Install Homebrew automatically now? [Y/n]: " ans_brew
  ans_brew=${ans_brew:-Y}
  if [[ "$ans_brew" =~ ^[Yy]$ ]]; then
    echo "    Installing Homebrew (requires Mac administrator password)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ -f "/opt/homebrew/bin/brew" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f "/usr/local/bin/brew" ]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
  else
    echo "    Skipping Homebrew. Please install it manually from: https://brew.sh/"
  fi
fi

# Step 2: Ensure Node.js is available to run interactive wizard
if ! command -v node &>/dev/null; then
  if command -v brew &>/dev/null; then
    echo ""
    echo "[!] Node.js is required to run the interactive setup wizard."
    read -p "    Install Node.js via Homebrew now? [Y/n]: " ans_node
    ans_node=${ans_node:-Y}
    if [[ "$ans_node" =~ ^[Yy]$ ]]; then
      brew install node
    fi
  fi
fi

if command -v node &>/dev/null; then
  node "$DIR/scripts/setup_ai_engine.js"
else
  # Native fallback if user opted not to install Node.js
  echo ""
  echo "--- Native Fallback Setup (without Node.js) ---"
  if command -v brew &>/dev/null; then
    echo "1. Checking FFmpeg..."
    command -v ffmpeg &>/dev/null || brew install ffmpeg
    echo "2. Checking Whisper CLI..."
    command -v whisper-cli &>/dev/null || command -v whisper-cpp &>/dev/null || brew install whisper-cpp
    
    MODEL_DIR="$HOME/.whisper-models"
    mkdir -p "$MODEL_DIR"
    if [ ! -f "$MODEL_DIR/ggml-base.bin" ] && [ ! -f "$MODEL_DIR/ggml-large-v3.bin" ]; then
      echo "3. Downloading default Whisper base model (~145 MB)..."
      curl -L --progress-bar "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" -o "$MODEL_DIR/ggml-base.bin"
    fi
    echo ""
    echo "✅ AI Engine setup completed successfully!"
  else
    echo "❌ Setup could not complete without Homebrew or Node.js."
    echo "   Please install Homebrew from https://brew.sh and run this script again."
    exit 1
  fi
fi


