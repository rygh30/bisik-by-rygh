#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
ZXP_CMD="$DIST_DIR/ZXPSignCmd"
CERT_FILE="$DIST_DIR/rygh_bisik_cert.p12"
OUTPUT_ZXP="$DIST_DIR/bisik_by_rygh.zxp"
TSA_URL="${BISIK_TSA_URL:-}"

# Load optional local environment config if present (untracked in git)
if [ -f "$PROJECT_DIR/.env.local" ]; then
  # shellcheck source=/dev/null
  source "$PROJECT_DIR/.env.local"
elif [ -f "$PROJECT_DIR/.env" ]; then
  # shellcheck source=/dev/null
  source "$PROJECT_DIR/.env"
fi

BISIK_CERT_PASS="${BISIK_CERT_PASS:-}"

mkdir -p "$DIST_DIR"

# Download official 4.1.3 ZXPSignCmd if missing
if [ ! -f "$ZXP_CMD" ] || [ $(wc -c <"$ZXP_CMD") -lt 1000000 ]; then
  echo "Downloading ZXPSignCmd 4.1.3 for macOS..."
  curl -sL "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/ZXPSignCMD/4.1.3/macOS/ZXPSignCmd" -o "$ZXP_CMD"
  chmod +x "$ZXP_CMD"
  codesign -s - -f "$ZXP_CMD" 2>/dev/null || true
  xattr -c "$ZXP_CMD" 2>/dev/null || true
fi

rm -rf "$PROJECT_DIR/temp/"*
rm -f "$OUTPUT_ZXP"

echo "Staging production files for bisik by rygh..."
STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT

# Copy ONLY production assets (NOTE: .debug is strictly excluded)
cp -R "$PROJECT_DIR/CSXS" "$STAGE_DIR/"
cp -R "$PROJECT_DIR/client" "$STAGE_DIR/"
cp -R "$PROJECT_DIR/host" "$STAGE_DIR/"
cp -R "$PROJECT_DIR/assets" "$STAGE_DIR/"
cp "$PROJECT_DIR/package.json" "$STAGE_DIR/"

# Strip OS metadata
find "$STAGE_DIR" \( -name ".DS_Store" -o -name "Thumbs.db" -o -name "__MACOSX" \) -prune -exec rm -rf {} +

if [ ! -f "$CERT_FILE" ]; then
  if [ -z "$BISIK_CERT_PASS" ]; then
    BISIK_CERT_PASS=$(openssl rand -hex 16 2>/dev/null || date +%s)
  fi
  echo "Generating self-signed certificate for bisik by rygh..."
  "$ZXP_CMD" -selfSignedCert ID Riau "rygh" "bisik_by_rygh" "$BISIK_CERT_PASS" "$CERT_FILE"
fi

if [ -z "$BISIK_CERT_PASS" ]; then
  echo "ERROR: BISIK_CERT_PASS environment variable is required to sign with existing certificate." >&2
  echo "Please set BISIK_CERT_PASS in your environment or in .env.local" >&2
  exit 1
fi

echo "Signing package with ZXPSignCmd..."
if [ -n "$TSA_URL" ]; then
  "$ZXP_CMD" -sign "$STAGE_DIR" "$OUTPUT_ZXP" "$CERT_FILE" "$BISIK_CERT_PASS" -tsa "$TSA_URL"
else
  "$ZXP_CMD" -sign "$STAGE_DIR" "$OUTPUT_ZXP" "$CERT_FILE" "$BISIK_CERT_PASS"
fi

echo "Verifying ZXP signature..."
"$ZXP_CMD" -verify "$OUTPUT_ZXP" -certinfo

if unzip -l "$OUTPUT_ZXP" | grep -q '\.debug'; then
  echo "SECURITY ERROR: .debug file found inside production package!" >&2
  exit 1
fi

echo "[OK] Successfully built signed production package: $OUTPUT_ZXP"
ls -lh "$OUTPUT_ZXP"
