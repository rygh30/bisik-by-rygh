#!/usr/bin/env node
/**
 * bisik by rygh — Interactive AI Engine Setup (FFmpeg, Whisper CLI & Model Downloader)
 * Cross-platform for macOS and Windows.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { execSync, spawn } = require("child_process");
const https = require("https");

const isWin = process.platform === "win32";
const userHome = os.homedir();
const defaultModelDir = path.join(userHome, ".whisper-models");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function resolveCmd(name, fallbacks = []) {
  const candidates = [name, ...fallbacks];
  for (const c of candidates) {
    try {
      const check = isWin ? `where ${c}` : `which ${c}`;
      const res = execSync(check, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf8" }).trim().split("\n")[0];
      if (res && fs.existsSync(res)) return res;
    } catch (e) {}
  }
  return null;
}

function downloadFileWithProgress(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let downloadedBytes = 0;
    let totalBytes = 0;

    function handleResponse(response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        return https.get(response.headers.location, handleResponse).on("error", reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error(`Server returned HTTP ${response.statusCode}`));
      }

      totalBytes = parseInt(response.headers["content-length"] || "0", 10);

      response.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          const mbDown = (downloadedBytes / (1024 * 1024)).toFixed(1);
          const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
          process.stdout.write(`\r   Downloading: [${pct}%] ${mbDown} MB / ${mbTotal} MB `);
        } else {
          const mbDown = (downloadedBytes / (1024 * 1024)).toFixed(1);
          process.stdout.write(`\r   Downloading: ${mbDown} MB... `);
        }
      });

      response.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          process.stdout.write("\n");
          resolve();
        });
      });
    }

    https.get(url, handleResponse).on("error", (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("       bisik by rygh — AI Engine Setup Wizard          ");
  console.log("=======================================================\n");
  console.log("This wizard configures the local AI engine (FFmpeg + Whisper)");
  console.log("so that your Premiere Pro captions transcribe 100% offline.\n");

  // ---------------------------------------------------------
  // STEP 1: FFmpeg Engine
  // ---------------------------------------------------------
  console.log("-------------------------------------------------------");
  console.log("STEP 1: FFmpeg Audio Engine");
  console.log("-------------------------------------------------------");
  let ffmpegPath = resolveCmd("ffmpeg");

  if (ffmpegPath) {
    console.log(`[✓] FFmpeg is already installed: ${ffmpegPath}\n`);
  } else {
    console.log("[!] FFmpeg was not found in your system PATH.");
    console.log("    FFmpeg is required to extract audio from your timeline clips.");
    const ansFfmpeg = await ask("    Install FFmpeg automatically now? [Y/n]: ");
    const confirmFfmpeg = ansFfmpeg.trim().toLowerCase() !== "n";

    if (confirmFfmpeg) {
      try {
        console.log("\n    Running FFmpeg installation package manager...");
        if (isWin) {
          console.log("    Executing: winget install Gyan.FFmpeg");
          execSync("winget install Gyan.FFmpeg", { stdio: "inherit" });
        } else {
          console.log("    Executing: brew install ffmpeg");
          execSync("brew install ffmpeg", { stdio: "inherit" });
        }
        ffmpegPath = resolveCmd("ffmpeg");
        if (ffmpegPath) {
          console.log(`\n[✓] FFmpeg installed successfully: ${ffmpegPath}\n`);
        } else {
          console.log("\n[!] FFmpeg installed, but terminal needs restart to refresh PATH.\n");
        }
      } catch (err) {
        console.log(`\n[✗] Could not install automatically: ${err.message}`);
        console.log(isWin ? "    Please run manually: winget install Gyan.FFmpeg\n" : "    Please run manually: brew install ffmpeg\n");
      }
    } else {
      console.log("    Skipping FFmpeg installation.\n");
    }
  }

  // ---------------------------------------------------------
  // STEP 2: Whisper AI CLI
  // ---------------------------------------------------------
  console.log("-------------------------------------------------------");
  console.log("STEP 2: Whisper AI Transcription CLI");
  console.log("-------------------------------------------------------");
  let whisperPath = resolveCmd("whisper-cli", ["whisper-cpp", "whisper"]);

  if (whisperPath) {
    console.log(`[✓] Whisper CLI is already installed: ${whisperPath}\n`);
  } else {
    console.log("[!] Whisper CLI was not found in your system PATH.");
    console.log("    Whisper CLI powers fast local speech recognition.");
    const ansWhisper = await ask("    Install Whisper CLI automatically now? [Y/n]: ");
    const confirmWhisper = ansWhisper.trim().toLowerCase() !== "n";

    if (confirmWhisper) {
      try {
        console.log("\n    Running Whisper CLI installation...");
        if (isWin) {
          console.log("    Executing: winget install whisper.cpp");
          execSync("winget install whisper.cpp", { stdio: "inherit" });
        } else {
          console.log("    Executing: brew install whisper-cpp");
          execSync("brew install whisper-cpp", { stdio: "inherit" });
        }
        whisperPath = resolveCmd("whisper-cli", ["whisper-cpp", "whisper"]);
        if (whisperPath) {
          console.log(`\n[✓] Whisper CLI installed successfully: ${whisperPath}\n`);
        } else {
          console.log("\n[!] Whisper CLI installed, but terminal needs restart to refresh PATH.\n");
        }
      } catch (err) {
        console.log(`\n[✗] Could not install automatically: ${err.message}`);
        console.log(isWin ? "    Please run manually: winget install whisper.cpp\n" : "    Please run manually: brew install whisper-cpp\n");
      }
    } else {
      console.log("    Skipping Whisper CLI installation.\n");
    }
  }

  // ---------------------------------------------------------
  // STEP 3: Whisper Model Selection (Lightweight to Maximum Accuracy)
  // ---------------------------------------------------------
  console.log("-------------------------------------------------------");
  console.log("STEP 3: Whisper AI Model Selection & Download");
  console.log("-------------------------------------------------------");
  console.log("Choose the Whisper speech recognition model to download:\n");
  console.log("  [1] Tiny     (~75 MB)   — Super fast, minimal RAM (~1 GB), basic accuracy");
  console.log("  [2] Base     (~145 MB)  — Fast, everyday speech, good standard accuracy");
  console.log("  [3] Small    (~460 MB)  — Great balance of speed & quality (~2 GB RAM)");
  console.log("  [4] Medium   (~1.5 GB)  — High accuracy for Indonesian & multilingual (~5 GB RAM)");
  console.log("  [5] Large-v3 (~3.1 GB)  — MAXIMUM ACCURACY (Best for exact words & punctuation)");
  console.log("  [6] Skip model download (I already have a model)\n");

  const modelChoice = (await ask("Enter your choice [1-6] (Default is 5 - Maximum Accuracy): ")).trim() || "5";

  const modelMap = {
    "1": { name: "ggml-tiny.bin", size: "~75 MB", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin" },
    "2": { name: "ggml-base.bin", size: "~145 MB", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" },
    "3": { name: "ggml-small.bin", size: "~460 MB", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin" },
    "4": { name: "ggml-medium.bin", size: "~1.5 GB", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin" },
    "5": { name: "ggml-large-v3.bin", size: "~3.1 GB", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin" }
  };

  const selectedModel = modelMap[modelChoice];

  if (selectedModel) {
    if (!fs.existsSync(defaultModelDir)) {
      fs.mkdirSync(defaultModelDir, { recursive: true });
    }
    const targetFile = path.join(defaultModelDir, selectedModel.name);

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 10 * 1024 * 1024) {
      console.log(`\n[✓] Model ${selectedModel.name} already exists at: ${targetFile}`);
    } else {
      console.log(`\nReady to download ${selectedModel.name} (${selectedModel.size}) to:`);
      console.log(`   ${targetFile}`);
      const ansDownload = await ask(`Proceed with downloading ${selectedModel.name}? [Y/n]: `);
      const confirmDownload = ansDownload.trim().toLowerCase() !== "n";

      if (confirmDownload) {
        console.log(`\nStarting download from HuggingFace CDN...`);
        try {
          await downloadFileWithProgress(selectedModel.url, targetFile);
          console.log(`[✓] Download complete! Model saved to: ${targetFile}\n`);
        } catch (dlErr) {
          console.log(`\n[✗] Download failed: ${dlErr.message}`);
          console.log(`    You can download manually from: ${selectedModel.url}`);
          console.log(`    and place it into: ${defaultModelDir}\n`);
        }
      } else {
        console.log("    Download skipped.\n");
      }
    }
  } else {
    console.log("    Skipping model download.\n");
  }

  // ---------------------------------------------------------
  // FINAL VERIFICATION
  // ---------------------------------------------------------
  console.log("=======================================================");
  console.log("                 Setup Summary                         ");
  console.log("=======================================================");
  const finalFfmpeg = resolveCmd("ffmpeg");
  const finalWhisper = resolveCmd("whisper-cli", ["whisper-cpp", "whisper"]);
  let finalModel = null;

  if (fs.existsSync(defaultModelDir)) {
    const files = fs.readdirSync(defaultModelDir);
    for (const f of files) {
      if (f.endsWith(".bin")) {
        finalModel = path.join(defaultModelDir, f);
        break;
      }
    }
  }

  console.log(`FFmpeg:      ${finalFfmpeg ? "✓ READY" : "⚠ Not detected in PATH"}`);
  console.log(`Whisper CLI: ${finalWhisper ? "✓ READY" : "⚠ Not detected in PATH"}`);
  console.log(`AI Model:    ${finalModel ? `✓ READY (${path.basename(finalModel)})` : "⚠ No .bin model found"}`);

  console.log("\nPremiere Pro Extension Installation:");
  console.log("1. Double click dist/bisik_by_rygh_installer.pkg (macOS) or run installer (Windows).");
  console.log("2. Open Premiere Pro > Window > Extensions > bisik by rygh.");
  console.log("=======================================================\n");

  rl.close();
}

main().catch((e) => {
  console.error("FATAL ERROR during setup:", e);
  rl.close();
  process.exit(1);
});

