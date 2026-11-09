#!/usr/bin/env bash
# ==============================================================================
# bisik by rygh — Windows Distribution Packaging Script
# Packages clean, production-ready Windows ZIP bundle with signed .zxp.
# ==============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
INSTALLER_DIR="$PROJECT_DIR/scripts/windows_installer"
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
BUNDLE_NAME="bisik_by_rygh_Windows_v${VERSION}"
OUTPUT_ZIP="$DIST_DIR/${BUNDLE_NAME}.zip"

echo "=========================================================="
echo " Packaging Windows Distribution: ${BUNDLE_NAME}.zip"
echo "=========================================================="

# 1. Ensure signed ZXP is freshly built
echo "Step 1: Building signed Adobe ZXP package..."
bash "$PROJECT_DIR/scripts/package_zxp.sh"

# 2. Stage distribution bundle contents
STAGE_DIR="$(mktemp -d /tmp/bisik_win_zip_stage_XXXXXX)"
TARGET_FOLDER="$STAGE_DIR/$BUNDLE_NAME"
mkdir -p "$TARGET_FOLDER"

trap 'rm -rf "$STAGE_DIR"' EXIT

echo "Step 2: Staging Windows distribution bundle contents..."
cp "$DIST_DIR/bisik_by_rygh.zxp" "$TARGET_FOLDER/bisik_by_rygh.zxp"
cp "$INSTALLER_DIR/1_Install_Extension.bat" "$TARGET_FOLDER/1_Install_Extension.bat"
cp "$INSTALLER_DIR/2_Setup_AI_Engine.bat" "$TARGET_FOLDER/2_Setup_AI_Engine.bat"
[ -f "$INSTALLER_DIR/setup_ai_engine.ps1" ] && cp "$INSTALLER_DIR/setup_ai_engine.ps1" "$TARGET_FOLDER/setup_ai_engine.ps1"
cp "$INSTALLER_DIR/INSTALLATION_GUIDE.txt" "$TARGET_FOLDER/INSTALLATION_GUIDE.txt"
[ -f "$INSTALLER_DIR/TROUBLESHOOTING.txt" ] && cp "$INSTALLER_DIR/TROUBLESHOOTING.txt" "$TARGET_FOLDER/TROUBLESHOOTING.txt"

# 3. Clean all OS metadata and extended attributes to guarantee a pure, clean archive
echo "Step 3: Stripping OS metadata and extended attributes..."
find "$STAGE_DIR" \( -name ".DS_Store" -o -name "Thumbs.db" -o -name "__MACOSX" -o -name "._*" \) -prune -exec rm -rf {} + 2>/dev/null || true
dot_clean -m "$TARGET_FOLDER" 2>/dev/null || true
xattr -cr "$TARGET_FOLDER" 2>/dev/null || true

# 4. Create ZIP archive with COPYFILE_DISABLE=1 and zip -X to completely omit __MACOSX
echo "Step 4: Creating clean ZIP archive..."
rm -f "$OUTPUT_ZIP"
(
  cd "$STAGE_DIR"
  export COPYFILE_DISABLE=1
  zip -r -X -q "$OUTPUT_ZIP" "$BUNDLE_NAME"
)

echo ""
echo "=========================================================="
echo "[OK] Windows Distribution ZIP created successfully:"
echo "   $OUTPUT_ZIP ($(du -h "$OUTPUT_ZIP" | cut -f1))"
echo "=========================================================="
echo ""
echo "Archive File Manifest:"
unzip -l "$OUTPUT_ZIP"

