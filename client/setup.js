// client/setup.js - Setup Wizard & Dependency Verification (Task 17)
(function (global) {
  const fs = typeof require !== "undefined" ? require("fs") : null;
  const path = typeof require !== "undefined" ? require("path") : null;
  const os = typeof require !== "undefined" ? require("os") : null;

  function checkSystemDependencies(helpers = {}) {
    const resolveExec = helpers.resolveExecutable || ((name) => name);
    const findModel = helpers.findAvailableWhisperModel || (() => null);

    const ffmpegPath = resolveExec("ffmpeg");
    const whisperPath = resolveExec("whisper-cli", ["whisper-cpp"]);
    const extRoot = helpers.extRoot || "";
    const modelPath = findModel(extRoot, "id");

    const isWin = typeof process !== "undefined" && process.platform === "win32";

    const hasFfmpeg = fs && fs.existsSync ? fs.existsSync(ffmpegPath) : false;
    const hasWhisper = fs && fs.existsSync ? fs.existsSync(whisperPath) : false;
    const hasModel = Boolean(modelPath && fs && fs.existsSync && fs.existsSync(modelPath));

    const allReady = hasFfmpeg && hasWhisper && hasModel;

    const userHome = os && os.homedir ? os.homedir() : "";
    const installCmds = {
      ffmpeg: isWin ? "winget install Gyan.FFmpeg" : "brew install ffmpeg",
      whisper: isWin ? "winget install whisper.cpp" : "brew install whisper-cpp",
      modelDir: path ? path.join(userHome, ".whisper-models") : ".whisper-models"
    };

    return {
      allReady,
      ffmpeg: {
        ready: hasFfmpeg,
        path: hasFfmpeg ? ffmpegPath : null,
        installCmd: installCmds.ffmpeg
      },
      whisper: {
        ready: hasWhisper,
        path: hasWhisper ? whisperPath : null,
        installCmd: installCmds.whisper
      },
      model: {
        ready: hasModel,
        path: modelPath,
        targetDir: installCmds.modelDir
      }
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { checkSystemDependencies };
  }
  if (typeof global !== "undefined") {
    global.checkSystemDependencies = checkSystemDependencies;
  }
})(typeof window !== "undefined" ? window : globalThis);


