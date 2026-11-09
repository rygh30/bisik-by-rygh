#!/usr/bin/env node
/**
 * bisik by rygh — CLI System Readiness & Dependency Check
 * Runs in terminal during setup/installation on a new computer.
 */

const { checkSystemDependencies } = require("../client/setup.js");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

function resolveExecutable(cmd, fallbacks = []) {
  const candidates = [cmd, ...fallbacks];
  for (const name of candidates) {
    try {
      const isWin = process.platform === "win32";
      const whichCmd = isWin ? `where ${name}` : `which ${name}`;
      const found = execSync(whichCmd, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf8" }).trim().split("\n")[0];
      if (found && fs.existsSync(found)) {
        return found;
      }
    } catch (e) {}
  }
  return cmd;
}

function findAvailableWhisperModel(extRoot, lang) {
  const os = require("os");
  const home = os.homedir();
  const searchDirs = [
    path.join(home, ".whisper-models"),
    path.join(extRoot || "", "assets", "models"),
    path.join(home, "Library", "Application Support", "bisik", "models")
  ];
  const modelNames = [
    "ggml-base.bin",
    "ggml-small.bin",
    "ggml-medium.bin",
    "ggml-tiny.bin",
    "base.bin"
  ];
  for (const dir of searchDirs) {
    for (const name of modelNames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const extRoot = path.resolve(__dirname, "..");
const status = checkSystemDependencies({
  resolveExecutable,
  findAvailableWhisperModel,
  extRoot
});

console.log("\n==================================================");
console.log("   bisik by rygh — System Dependency Verification ");
console.log("==================================================\n");

console.log("1. FFmpeg Audio Engine:");
if (status.ffmpeg.ready) {
  console.log(`   [✓ READY] Found at: ${status.ffmpeg.path}`);
} else {
  console.log(`   [✗ MISSING] Please install via: ${status.ffmpeg.installCmd}`);
}

console.log("\n2. Whisper AI CLI:");
if (status.whisper.ready) {
  console.log(`   [✓ READY] Found at: ${status.whisper.path}`);
} else {
  console.log(`   [✗ MISSING] Please install via: ${status.whisper.installCmd}`);
}

console.log("\n3. Whisper AI Model (GGML):");
if (status.model.ready) {
  console.log(`   [✓ READY] Found at: ${status.model.path}`);
} else {
  console.log(`   [✗ MISSING] Place ggml-base.bin into: ${status.model.targetDir}`);
  console.log("   Download URL: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin");
}

console.log("\n--------------------------------------------------");
if (status.allReady) {
  console.log("Status: ALL DEPENDENCIES READY! Extension is fully operational.\n");
  process.exit(0);
} else {
  console.log("Status: SOME DEPENDENCIES ARE MISSING. See instructions above.\n");
  process.exit(1);
}

