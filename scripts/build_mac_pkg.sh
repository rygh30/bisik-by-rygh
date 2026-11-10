#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
INSTALLER_ASSETS_DIR="$PROJECT_DIR/scripts/mac_installer"
OUTPUT_PKG="$DIST_DIR/bisik_by_rygh_installer.pkg"
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")

mkdir -p "$DIST_DIR"
rm -f "$OUTPUT_PKG"

WORK_DIR="$(mktemp -d /tmp/bisik_build_work_XXXXXX)"
STAGE_ROOT="$WORK_DIR/root"
SCRIPTS_DIR="$WORK_DIR/scripts"
RESOURCES_DIR="$WORK_DIR/resources"
COMPONENT_PKG_NAME="bisik_component.pkg"
COMPONENT_PKG="$WORK_DIR/$COMPONENT_PKG_NAME"
DISTRIBUTION_XML="$WORK_DIR/distribution.xml"

trap 'rm -rf "$WORK_DIR"' EXIT

TARGET_EXT_DIR="$STAGE_ROOT/Library/Application Support/Adobe/CEP/extensions/com.rygh.bisik"

echo "1. Staging extension files for macOS PKG installer..."
mkdir -p "$TARGET_EXT_DIR" "$SCRIPTS_DIR" "$RESOURCES_DIR"

cp -R "$PROJECT_DIR/CSXS" "$TARGET_EXT_DIR/"
cp -R "$PROJECT_DIR/client" "$TARGET_EXT_DIR/"
cp -R "$PROJECT_DIR/host" "$TARGET_EXT_DIR/"
cp -R "$PROJECT_DIR/assets" "$TARGET_EXT_DIR/"
cp "$PROJECT_DIR/package.json" "$TARGET_EXT_DIR/"

# Strip OS metadata, temporary and development-only files
export COPYFILE_DISABLE=1
find "$STAGE_ROOT" \( -name ".DS_Store" -o -name "Thumbs.db" -o -name "__MACOSX" -o -name ".debug" -o -name "._*" \) -prune -exec rm -rf {} + 2>/dev/null || true
dot_clean -m "$STAGE_ROOT" 2>/dev/null || true
xattr -cr "$STAGE_ROOT" 2>/dev/null || true

# Prepare dedicated scripts folder (only postinstall)
cp "$INSTALLER_ASSETS_DIR/postinstall" "$SCRIPTS_DIR/postinstall"
chmod +x "$SCRIPTS_DIR/postinstall"

# Prepare GUI installer resources (EULA License)
if [ -f "$INSTALLER_ASSETS_DIR/License.txt" ]; then
  cp "$INSTALLER_ASSETS_DIR/License.txt" "$RESOURCES_DIR/License.txt"
elif [ -f "$INSTALLER_ASSETS_DIR/eula.txt" ]; then
  cp "$INSTALLER_ASSETS_DIR/eula.txt" "$RESOURCES_DIR/License.txt"
fi

echo "2. Building component package (pkgbuild)..."
pkgbuild --root "$STAGE_ROOT" \
         --identifier "com.rygh.bisik.pkg" \
         --version "$VERSION" \
         --install-location "/" \
         --scripts "$SCRIPTS_DIR" \
         "$COMPONENT_PKG"

echo "3. Creating distribution specification with EULA license..."
cat << EOF > "$DISTRIBUTION_XML"
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>bisik by rygh</title>
    <options customize="never" require-scripts="false" hostArchitectures="x86_64,arm64"/>
    <license file="License.txt" mime-type="text/plain"/>
    <choices-outline>
        <line choice="default">
            <line choice="com.rygh.bisik.pkg"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="com.rygh.bisik.pkg" visible="false">
        <pkg-ref id="com.rygh.bisik.pkg"/>
    </choice>
    <pkg-ref id="com.rygh.bisik.pkg" version="$VERSION" onConclusion="none">$COMPONENT_PKG_NAME</pkg-ref>
</installer-gui-script>
EOF

echo "4. Packaging final product installer (productbuild)..."
productbuild --distribution "$DISTRIBUTION_XML" \
             --resources "$RESOURCES_DIR" \
             --package-path "$WORK_DIR" \
             "$OUTPUT_PKG"

# Optional Apple Developer ID Signing if certificate is available in Keychain/environment
DEV_INSTALLER_CERT="${BISIK_DEV_INSTALLER_CERT:-}"
if [ -n "$DEV_INSTALLER_CERT" ]; then
  echo "5. Signing package with Developer ID Installer certificate: $DEV_INSTALLER_CERT..."
  SIGNED_TMP="$WORK_DIR/signed.pkg"
  productsign --sign "$DEV_INSTALLER_CERT" "$OUTPUT_PKG" "$SIGNED_TMP"
  mv "$SIGNED_TMP" "$OUTPUT_PKG"
  echo "[OK] Package successfully signed with Developer ID Installer!"
fi

echo "[OK] Successfully built macOS Installer Package:"
echo "   $OUTPUT_PKG ($(du -h "$OUTPUT_PKG" | cut -f1))"
