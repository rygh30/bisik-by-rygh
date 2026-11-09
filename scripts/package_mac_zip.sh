#!/usr/bin/env bash
# ==============================================================================
# bisik by rygh — macOS Distribution Packaging Script
# Builds clean, production-ready ZIP distribution bundle (Option B).
# ==============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
INSTALLER_DIR="$PROJECT_DIR/scripts/mac_installer"
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
BUNDLE_NAME="bisik_by_rygh_macOS_v${VERSION}"
OUTPUT_ZIP="$DIST_DIR/${BUNDLE_NAME}.zip"

echo "=========================================================="
echo " Packaging macOS Distribution: ${BUNDLE_NAME}.zip"
echo "=========================================================="

# 1. Build the freshest component and product package
echo "Step 1: Building macOS Installer Package (.pkg)..."
bash "$PROJECT_DIR/scripts/build_mac_pkg.sh"

# 2. Stage distribution bundle contents
STAGE_DIR="$(mktemp -d /tmp/bisik_zip_stage_XXXXXX)"
TARGET_FOLDER="$STAGE_DIR/$BUNDLE_NAME"
mkdir -p "$TARGET_FOLDER"

trap 'rm -rf "$STAGE_DIR"' EXIT

echo "Step 2: Staging distribution bundle contents..."
cp "$DIST_DIR/bisik_by_rygh_installer.pkg" "$TARGET_FOLDER/1_Install_Bisik_Extension.pkg"
cp "$INSTALLER_DIR/2_Setup_AI_Engine.command" "$TARGET_FOLDER/2_Setup_AI_Engine.command"
chmod 755 "$TARGET_FOLDER/2_Setup_AI_Engine.command"
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
echo "[OK] macOS Distribution ZIP created successfully:"
echo "   $OUTPUT_ZIP ($(du -h "$OUTPUT_ZIP" | cut -f1))"
echo "=========================================================="
echo ""
echo "Archive File Manifest:"
unzip -l "$OUTPUT_ZIP"
