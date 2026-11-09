// scripts/package_zxp.js
// Cross-platform ZXP packaging script for Windows and macOS
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const outputZxp = path.join(dist, "bisik_by_rygh.zxp");
const certFile = path.join(dist, "rygh_bisik_cert.p12");
const tsaUrl = process.env.BISIK_TSA_URL || "";
const certPass = process.env.BISIK_CERT_PASS;

if (!certPass) {
  console.error("ERROR: BISIK_CERT_PASS environment variable must be set (no default password allowed).");
  process.exit(1);
}

if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

const isWin = process.platform === "win32";
const zxpCmd = path.join(dist, isWin ? "ZXPSignCmd.exe" : "ZXPSignCmd");

if (!fs.existsSync(zxpCmd)) {
  console.log(`Downloading ZXPSignCmd 4.1.3 for ${process.platform}...`);
  const url = isWin
    ? "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/ZXPSignCMD/4.1.3/win64/ZXPSignCmd.exe"
    : "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/ZXPSignCMD/4.1.3/macOS/ZXPSignCmd";
  execSync(`curl -sL "${url}" -o "${zxpCmd}"`, { stdio: "inherit" });
  if (!isWin) fs.chmodSync(zxpCmd, 0o755);
}

// Stage production files
const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), "bisik_stage_"));

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    for (const item of items) {
      if (item === ".DS_Store" || item === "Thumbs.db" || item === "__MACOSX" || item === ".debug") continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log("Staging production files (strictly excluding .debug)...");
  copyRecursive(path.join(root, "CSXS"), path.join(stageDir, "CSXS"));
  copyRecursive(path.join(root, "client"), path.join(stageDir, "client"));
  copyRecursive(path.join(root, "host"), path.join(stageDir, "host"));
  copyRecursive(path.join(root, "assets"), path.join(stageDir, "assets"));
  fs.copyFileSync(path.join(root, "package.json"), path.join(stageDir, "package.json"));

  if (!fs.existsSync(certFile)) {
    console.log("Generating self-signed certificate...");
    execSync(`"${zxpCmd}" -selfSignedCert ID Riau "rygh" "bisik_by_rygh" "${certPass}" "${certFile}"`, { stdio: "inherit" });
  }

  if (fs.existsSync(outputZxp)) fs.unlinkSync(outputZxp);

  console.log("Signing package with ZXPSignCmd...");
  const signCmd = tsaUrl
    ? `"${zxpCmd}" -sign "${stageDir}" "${outputZxp}" "${certFile}" "${certPass}" -tsa "${tsaUrl}"`
    : `"${zxpCmd}" -sign "${stageDir}" "${outputZxp}" "${certFile}" "${certPass}"`;
  execSync(signCmd, { stdio: "inherit" });

  console.log("Verifying signed package...");
  execSync(`"${zxpCmd}" -verify "${outputZxp}" -certinfo`, { stdio: "inherit" });

  // Verification check: ensure .debug is NOT in package
  const listOutput = execSync(`unzip -l "${outputZxp}"`, { encoding: "utf8" });
  if (listOutput.includes(".debug")) {
    throw new Error("SECURITY FAILURE: .debug file was bundled into the package!");
  }

  console.log(`[OK] Successfully packaged and verified: ${outputZxp}`);
} finally {
  try {
    fs.rmSync(stageDir, { recursive: true, force: true });
  } catch (e) {}
}
