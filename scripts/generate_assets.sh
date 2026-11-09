#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SFX_DIR="$ROOT_DIR/assets/sfx"
ASSETS_DIR="$ROOT_DIR/assets"

mkdir -p "$SFX_DIR" "$ASSETS_DIR"

echo "==> Ensuring SFX WAV files in $SFX_DIR ..."

if [ ! -f "$SFX_DIR/bisik_sfx_pop.wav" ] || [ ! -f "$SFX_DIR/bisik_sfx_whoosh.wav" ] || [ ! -f "$SFX_DIR/bisik_sfx_tick.wav" ]; then
  if command -v ffmpeg >/dev/null 2>&1; then
    ffmpeg -y -f lavfi -i "aevalsrc='0.7*sin(2*PI*(320-1800*t)*t)*exp(-28*t)':s=16000:d=0.12" \
      -c:a pcm_s16le "$SFX_DIR/bisik_sfx_pop.wav" >/dev/null 2>&1

    ffmpeg -y -f lavfi -i "anoisesrc=d=0.26:c=pink:r=16000:a=0.5,afade=t=in:ss=0:d=0.12,afade=t=out:st=0.12:d=0.14" \
      -c:a pcm_s16le "$SFX_DIR/bisik_sfx_whoosh.wav" >/dev/null 2>&1

    ffmpeg -y -f lavfi -i "aevalsrc='0.8*sin(2*PI*1400*t)*exp(-75*t)':s=16000:d=0.06" \
      -c:a pcm_s16le "$SFX_DIR/bisik_sfx_tick.wav" >/dev/null 2>&1
  fi
fi

echo "✔ SFX assets verified in $SFX_DIR"
ls -la "$SFX_DIR"
