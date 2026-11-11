// client/main.js
// bisik by rygh — Clean Golden Ratio Studio Orchestrator

const csInterface = typeof CSInterface !== "undefined" ? new CSInterface() : null;
const fs = require("fs");
const path = require("path");
const { spawn, execSync, execFileSync } = require("child_process");
const os = require("os");

function getUserDataDir() {
  let baseDir = "";
  try {
    if (csInterface && csInterface.getSystemPath && typeof SystemPath !== "undefined" && SystemPath.USER_DATA) {
      baseDir = csInterface.getSystemPath(SystemPath.USER_DATA);
    }
  } catch (e) { }

  if (!baseDir) {
    if (process.platform === "darwin") {
      baseDir = path.join(os.homedir(), "Library", "Application Support");
    } else if (process.platform === "win32") {
      baseDir = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    } else {
      baseDir = os.homedir();
    }
  }

  const targetDir = path.join(baseDir, "bisik by rygh");
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } catch (e) { }
  return targetDir;
}

const userDataDir = getUserDataDir();
const PRESET_FILE = path.join(userDataDir, "presets.json");
const SETTINGS_FILE = path.join(userDataDir, "settings.json");

// Legacy dotfile locations for auto-migration (Task 24)
const LEGACY_DOT_PRESET = path.join(os.homedir(), ".bisik-by-rygh-presets.json");
const LEGACY_DOT_SETTINGS = path.join(os.homedir(), ".bisik-by-rygh-settings.json");

function writeJsonAtomic(file, obj) {
  const dir = path.dirname(file);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (_) { }

  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  try {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, file + ".bak");
    }
  } catch (_) { }
  try {
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
    try { fs.unlinkSync(tmp); } catch (_) { }
  }
}

function readJsonSafe(file, defaultValue = null) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    }
  } catch (e) {
    const bak = file + ".bak";
    try {
      if (fs.existsSync(bak)) {
        const bakContent = fs.readFileSync(bak, "utf8");
        return JSON.parse(bakContent);
      }
    } catch (_) { }
    if (typeof setStatus === "function") {
      setStatus(`Config ${path.basename(file)} was corrupted and restored to default.`, "warning");
    }
  }
  return defaultValue;
}

const LEGACY_STYLE_MAP = {
  "bisik_Netflix_Cinema.mogrt": "bisik_clean-cut.mogrt",
  "bisik_Cinema_Subtitle.mogrt": "bisik_clean-cut.mogrt",
  "bisik_Minimal_Fade.mogrt": "bisik_soft-fade.mogrt",
  "bisik_Spring_Rise.mogrt": "bisik_spring-rise.mogrt",
  "bisik_Blur_Pop.mogrt": "bisik_blur-focus.mogrt",
  "bisik_Karaoke_Pill.mogrt": "bisik_karaoke-fill.mogrt",
  "bisik_Marker_Highlight.mogrt": "bisik_underline-sweep.mogrt",
  "bisik_Box_Tape.mogrt": "bisik_highlight-box.mogrt",
  "bisik_Bento_Card.mogrt": "bisik_box-wipe.mogrt",
  "bisik_Stomp_Impact.mogrt": "bisik_pop-bounce.mogrt",
  "bisik_Cyber_Glitch.mogrt": "bisik_soft-glitch.mogrt",
  "bisik_Archival_Type.mogrt": "bisik_typewriter.mogrt",
  "bisik_Editorial_Serif.mogrt": "bisik_clean-cut.mogrt",
  "bisik_Cinema_Broadcast.mogrt": "bisik_clean-cut.mogrt",
  "bisik_Cut_Accent.mogrt": "bisik_clean-cut.mogrt",
  "bisik_Neon_Glow.mogrt": "bisik_active-highlight.mogrt"
};

function migrateStyleName(styleName) {
  if (!styleName) return "bisik_clean-cut.mogrt";
  if (LEGACY_STYLE_MAP[styleName]) return LEGACY_STYLE_MAP[styleName];
  return styleName;
}

const getEl = (id) => (typeof document !== "undefined" && document.getElementById ? document.getElementById(id) : null);
const queryEl = (sel) => (typeof document !== "undefined" && document.querySelector ? document.querySelector(sel) : null);

function jsxStringLiteral(s) {
  // Safe ExtendScript string literal for any JS string (paths, etc.)
  return JSON.stringify(String(s))
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function writePayloadFile(payloadObj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bisik_payload_"));
  const file = path.join(dir, "payload.json");
  fs.writeFileSync(file, JSON.stringify(payloadObj), "utf8"); // UTF-8, no BOM
  return file;
}

// ============================================================================
// ADOBE SPECTRUM THEME SYNCHRONIZATION (4 BRIGHTNESS LEVELS)
// ============================================================================
function syncThemeWithHost() {
  try {
    const hostEnv = csInterface?.getHostEnvironment();
    if (!hostEnv || !hostEnv.appSkinInfo) return;
    const skin = hostEnv.appSkinInfo;
    const bgRgb = skin.panelBackgroundColor.color;
    const brightness = Math.round((bgRgb.red + bgRgb.green + bgRgb.blue) / 3);
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (!root) return;

    if (brightness < 45) {
      // Darkest Theme (Premiere Pro)
      root.style.setProperty("--bg", "#181818");
      root.style.setProperty("--card", "#222222");
      root.style.setProperty("--surface", "#161616");
      root.style.setProperty("--border", "#333333");
      root.style.setProperty("--text", "#E6E6E6");
      root.style.setProperty("--muted", "#888888");
    } else if (brightness < 120) {
      // Standard Dark Theme (Premiere Pro default #262626)
      root.style.setProperty("--bg", "#202020");
      root.style.setProperty("--card", "#2B2B2B");
      root.style.setProperty("--surface", "#1B1B1B");
      root.style.setProperty("--border", "#3E3E3E");
      root.style.setProperty("--text", "#ECECEC");
      root.style.setProperty("--muted", "#9E9E9E");
    } else if (brightness < 195) {
      // Medium Light Theme
      root.style.setProperty("--bg", "#C8C8C8");
      root.style.setProperty("--card", "#D6D6D6");
      root.style.setProperty("--surface", "#BFBFBF");
      root.style.setProperty("--border", "#AAAAAA");
      root.style.setProperty("--text", "#222222");
      root.style.setProperty("--muted", "#555555");
    } else {
      // Lightest Theme
      root.style.setProperty("--bg", "#F2F2F2");
      root.style.setProperty("--card", "#FFFFFF");
      root.style.setProperty("--surface", "#E5E5E5");
      root.style.setProperty("--border", "#D4D4D4");
      root.style.setProperty("--text", "#1A1A1A");
      root.style.setProperty("--muted", "#6E6E6E");
    }
  } catch (e) { }
}

if (csInterface && typeof CSInterface !== "undefined") {
  csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, syncThemeWithHost);
}

const ADOBE_TICKS_PER_SECOND = 254016000000;

/**
 * Simpler & Symmetrical 4x2 Palette (8 Curated Kinetic + Documentary Colors)
 */
const SPECTRUM_SWATCHES = [
  { name: "Lime", fullName: "Acid Lime", hex: "#9dff00", rgb: [0.616, 1.0, 0.0] },
  { name: "Coral", fullName: "Coral Red", hex: "#ff5252", rgb: [1.0, 0.322, 0.322] },
  { name: "Gold", fullName: "Bisik Gold", hex: "#ffc400", rgb: [1.0, 0.769, 0.0] },
  { name: "Cyan", fullName: "Electric Cyan", hex: "#00e5ff", rgb: [0.0, 0.898, 1.0] },
  { name: "Vox", fullName: "Vox Yellow", hex: "#ffe600", rgb: [1.0, 0.902, 0.0] },
  { name: "Amber", fullName: "Cinema Amber", hex: "#ff9100", rgb: [1.0, 0.569, 0.0] },
  { name: "Azure", fullName: "Ice Blue", hex: "#40c4ff", rgb: [0.251, 0.769, 1.0] },
  { name: "White", fullName: "Pure White", hex: "#ffffff", rgb: [1.0, 1.0, 1.0] }
];

/**
 * 20 Animation Styles categorized into Calm, Word, Dynamic, and Style
 * Schema-driven presets based on caption-presets.json
 */
const BISIK_ANIMATION_STYLES = [
  // 1. CALM (6 Presets)
  {
    id: "clean-cut",
    mogrt: "bisik_clean-cut.mogrt",
    name: "Clean Cut",
    title: "Clean Cut",
    category: "calm",
    cssClass: "anim-clean-cut",
    previewHtml: '“I know what we have to do now.”',
    description: "Tanpa animasi. Muncul dan hilang langsung, gaya caption film.",
    heavy: false,
    requiresWordTiming: false,
    isDefault: true,
    favorite: true
  },
  {
    id: "soft-fade",
    mogrt: "bisik_soft-fade.mogrt",
    name: "Soft Fade",
    title: "Soft Fade",
    category: "calm",
    cssClass: "anim-soft-fade",
    previewHtml: 'quiet <span class="aw">cinematic</span> voice',
    description: "Fade in dan fade out halus.",
    heavy: false,
    requiresWordTiming: false,
    favorite: true
  },
  {
    id: "rise-fade",
    mogrt: "bisik_rise-fade.mogrt",
    name: "Rise & Fade",
    title: "Rise & Fade",
    category: "calm",
    cssClass: "anim-rise-fade",
    previewHtml: 'smooth <span class="aw">rising</span> voice',
    description: "Naik sedikit sambil fade in.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "blur-focus",
    mogrt: "bisik_blur-focus.mogrt",
    name: "Blur Focus",
    title: "Blur Focus",
    category: "calm",
    cssClass: "anim-blur-focus",
    previewHtml: 'from blur to <span class="aw">sharp</span>',
    description: "Dari blur ke tajam sambil fade in (Heavy di 4K).",
    heavy: true,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "slow-drift",
    mogrt: "bisik_slow-drift.mogrt",
    name: "Slow Drift",
    title: "Slow Drift",
    category: "calm",
    cssClass: "anim-slow-drift",
    previewHtml: 'gentle <span class="aw">panoramic</span> scale',
    description: "Zoom sangat pelan sepanjang durasi caption.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "tracking-settle",
    mogrt: "bisik_tracking-settle.mogrt",
    name: "Tracking Settle",
    title: "Tracking Settle",
    category: "calm",
    cssClass: "anim-tracking-settle",
    previewHtml: 'modern <span class="aw">spaced</span> letters',
    description: "Jarak antar huruf melebar lalu merapat ke normal.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },

  // 2. WORD (6 Presets)
  {
    id: "word-reveal",
    mogrt: "bisik_word-reveal.mogrt",
    name: "Word Reveal",
    title: "Word Reveal",
    category: "word",
    cssClass: "anim-word-reveal",
    previewHtml: 'words appear <span class="aw">as spoken</span>',
    description: "Kata muncul satu per satu sesuai ucapan.",
    heavy: false,
    requiresWordTiming: true,
    favorite: true
  },
  {
    id: "karaoke-fill",
    mogrt: "bisik_karaoke-fill.mogrt",
    name: "Karaoke Fill",
    title: "Karaoke Fill",
    category: "word",
    cssClass: "anim-karaoke-fill",
    previewHtml: 'edit faster in <span class="aw">Premiere</span>',
    description: "Warna mengisi dari kiri ke kanan mengikuti kata aktif.",
    heavy: false,
    requiresWordTiming: true,
    favorite: true
  },
  {
    id: "active-highlight",
    mogrt: "bisik_active-highlight.mogrt",
    name: "Active Highlight",
    title: "Active Highlight",
    category: "word",
    cssClass: "anim-active-highlight",
    previewHtml: 'spoken words <span class="aw">stand out</span>',
    description: "Kata aktif putih penuh, kata lain redup.",
    heavy: false,
    requiresWordTiming: true,
    favorite: true
  },
  {
    id: "highlight-box",
    mogrt: "bisik_highlight-box.mogrt",
    name: "Highlight Box",
    title: "Highlight Box",
    category: "word",
    cssClass: "anim-highlight-box",
    previewHtml: 'follow the <span class="aw">active</span> box',
    description: "Kotak berwarna bergeser di belakang kata aktif.",
    heavy: false,
    requiresWordTiming: true,
    favorite: true
  },
  {
    id: "underline-sweep",
    mogrt: "bisik_underline-sweep.mogrt",
    name: "Underline Sweep",
    title: "Underline Sweep",
    category: "word",
    cssClass: "anim-underline-sweep",
    previewHtml: 'clean <span class="aw">underlined</span> words',
    description: "Garis bawah menyapu mengikuti kata aktif.",
    heavy: false,
    requiresWordTiming: true,
    favorite: false
  },
  {
    id: "scale-focus",
    mogrt: "bisik_scale-focus.mogrt",
    name: "Scale Focus",
    title: "Scale Focus",
    category: "word",
    cssClass: "anim-scale-focus",
    previewHtml: 'focus on the <span class="aw">active</span> word',
    description: "Kata aktif membesar 110%, kata lain redup.",
    heavy: false,
    requiresWordTiming: true,
    favorite: false
  },

  // 3. DYNAMIC (6 Presets)
  {
    id: "pop-bounce",
    mogrt: "bisik_pop-bounce.mogrt",
    name: "Pop Bounce",
    title: "Pop Bounce",
    category: "dynamic",
    cssClass: "anim-pop-bounce",
    previewHtml: 'high energy <span class="aw">punchy</span> pop',
    description: "Tiap kata muncul dengan overshoot kecil.",
    heavy: false,
    requiresWordTiming: true,
    favorite: true
  },
  {
    id: "spring-rise",
    mogrt: "bisik_spring-rise.mogrt",
    name: "Spring Rise",
    title: "Spring Rise",
    category: "dynamic",
    cssClass: "anim-spring-rise",
    previewHtml: 'elastic <span class="aw">spring</span> bounce',
    description: "Animasi pegas elastis memantul naik secara dinamis.",
    heavy: false,
    requiresWordTiming: false,
    favorite: true
  },
  {
    id: "typewriter",
    mogrt: "bisik_typewriter.mogrt",
    name: "Typewriter",
    title: "Typewriter",
    category: "dynamic",
    cssClass: "anim-typewriter",
    previewHtml: 'DOCUMENT: <span class="aw">CLASSIFIED|</span>',
    description: "Huruf muncul berurutan, kursor opsional.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "mask-slide",
    mogrt: "bisik_mask-slide.mogrt",
    name: "Mask Slide",
    title: "Mask Slide",
    category: "dynamic",
    cssClass: "anim-mask-slide",
    previewHtml: 'lines slide <span class="aw">from bottom</span>',
    description: "Teks terungkap dari bawah lewat mask per baris.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "wave-in",
    mogrt: "bisik_wave-in.mogrt",
    name: "Wave In",
    title: "Wave In",
    category: "dynamic",
    cssClass: "anim-wave-in",
    previewHtml: 'gentle <span class="aw">flowing</span> ripple',
    description: "Huruf naik-turun ringan seperti gelombang saat masuk.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "soft-glitch",
    mogrt: "bisik_soft-glitch.mogrt",
    name: "Soft Glitch",
    title: "Soft Glitch",
    category: "dynamic",
    cssClass: "anim-soft-glitch",
    previewHtml: 'subtle <span class="aw">RGB split</span> glitch',
    description: "RGB split singkat di awal, lalu stabil (Heavy di 4K).",
    heavy: true,
    requiresWordTiming: false,
    favorite: false
  },

  // 4. STYLE (3 Presets)
  {
    id: "box-wipe",
    mogrt: "bisik_box-wipe.mogrt",
    name: "Box Wipe",
    title: "Box Wipe",
    category: "style",
    cssClass: "anim-box-wipe",
    previewHtml: '<span class="aw">translucent</span> contrast box',
    description: "Kotak semi-transparan melebar dulu, lalu teks muncul (Heavy).",
    heavy: true,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "line-roll",
    mogrt: "bisik_line-roll.mogrt",
    name: "Line Roll",
    title: "Line Roll",
    category: "style",
    cssClass: "anim-line-roll",
    previewHtml: 'seamless <span class="aw">rolling</span> lines',
    description: "Baris lama naik keluar, baris baru masuk dari bawah.",
    heavy: false,
    requiresWordTiming: false,
    favorite: false
  },
  {
    id: "keyword-accent",
    mogrt: "bisik_keyword-accent.mogrt",
    name: "Keyword Accent",
    title: "Keyword Accent",
    category: "style",
    cssClass: "anim-keyword-accent",
    previewHtml: 'special words <span class="aw">accented</span>',
    description: "Angka, nama, atau kata kunci otomatis berwarna aksen.",
    heavy: false,
    requiresWordTiming: true,
    favorite: false
  }
];

const DEFAULT_PRESETS = [
  {
    name: "Clean Cut • Natural White",
    style: "bisik_clean-cut.mogrt",
    font: "Inter-Medium",
    wordsPerClip: 4,
    highlightMode: "off",
    highlightColor: "#FFD60A",
    posY: "880",
    scale: 100,
    dualLine: false
  },
  {
    name: "Soft Fade • Cerulean",
    style: "bisik_soft-fade.mogrt",
    font: "Roboto-Medium",
    wordsPerClip: 3,
    highlightMode: "active",
    highlightColor: "#0070D2",
    posY: "880",
    scale: 100,
    dualLine: false
  },
  {
    name: "Word Reveal • Amber Gold",
    style: "bisik_word-reveal.mogrt",
    font: "Inter-Medium",
    wordsPerClip: 3,
    highlightMode: "active",
    highlightColor: "#FFD60A",
    posY: "880",
    scale: 100,
    dualLine: false
  },
  {
    name: "Pop Bounce • Pure Green",
    style: "bisik_pop-bounce.mogrt",
    font: "Inter-Medium",
    wordsPerClip: 4,
    highlightMode: "both",
    highlightColor: "#00C828",
    posY: "880",
    scale: 100,
    dualLine: true
  }
];

const state = {
  words: [],
  presets: [],
  selectedHex: "#FFC400",
  fontColorHex: "#FFFFFF",
  boxColorHex: "#F43F5E",
  colorTarget: "box",
  lastActiveIndex: -1,
  caseMode: 0
};

const statusBar = getEl("statusBar");
const audioSelect = getEl("audioTrackSelect");
const videoSelect = getEl("videoTrackSelect");
const wordGrid = getEl("wordGrid");
const btnRender = getEl("btnRender");
const playheadBadge = getEl("playheadBadge");
const wordCountBadge = getEl("wordCountBadge");
const presetSelect = getEl("presetSelect");
const activeHexLabel = getEl("activeHexLabel");

function formatHumanError(err) {
  const str = String(err?.message || err || "").trim();
  if (!str) return "An unexpected error occurred.";
  if (str.includes("No active sequence") || str.includes("No sequence")) {
    return "No active timeline sequence. Open a sequence in Premiere Pro.";
  }
  if (str.includes("ffmpeg") || str.includes("FFmpeg")) {
    return "FFmpeg conversion failed. Check that FFmpeg is installed and media is accessible.";
  }
  if (str.includes("whisper") || str.includes("spawn whisper") || str.includes("ENOENT")) {
    return "Whisper engine executable not found. Verify whisper-cli installation in PATH.";
  }
  if (str.includes("SIGKILL") || str.includes("cancelled")) {
    return "Transcription process was cancelled.";
  }
  if (str.includes("Missing MOGRT") || str.includes("assets/")) {
    return "Missing MOGRT template in extension assets folder.";
  }
  if (str.includes("tracks") || str.includes("audio track")) {
    return "Unable to access audio tracks on current sequence.";
  }
  if (str.includes("JSON") || str.includes("SyntaxError")) {
    return "Invalid data format encountered.";
  }
  const firstLine = str.split("\n")[0].trim();
  return firstLine.length > 75 ? firstLine.slice(0, 72) + "..." : firstLine;
}

function setStatus(msg, type = "info") {
  if (!statusBar) return;
  statusBar.className = "status-bar";
  if (type === "error") {
    statusBar.classList.add("status-error");
    statusBar.textContent = "✕ " + formatHumanError(msg);
  } else if (type === "success") {
    statusBar.classList.add("status-success");
    statusBar.textContent = "✓ " + msg;
  } else if (type === "warning") {
    statusBar.classList.add("status-warning");
    statusBar.textContent = "⚠ " + msg;
  } else {
    statusBar.classList.add("status-info");
    statusBar.textContent = "• " + msg;
  }
}

function evalJSX(script, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let timer = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        reject(new Error(`ExtendScript call timed out after ${timeoutMs}ms: ${script.slice(0, 80)}`));
      }, timeoutMs);
    }
    try {
      if (typeof csInterface === "undefined" || !csInterface.evalScript) {
        if (timer) clearTimeout(timer);
        return resolve("{}");
      }
      csInterface.evalScript(script, (res) => {
        if (timer) clearTimeout(timer);
        resolve(res);
      });
    } catch (err) {
      if (timer) clearTimeout(timer);
      reject(err);
    }
  });
}

const MIN_CLIP_DURATION_SEC = 0.83;

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return "00:00.0";
  const tenths = Math.round(Number(sec) * 10);
  const m = Math.floor(tenths / 600);
  const s = (tenths % 600) / 10;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

function formatSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(Number(seconds) * 1000) || 0);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(ms, 3)}`;
}

function parseSrtTime(timeStr) {
  const parts = timeStr.trim().replace(",", ".").split(":");
  if (parts.length !== 3) return 0;
  return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}

function secondsToTimecode(seconds, fps = 25) {
  const safeSec = Math.max(0, Number(seconds) || 0);
  const nominalFps = Math.max(1, Math.round(fps));
  const totalFrames = Math.round(safeSec * nominalFps);

  const frames = totalFrames % nominalFps;
  const totalSeconds = Math.floor(totalFrames / nominalFps);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

function timecodeToSeconds(tcString, fps = 25) {
  if (typeof tcString !== "string") return 0;
  const parts = tcString.trim().split(":").map((n) => parseInt(n, 10) || 0);
  if (parts.length !== 4) return 0;
  const [hh, mm, ss, ff] = parts;
  const nominalFps = Math.max(1, Math.round(fps));
  return Number((hh * 3600 + mm * 60 + ss + ff / nominalFps).toFixed(4));
}

function secondsToQuantizedTicks(seconds, fpsOrTicksPerFrame = 25) {
  const sec = Math.max(0, Number(seconds) || 0);
  let ticksPerFrame;
  if (fpsOrTicksPerFrame > 1000) {
    ticksPerFrame = fpsOrTicksPerFrame;
  } else {
    const fps = Math.max(1, Number(fpsOrTicksPerFrame) || 25);
    ticksPerFrame = Math.round(ADOBE_TICKS_PER_SECOND / fps);
  }
  const rawTicks = sec * ADOBE_TICKS_PER_SECOND;
  const frameIndex = Math.round(rawTicks / ticksPerFrame);
  return String(Math.round(frameIndex * ticksPerFrame));
}

function ticksToSeconds(ticksValue) {
  const ticks = Number(ticksValue) || 0;
  return Number((ticks / ADOBE_TICKS_PER_SECOND).toFixed(6));
}

// Convert #HEX to Normalized Float Array [r, g, b] (0.0 to 1.0) for After Effects Expressions
function hexToNormalizedFloatRgb(hex) {
  const clean = (hex || "#FFC400").replace("#", "");
  const num = parseInt(clean, 16);
  const r = Number((((num >> 16) & 255) / 255).toFixed(3));
  const g = Number((((num >> 8) & 255) / 255).toFixed(3));
  const b = Number(((num & 255) / 255).toFixed(3));
  return [r, g, b];
}

function autoDetectKeyword(word) {
  const clean = word.toLowerCase().replace(/[^a-z0-9%$Rp]/gi, "");
  if (!clean) return false;
  return /[0-9%$]/.test(clean) || clean.startsWith("rp");
}

function readWavDurationSec(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(12);
    fs.readSync(fd, header, 0, 12, 0);

    if (header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WAVE") {
      fs.closeSync(fd);
      const st = fs.statSync(filePath);
      return Math.max(0.01, (st.size - 44) / 32000);
    }

    let byteRate = 32000;
    let dataSize = 0;
    let offset = 12;
    const chunkHeader = Buffer.alloc(8);
    const fileStat = fs.statSync(filePath);

    while (offset + 8 <= fileStat.size) {
      fs.readSync(fd, chunkHeader, 0, 8, offset);
      const chunkId = chunkHeader.toString("ascii", 0, 4);
      const chunkSize = chunkHeader.readUInt32LE(4);

      if (chunkId === "fmt ") {
        const fmtBuf = Buffer.alloc(16);
        fs.readSync(fd, fmtBuf, 0, Math.min(16, chunkSize), offset + 8);
        const channels = fmtBuf.readUInt16LE(2);
        const sampleRate = fmtBuf.readUInt32LE(4);
        byteRate = fmtBuf.readUInt32LE(8);
        if (!byteRate || byteRate === 0) {
          const bitsPerSample = fmtBuf.length >= 16 ? fmtBuf.readUInt16LE(14) : 16;
          byteRate = sampleRate * channels * (bitsPerSample / 8);
        }
      } else if (chunkId === "data") {
        dataSize = chunkSize;
        break;
      }

      const paddedSize = chunkSize + (chunkSize % 2);
      offset += 8 + paddedSize;
    }

    fs.closeSync(fd);

    if (dataSize > 0 && byteRate > 0) {
      return Number((dataSize / byteRate).toFixed(6));
    }
    return Math.max(0.01, (fileStat.size - 44) / Math.max(1, byteRate));
  } catch (err) {
    try {
      const st = fs.statSync(filePath);
      return Math.max(0.01, (st.size - 44) / 32000);
    } catch (e) {
      return 0.05;
    }
  }
}

function mapMasterToTimeline(zones, startSec, endSec) {
  if (!Array.isArray(zones) || zones.length === 0) return null;
  const mid = (startSec + endSec) / 2;
  const z = zones.find((zz) => mid >= zz.masterStart && mid < zz.masterEnd);
  if (!z || z.kind === "silence") return null; // drop hallucinated words

  const ratio = Number(z.speedRatio) || 1.0;
  const map = (t) => z.timelineStart + (t - z.masterStart) / ratio;
  const s = map(startSec);
  const e = Math.min(map(endSec), z.timelineEnd);
  return {
    start: Number(s.toFixed(3)),
    end: Number(Math.max(e, s).toFixed(3))
  };
}

function splitWordAtSpaces(wordObj) {
  if (!wordObj || !wordObj.text) return [wordObj];
  const parts = wordObj.text.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [wordObj];

  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);
  const totalDur = Math.max(0.05, wordObj.end - wordObj.start);
  const result = [];
  let curStart = wordObj.start;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const frac = totalChars > 0 ? (part.length / totalChars) : (1 / parts.length);
    const dur = totalDur * frac;
    const curEnd = (i === parts.length - 1) ? wordObj.end : (curStart + dur);
    result.push({
      text: part,
      start: Number(curStart.toFixed(3)),
      end: Number(Math.max(curEnd, curStart + 0.05).toFixed(3)),
      isKeyword: autoDetectKeyword(part),
      forceBreak: (i === parts.length - 1) ? (wordObj.forceBreak || /[.?!]$/.test(part)) : false
    });
    curStart = curEnd;
  }
  return result;
}

function reconstructFullWords(tokens) {
  const words = [];
  let cur = null;

  for (const t of tokens) {
    const rawText = t.text || "";
    const trimmed = rawText.trim();
    if (!trimmed || /^(\[.*\]|\(.*\))$/.test(trimmed)) {
      if (cur) {
        words.push(cur);
        cur = null;
      }
      continue;
    }

    const startsWithSpace = /^\s/.test(rawText);
    const isPunctOnly = /^[.,!?:;\-\–\—"'«»“”‘’…]+$/.test(trimmed);

    if (!cur || (startsWithSpace && !isPunctOnly)) {
      if (cur) words.push(cur);
      cur = {
        text: trimmed,
        from: t.offsets.from,
        to: t.offsets.to
      };
    } else {
      cur.text += trimmed;
      cur.to = Math.max(cur.to, t.offsets.to);
    }
  }
  if (cur) words.push(cur);
  return words;
}

// ============================================================================
// 1. RENDER SYMMETRICAL 4x2 SWATCHES & DUAL COLOR CONTROLS
// ============================================================================
const fontPostScriptMap = {};

const MAX_RECENT_FONTS = 5;
const DEFAULT_RECENT_FONTS = [
  { value: "Arial-Black", family: "Arial Black", label: "Arial Black" },
  { value: "Impact", family: "Impact", label: "Impact" },
  { value: "Montserrat-Black", family: "Montserrat Black", label: "Montserrat Black" },
  { value: "TrebuchetMS-Bold", family: "Trebuchet MS Bold", label: "Trebuchet MS Bold" },
  { value: "Georgia-Bold", family: "Georgia Bold", label: "Georgia Bold" }
];

let recentFonts = [];

function loadRecentFonts(forceReload = false) {
  if (!forceReload && recentFonts && recentFonts.length > 0) {
    return recentFonts;
  }
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      const stored = localStorage.getItem("bisik_recent_fonts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          recentFonts = parsed.map((item) => {
            if (typeof item === "string") {
              return { value: item, family: cleanFontFamily(item), label: cleanFontFamily(item) };
            }
            return item;
          }).slice(0, MAX_RECENT_FONTS);
          return recentFonts;
        }
      }
    }
  } catch (_) {}

  try {
    const s = readJsonSafe(SETTINGS_FILE, null);
    if (s && Array.isArray(s.recentFonts) && s.recentFonts.length > 0) {
      recentFonts = s.recentFonts.map((item) => {
        if (typeof item === "string") {
          return { value: item, family: cleanFontFamily(item), label: cleanFontFamily(item) };
        }
        return item;
      }).slice(0, MAX_RECENT_FONTS);
      return recentFonts;
    }
  } catch (_) {}

  recentFonts = [...DEFAULT_RECENT_FONTS];
  return recentFonts;
}

function saveRecentFonts() {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      localStorage.setItem("bisik_recent_fonts", JSON.stringify(recentFonts));
    }
  } catch (_) {}
}

function updateRecentFontsGroup() {
  if (typeof document === "undefined") return;
  const fontSelect = getEl("fontSelect");
  if (!fontSelect) return;

  let recentGroup = getEl("recentFontsGroup");
  if (!recentGroup) {
    recentGroup = document.createElement("optgroup");
    recentGroup.id = "recentFontsGroup";
    fontSelect.insertBefore(recentGroup, fontSelect.firstChild);
  }

  recentGroup.label = `Recent Fonts (${recentFonts.length})`;
  recentGroup.innerHTML = "";

  recentFonts.forEach((rf) => {
    const opt = document.createElement("option");
    opt.value = rf.value;
    opt.dataset.family = rf.family || rf.label;
    opt.textContent = rf.label || rf.family || rf.value;
    recentGroup.appendChild(opt);
  });
}

function recordRecentFont(fontValue, familyName, label) {
  if (!fontValue) return;
  const val = String(fontValue).trim();
  const fam = String(familyName || cleanFontFamily(val) || val).trim();
  const lbl = String(label || fam || val).trim();

  // Find if already exists in recentFonts by value or family name
  const existingIdx = recentFonts.findIndex((item) => {
    const itemVal = typeof item === "string" ? item : item.value;
    const itemFam = typeof item === "object" ? item.family : "";
    return itemVal === val || (itemFam && fam && itemFam.toLowerCase() === fam.toLowerCase());
  });

  if (existingIdx !== -1) {
    recentFonts.splice(existingIdx, 1);
  }

  recentFonts.unshift({
    value: val,
    family: fam,
    label: lbl
  });

  if (recentFonts.length > MAX_RECENT_FONTS) {
    recentFonts = recentFonts.slice(0, MAX_RECENT_FONTS);
  }

  saveRecentFonts();
  updateRecentFontsGroup();

  const fontSelect = getEl("fontSelect");
  if (fontSelect && fontSelect.value !== val) {
    fontSelect.value = val;
  }
}

function cleanFontFamily(name) {
  if (!name) return "sans-serif";
  for (const [fam, ps] of Object.entries(fontPostScriptMap)) {
    if (ps === name || fam === name) return fam;
  }
  return name.replace(/\s*\([^)]*\)/g, "")
             .replace(/-(Bold|Black|Medium|Regular|Light|Thin|Italic|Oblique|Heavy|Semibold|Demi|SemiBold)$/i, "")
             .replace(/\s+(Bold|Black|Medium|Regular|Light|Thin|Italic|Oblique|Heavy|Semibold|Demi)$/i, "")
             .trim();
}

function applyFontSelection() {
  const fontSelect = getEl("fontSelect");
  if (!fontSelect || !fontSelect.value) return;
  const fVal = fontSelect.value;
  const selOpt = fontSelect.options[fontSelect.selectedIndex];
  const familyName = selOpt ? (selOpt.dataset.family || selOpt.textContent) : cleanFontFamily(fVal);
  const labelName = selOpt ? selOpt.textContent : familyName;

  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty(
      "--preview-font-family",
      `"${familyName}", "${cleanFontFamily(fVal)}", sans-serif`
    );
    const fontBadge = getEl("typoLiveFontName");
    if (fontBadge) fontBadge.textContent = familyName;
    if (typeof syncCustomFontDisplay === "function") syncCustomFontDisplay();
  }
  recordRecentFont(fVal, familyName, labelName);
  saveAppSettings();
  setStatus(`Font applied: ${familyName}`, "info");
}

function renderColorPalette() {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--preview-accent", state.selectedHex);
    document.documentElement.style.setProperty("--preview-font-color", state.fontColorHex || "#FFFFFF");
    document.documentElement.style.setProperty("--preview-box-color", state.boxColorHex || "#F43F5E");

    const fontSelect = getEl("fontSelect");
    if (fontSelect && fontSelect.value) {
      document.documentElement.style.setProperty(
        "--preview-font-family",
        `"${fontSelect.value}", "${cleanFontFamily(fontSelect.value)}", sans-serif`
      );
      const fontBadge = getEl("typoLiveFontName");
      if (fontBadge) fontBadge.textContent = fontSelect.value;
    }

    const typoColorDot = getEl("typoLiveColorDot");
    const typoColorText = getEl("typoLiveColorText");
    if (typoColorDot) typoColorDot.style.background = state.fontColorHex || "#FFFFFF";
    if (typoColorText) typoColorText.textContent = state.fontColorHex || "#FFFFFF";

    if (activeHexLabel) activeHexLabel.textContent = state.selectedHex;

    const fontDot = getEl("fontColorDot");
    const fontLabel = getEl("fontColorHexLabel");
    if (fontDot) fontDot.style.background = state.fontColorHex || "#FFFFFF";
    if (fontLabel) fontLabel.textContent = state.fontColorHex || "#FFFFFF";

    const hlDot = getEl("highlightColorDot");
    if (hlDot) hlDot.style.background = state.selectedHex;

    const boxDot = getEl("boxColorDot");
    const boxLabel = getEl("boxColorHexLabel");
    if (boxDot) boxDot.style.background = state.boxColorHex || "#F43F5E";
    if (boxLabel) boxLabel.textContent = state.boxColorHex || "#F43F5E";

    // Highlight active target card
    const boxFont = getEl("btnOpenFontColorPicker");
    const boxHl = getEl("btnOpenHighlightColorPicker");
    const boxBc = getEl("btnOpenBoxColorPicker");
    if (boxFont) boxFont.classList.toggle("active-target", state.colorTarget === "font");
    if (boxHl) boxHl.classList.toggle("active-target", state.colorTarget === "highlight");
    if (boxBc) boxBc.classList.toggle("active-target", state.colorTarget === "box");

    // Highlight active target pill
    const pillBc = getEl("targetBtnParticle");
    const pillHl = getEl("targetBtnHighlight");
    const pillFont = getEl("targetBtnFont");
    if (pillBc) pillBc.classList.toggle("active", state.colorTarget === "box");
    if (pillHl) pillHl.classList.toggle("active", state.colorTarget === "highlight");
    if (pillFont) pillFont.classList.toggle("active", state.colorTarget === "font");
  }

  const swatchContainer = getEl("colorSwatchContainer");
  if (swatchContainer) {
    swatchContainer.innerHTML = "";
    const activeTargetHex = (state.colorTarget === "box")
      ? (state.boxColorHex || "#F43F5E")
      : (state.colorTarget === "font")
        ? (state.fontColorHex || "#FFFFFF")
        : (state.selectedHex || "#FFC400");

    SPECTRUM_SWATCHES.forEach((sw) => {
      const btn = document.createElement("div");
      btn.className = "color-swatch" + (activeTargetHex.toUpperCase() === sw.hex.toUpperCase() ? " active" : "");
      btn.title = sw.fullName + " (" + sw.hex + ") - Apply to " + (state.colorTarget === "box" ? "Particle / Box Color" : (state.colorTarget === "font" ? "Font Color" : "Highlight Color"));
      btn.innerHTML = `<span class="swatch-dot" style="background:${sw.hex};"></span><span>${sw.name}</span>`;
      btn.addEventListener("click", () => {
        if (state.colorTarget === "box") {
          state.boxColorHex = sw.hex;
          setStatus(`Particle color applied: ${sw.name} (${sw.hex})`, "info");
        } else if (state.colorTarget === "font") {
          state.fontColorHex = sw.hex;
          setStatus(`Font color applied: ${sw.name} (${sw.hex})`, "info");
        } else {
          state.selectedHex = sw.hex;
          setStatus(`Highlight color applied: ${sw.name} (${sw.hex})`, "info");
        }
        renderColorPalette();
        saveAppSettings();
      });
      swatchContainer.appendChild(btn);
    });
  }
}

// ============================================================================
// ADOBE PHOTOSHOP-STYLE COLOR PICKER MODAL ENGINE
// ============================================================================
function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else if (max === b) h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  let c = String(hex || "").replace(/^#/, "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(c.slice(0, 2), 16) || 0,
    g: parseInt(c.slice(2, 4), 16) || 0,
    b: parseInt(c.slice(4, 6), 16) || 0
  };
}

let psTarget = "highlight";
let psState = { h: 46, s: 100, v: 100, initialHex: "#FFC400", currentHex: "#FFC400" };

function drawHueBar() {
  const canvas = getEl("psHueCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0 / 6, "#FF0000");
  grad.addColorStop(1 / 6, "#FFFF00");
  grad.addColorStop(2 / 6, "#00FF00");
  grad.addColorStop(3 / 6, "#00FFFF");
  grad.addColorStop(4 / 6, "#0000FF");
  grad.addColorStop(5 / 6, "#FF00FF");
  grad.addColorStop(6 / 6, "#FF0000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSatValBox() {
  const canvas = getEl("psSatValCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const pureHueRgb = hsvToRgb(psState.h, 100, 100);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  const gradH = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradH.addColorStop(0, "#FFFFFF");
  gradH.addColorStop(1, pureHueHex);
  ctx.fillStyle = gradH;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradV = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradV.addColorStop(0, "rgba(0,0,0,0)");
  gradV.addColorStop(1, "#000000");
  ctx.fillStyle = gradV;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function syncPsInputs(source) {
  const rgb = hsvToRgb(psState.h, psState.s, psState.v);
  psState.currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);

  const prevNew = getEl("psPreviewNew");
  if (prevNew) prevNew.style.background = psState.currentHex;

  if (typeof document !== "undefined") {
    if (psTarget === "font") {
      document.documentElement.style.setProperty("--preview-font-color", psState.currentHex);
      const fontDot = getEl("fontColorDot");
      const fontLabel = getEl("fontColorHexLabel");
      if (fontDot) fontDot.style.background = psState.currentHex;
      if (fontLabel) fontLabel.textContent = psState.currentHex;
      const typoColorDot = getEl("typoLiveColorDot");
      const typoColorText = getEl("typoLiveColorText");
      if (typoColorDot) typoColorDot.style.background = psState.currentHex;
      if (typoColorText) typoColorText.textContent = psState.currentHex;
    } else if (psTarget === "box") {
      document.documentElement.style.setProperty("--preview-box-color", psState.currentHex);
      const boxDot = getEl("boxColorDot");
      const boxLabel = getEl("boxColorHexLabel");
      if (boxDot) boxDot.style.background = psState.currentHex;
      if (boxLabel) boxLabel.textContent = psState.currentHex;
    } else {
      document.documentElement.style.setProperty("--preview-accent", psState.currentHex);
      const hlDot = getEl("highlightColorDot");
      if (hlDot) hlDot.style.background = psState.currentHex;
      if (activeHexLabel) activeHexLabel.textContent = psState.currentHex;
    }
  }

  if (source !== "hsb") {
    if (getEl("psInputH")) getEl("psInputH").value = psState.h;
    if (getEl("psInputS")) getEl("psInputS").value = psState.s;
    if (getEl("psInputB")) getEl("psInputB").value = psState.v;
  }
  if (source !== "rgb") {
    if (getEl("psInputR")) getEl("psInputR").value = rgb.r;
    if (getEl("psInputG")) getEl("psInputG").value = rgb.g;
    if (getEl("psInputBlue")) getEl("psInputBlue").value = rgb.b;
  }
  if (source !== "hex") {
    if (getEl("psInputHex")) getEl("psInputHex").value = psState.currentHex.replace("#", "");
  }

  const satCanvas = getEl("psSatValCanvas");
  const cursor = getEl("psSatValCursor");
  if (satCanvas && cursor) {
    const x = (psState.s / 100) * satCanvas.width;
    const y = (1 - psState.v / 100) * satCanvas.height;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  }

  const hueCanvas = getEl("psHueCanvas");
  const hueSlider = getEl("psHueSlider");
  if (hueCanvas && hueSlider) {
    const y = (psState.h / 360) * hueCanvas.height;
    hueSlider.style.top = `${y}px`;
  }
}

function openPhotoshopColorPicker(target) {
  psTarget = target;
  const modal = getEl("psColorModal");
  const title = getEl("psModalTitle");
  if (!modal) return;

  const initialHex = (target === "font")
    ? (state.fontColorHex || "#FFFFFF")
    : (target === "box")
      ? (state.boxColorHex || "#F43F5E")
      : (state.selectedHex || "#FFC400");
  psState.initialHex = initialHex;
  psState.currentHex = initialHex;

  if (title) {
    title.textContent = (target === "font")
      ? "Color Picker (Font Color)"
      : (target === "box")
        ? "Color Picker (Particle / Box Color)"
        : "Color Picker (Highlight Color)";
  }

  const rgb = hexToRgb(initialHex);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  psState.h = hsv.h;
  psState.s = hsv.s;
  psState.v = hsv.v;

  const prevCurrent = getEl("psPreviewCurrent");
  if (prevCurrent) prevCurrent.style.background = initialHex;

  modal.style.display = "flex";
  drawHueBar();
  drawSatValBox();
  syncPsInputs("init");
}

function initPhotoshopColorPicker() {
  getEl("btnOpenFontColorPicker")?.addEventListener("click", () => {
    state.colorTarget = "font";
    renderColorPalette();
    openPhotoshopColorPicker("font");
  });
  getEl("btnOpenHighlightColorPicker")?.addEventListener("click", () => {
    state.colorTarget = "highlight";
    renderColorPalette();
    openPhotoshopColorPicker("highlight");
  });
  getEl("btnOpenBoxColorPicker")?.addEventListener("click", () => {
    state.colorTarget = "box";
    renderColorPalette();
    openPhotoshopColorPicker("box");
  });

  getEl("targetBtnParticle")?.addEventListener("click", () => {
    state.colorTarget = "box";
    renderColorPalette();
  });
  getEl("targetBtnHighlight")?.addEventListener("click", () => {
    state.colorTarget = "highlight";
    renderColorPalette();
  });
  getEl("targetBtnFont")?.addEventListener("click", () => {
    state.colorTarget = "font";
    renderColorPalette();
  });

  const modal = getEl("psColorModal");
  const closeModal = () => { if (modal) modal.style.display = "none"; };

  getEl("psBtnCancel")?.addEventListener("click", () => {
    if (typeof document !== "undefined") {
      if (psTarget === "font") {
        document.documentElement.style.setProperty("--preview-font-color", psState.initialHex);
        const fontDot = getEl("fontColorDot");
        const fontLabel = getEl("fontColorHexLabel");
        if (fontDot) fontDot.style.background = psState.initialHex;
        if (fontLabel) fontLabel.textContent = psState.initialHex;
        const typoColorDot = getEl("typoLiveColorDot");
        const typoColorText = getEl("typoLiveColorText");
        if (typoColorDot) typoColorDot.style.background = psState.initialHex;
        if (typoColorText) typoColorText.textContent = psState.initialHex;
      } else if (psTarget === "box") {
        document.documentElement.style.setProperty("--preview-box-color", psState.initialHex);
        const boxDot = getEl("boxColorDot");
        const boxLabel = getEl("boxColorHexLabel");
        if (boxDot) boxDot.style.background = psState.initialHex;
        if (boxLabel) boxLabel.textContent = psState.initialHex;
      } else {
        document.documentElement.style.setProperty("--preview-accent", psState.initialHex);
        const hlDot = getEl("highlightColorDot");
        if (hlDot) hlDot.style.background = psState.initialHex;
        if (activeHexLabel) activeHexLabel.textContent = psState.initialHex;
      }
    }
    closeModal();
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      if (typeof document !== "undefined") {
        if (psTarget === "font") {
          document.documentElement.style.setProperty("--preview-font-color", psState.initialHex);
          const typoColorDot = getEl("typoLiveColorDot");
          const typoColorText = getEl("typoLiveColorText");
          if (typoColorDot) typoColorDot.style.background = psState.initialHex;
          if (typoColorText) typoColorText.textContent = psState.initialHex;
        } else if (psTarget === "box") {
          document.documentElement.style.setProperty("--preview-box-color", psState.initialHex);
          const boxDot = getEl("boxColorDot");
          const boxLabel = getEl("boxColorHexLabel");
          if (boxDot) boxDot.style.background = psState.initialHex;
          if (boxLabel) boxLabel.textContent = psState.initialHex;
        } else {
          document.documentElement.style.setProperty("--preview-accent", psState.initialHex);
        }
      }
      closeModal();
    }
  });

  getEl("psBtnOk")?.addEventListener("click", () => {
    if (psTarget === "font") {
      state.fontColorHex = psState.currentHex;
      setStatus(`Font color set to ${state.fontColorHex}.`, "info");
    } else if (psTarget === "box") {
      state.boxColorHex = psState.currentHex;
      setStatus(`Particle color set to ${state.boxColorHex}.`, "info");
    } else {
      state.selectedHex = psState.currentHex;
      setStatus(`Highlight color set to ${state.selectedHex}.`, "info");
    }
    closeModal();
    renderColorPalette();
    saveAppSettings();
  });

  const hueBox = getEl("psHueBox");
  let isDraggingHue = false;
  const updateHue = (e) => {
    const rect = hueBox.getBoundingClientRect();
    let y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    psState.h = Math.round((y / rect.height) * 360);
    if (psState.h >= 360) psState.h = 0;
    drawSatValBox();
    syncPsInputs("hue");
  };
  hueBox?.addEventListener("mousedown", (e) => {
    isDraggingHue = true;
    updateHue(e);
  });

  const satBox = getEl("psSpectrumBox");
  let isDraggingSatVal = false;
  const updateSatVal = (e) => {
    const rect = satBox.getBoundingClientRect();
    let x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    let y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    psState.s = Math.round((x / rect.width) * 100);
    psState.v = Math.round((1 - y / rect.height) * 100);
    syncPsInputs("satval");
  };
  satBox?.addEventListener("mousedown", (e) => {
    isDraggingSatVal = true;
    updateSatVal(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingHue) updateHue(e);
    if (isDraggingSatVal) updateSatVal(e);
  });

  window.addEventListener("mouseup", () => {
    isDraggingHue = false;
    isDraggingSatVal = false;
  });

  getEl("psInputHex")?.addEventListener("input", (e) => {
    let val = e.target.value.trim().replace(/^#/, "");
    if (/^[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      psState.h = hsv.h;
      psState.s = hsv.s;
      psState.v = hsv.v;
      drawSatValBox();
      syncPsInputs("hex");
    }
  });

  const onRgbInput = () => {
    const r = parseInt(getEl("psInputR")?.value || "0", 10);
    const g = parseInt(getEl("psInputG")?.value || "0", 10);
    const b = parseInt(getEl("psInputBlue")?.value || "0", 10);
    const hsv = rgbToHsv(r, g, b);
    psState.h = hsv.h;
    psState.s = hsv.s;
    psState.v = hsv.v;
    drawSatValBox();
    syncPsInputs("rgb");
  };
  getEl("psInputR")?.addEventListener("input", onRgbInput);
  getEl("psInputG")?.addEventListener("input", onRgbInput);
  getEl("psInputBlue")?.addEventListener("input", onRgbInput);

  const onHsbInput = () => {
    psState.h = Math.max(0, Math.min(360, parseInt(getEl("psInputH")?.value || "0", 10)));
    psState.s = Math.max(0, Math.min(100, parseInt(getEl("psInputS")?.value || "0", 10)));
    psState.v = Math.max(0, Math.min(100, parseInt(getEl("psInputB")?.value || "0", 10)));
    drawSatValBox();
    syncPsInputs("hsb");
  };
  getEl("psInputH")?.addEventListener("input", onHsbInput);
  getEl("psInputS")?.addEventListener("input", onHsbInput);
  getEl("psInputB")?.addEventListener("input", onHsbInput);
}

let activeCategoryFilter = "all";

function renderStylePreviewGallery() {
  const gallery = getEl("stylePreviewGallery");
  const styleSelectEl = getEl("styleSelect");
  const badge = getEl("activeStyleBadge");
  if (!gallery) return;

  gallery.innerHTML = "";
  const currentMogrt = styleSelectEl ? styleSelectEl.value : "bisik_Spring_Rise.mogrt";

  const filtered = BISIK_ANIMATION_STYLES.filter((item) => {
    if (activeCategoryFilter === "all") return true;
    if (activeCategoryFilter === "fav") return Boolean(item.favorite);
    return item.category === activeCategoryFilter;
  });

  if (filtered.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.cssText = "grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 24px 8px; font-size: 11px;";
    emptyMsg.textContent = activeCategoryFilter === "fav"
      ? "No styles in Saved yet. Click the ★ icon on any style card to add it here."
      : "No styles found in this category.";
    gallery.appendChild(emptyMsg);
    return;
  }

  filtered.forEach((styleObj) => {
    const card = document.createElement("div");
    const isSelected = styleObj.mogrt === currentMogrt;
    card.className = "style-preview-card" + (isSelected ? " selected" : "");

    card.innerHTML = `
      <div class="preview-stage">
        <div class="preview-caption ${styleObj.cssClass}">
          ${styleObj.previewHtml}
        </div>
      </div>
      <div class="preview-footer">
        <div class="preview-footer-left">
          <span class="t-badge">T</span>
          <span class="style-card-title">${styleObj.title}</span>
        </div>
        <span class="style-fav-star ${styleObj.favorite ? "favorited" : ""}" title="Save to Favorites">★</span>
      </div>
    `;

    card.addEventListener("click", () => {
      if (styleSelectEl) styleSelectEl.value = styleObj.mogrt;
      if (badge) badge.textContent = `${styleObj.title} (${styleObj.name})`;
      renderStylePreviewGallery();
      saveAppSettings();
    });

    const starEl = card.querySelector(".style-fav-star");
    if (starEl) {
      starEl.addEventListener("click", (e) => {
        e.stopPropagation();
        styleObj.favorite = !styleObj.favorite;
        renderStylePreviewGallery();
      });
    }

    gallery.appendChild(card);
  });

  const curScale = parseInt(getEl("textScale")?.value, 10) || 100;
  gallery.querySelectorAll(".preview-caption").forEach((el) => {
    el.style.transform = `scale(${curScale / 100})`;
    el.style.transformOrigin = "center center";
  });
}

function initGalleryAndFilterListeners() {
  const filterBar = getEl("styleFilterBar");
  if (filterBar) {
    filterBar.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        filterBar.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        activeCategoryFilter = tab.dataset.filter || "all";
        renderStylePreviewGallery();
      });
    });
  }

  const styleSelectEl = getEl("styleSelect");
  if (styleSelectEl) {
    styleSelectEl.addEventListener("change", () => {
      const match = BISIK_ANIMATION_STYLES.find((s) => s.mogrt === styleSelectEl.value);
      const badge = getEl("activeStyleBadge");
      if (match && badge) {
        badge.textContent = `${match.title} (${match.name})`;
      }
      renderStylePreviewGallery();
      saveAppSettings();
    });
  }
}

// ============================================================================
// 2. PRESETS & SETTINGS PERSISTENCE
// ============================================================================
function loadPresets() {
  try {
    let raw = readJsonSafe(PRESET_FILE, null);
    if (!raw && fs.existsSync(LEGACY_DOT_PRESET)) {
      raw = readJsonSafe(LEGACY_DOT_PRESET, null);
    }
    if (Array.isArray(raw) && raw.length > 0) {
      state.presets = raw.map((p) => {
        if (p.style) p.style = migrateStyleName(p.style);
        return p;
      });
      writeJsonAtomic(PRESET_FILE, state.presets);
    } else {
      state.presets = DEFAULT_PRESETS;
      writeJsonAtomic(PRESET_FILE, state.presets);
    }
  } catch (e) {
    state.presets = DEFAULT_PRESETS;
  }
  renderPresetDropdown();
}

function renderPresetDropdown() {
  if (!presetSelect) return;
  presetSelect.innerHTML = "";
  state.presets.forEach((p, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });
}

function syncTextScale(val, source) {
  const parsed = parseInt(val, 10);
  const num = isNaN(parsed) ? 100 : Math.max(40, Math.min(200, parsed));
  const numberInput = getEl("textScale");
  const sliderInput = getEl("textScaleSlider");
  const badge = getEl("textScaleBadge");
  if (source !== "number" && numberInput && parseInt(numberInput.value, 10) !== num) numberInput.value = num;
  if (source !== "slider" && sliderInput && parseInt(sliderInput.value, 10) !== num) sliderInput.value = num;
  if (badge) badge.textContent = `${num}%`;

  // Real-time proportional zoom on preview gallery cards
  const gallery = getEl("stylePreviewGallery");
  if (gallery) {
    gallery.querySelectorAll(".preview-caption").forEach((el) => {
      el.style.transform = `scale(${num / 100})`;
      el.style.transformOrigin = "center center";
    });
  }
}

function applyPreset(idx) {
  const p = state.presets[idx];
  if (!p) return;
  const styleSel = getEl("styleSelect");
  const fontSel = getEl("fontSelect");
  const wordsInput = getEl("wordsPerClip");
  const modeSel = getEl("highlightMode");
  const posSel = getEl("posPreset");
  const dualCheck = getEl("chkDualLine");

  if (styleSel) styleSel.value = migrateStyleName(p.style);
  if (fontSel && p.font) {
    let fVal = p.font;
    if (fVal === "PlayfairDisplay-Bold") fVal = "Georgia-Bold";
    if (fVal === "Cinzel-Bold") fVal = "TimesNewRomanPS-BoldMT";
    let found = false;
    for (let i = 0; i < fontSel.options.length; i++) {
      if (fontSel.options[i].value === fVal) {
        found = true;
        break;
      }
    }
    if (!found && fVal) {
      const customOpt = document.createElement("option");
      customOpt.value = fVal;
      customOpt.textContent = fVal;
      fontSel.appendChild(customOpt);
    }
    fontSel.value = fVal;
    applyFontSelection();
  }
  if (p.fontColor) state.fontColorHex = p.fontColor;
  if (p.boxColor) state.boxColorHex = p.boxColor;
  if (wordsInput) wordsInput.value = p.wordsPerClip;
  if (modeSel) modeSel.value = p.highlightMode;
  state.selectedHex = p.highlightColor || "#FFC400";
  if (activeHexLabel) activeHexLabel.textContent = state.selectedHex;
  if (posSel) posSel.value = p.posY;
  syncTextScale(p.scale || 100);
  if (dualCheck) dualCheck.checked = Boolean(p.dualLine);
  renderColorPalette();
  saveAppSettings();
  setStatus(`Preset applied: ${p.name}`, "info");
}

presetSelect?.addEventListener("change", (e) => applyPreset(parseInt(e.target.value, 10)));

getEl("btnSavePreset")?.addEventListener("click", () => {
  const newPreset = {
    name: `Custom ${state.presets.length + 1} (${state.selectedHex})`,
    style: getEl("styleSelect").value,
    font: getEl("fontSelect").value,
    fontColor: state.fontColorHex || "#FFFFFF",
    wordsPerClip: parseInt(getEl("wordsPerClip").value, 10) || 3,
    highlightMode: getEl("highlightMode").value,
    highlightColor: state.selectedHex,
    boxColor: state.boxColorHex || "#F43F5E",
    posY: getEl("posPreset").value,
    scale: parseInt(getEl("textScale").value, 10) || 100,
    dualLine: getEl("chkDualLine").checked
  };
  state.presets.push(newPreset);
  writeJsonAtomic(PRESET_FILE, state.presets);
  renderPresetDropdown();
  presetSelect.value = state.presets.length - 1;
  setStatus(`Saved preset: ${newPreset.name}`, "success");
});

getEl("btnDeletePreset")?.addEventListener("click", () => {
  if (state.presets.length <= 1) return setStatus("Minimum 1 preset required.", "warning");
  const idx = parseInt(presetSelect.value, 10);
  state.presets.splice(idx, 1);
  writeJsonAtomic(PRESET_FILE, state.presets);
  renderPresetDropdown();
  applyPreset(0);
});

let cachedSystemFonts = null;

/**
 * Detects and enumerates all installed system fonts across macOS and Windows.
 * Returns an alphabetically sorted array of unique font family/postscript names.
 */
function getInstalledFontsSync() {
  if (cachedSystemFonts && cachedSystemFonts.length > 0) {
    return cachedSystemFonts;
  }

  const isMac = os.platform() === "darwin";
  const isWin = os.platform() === "win32";
  const fonts = new Set();

  if (isMac) {
    try {
      // 1. Cocoa NSFontManager query via JavaScript for Automation (JXA) - fetches Family + PostScript name
      const script = 'ObjC.import("AppKit"); var fm = $.NSFontManager.sharedFontManager; var fams = fm.availableFontFamilies; var r = []; for (var i=0; i<fams.count; i++) { var fam = ObjC.unwrap(fams.objectAtIndex(i)); var mems = fm.availableMembersOfFontFamily(fam); var ps = fam; if (mems && mems.count > 0) { ps = ObjC.unwrap(mems.objectAtIndex(0).objectAtIndex(0)); } r.push({ name: fam, postScript: ps }); } JSON.stringify(r);';
      const out = execFileSync("osascript", ["-l", "JavaScript", "-e", script], {
        encoding: "utf8",
        timeout: 4000
      });
      const parsed = JSON.parse(out.trim());
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && item.name && typeof item.name === "string" && !item.name.startsWith(".")) {
            const trimmedName = item.name.trim();
            fonts.add(trimmedName);
            if (item.postScript) {
              fontPostScriptMap[trimmedName] = String(item.postScript).trim();
            }
          }
        });
      }
    } catch (_) {
      // Fallback: Scan macOS standard font directories
      const dirs = [
        "/Library/Fonts",
        "/System/Library/Fonts",
        "/System/Library/Fonts/Supplemental",
        path.join(os.homedir(), "Library/Fonts")
      ];
      dirs.forEach((dir) => {
        if (fs.existsSync(dir)) {
          try {
            fs.readdirSync(dir).forEach((file) => {
              const ext = path.extname(file).toLowerCase();
              if ([".ttf", ".otf", ".ttc", ".dfont"].includes(ext)) {
                const clean = path.basename(file, ext).replace(/[-_]/g, " ").trim();
                if (clean && !clean.startsWith(".")) fonts.add(clean);
              }
            });
          } catch (_) {}
        }
      });
    }
  } else if (isWin) {
    // 1. Query Windows Registry for both Machine and User font registrations
    const regKeys = [
      "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts",
      "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"
    ];
    regKeys.forEach((k) => {
      try {
        const out = execFileSync("reg", ["query", k], {
          encoding: "utf8",
          timeout: 3000
        });
        out.split("\n").forEach((line) => {
          const match = line.trim().match(/^([^]+?)\s+REG_SZ\s+/);
          if (match && match[1]) {
            const clean = match[1].replace(/\s*\((TrueType|OpenType)\)\s*$/i, "").trim();
            if (clean && !clean.startsWith(".")) fonts.add(clean);
          }
        });
      } catch (_) {}
    });

    // Fallback: Windows font directories
    const winDirs = [
      path.join(process.env.WINDIR || "C:\\Windows", "Fonts"),
      path.join(os.homedir(), "AppData", "Local", "Microsoft", "Windows", "Fonts")
    ];
    winDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        try {
          fs.readdirSync(dir).forEach((file) => {
            const ext = path.extname(file).toLowerCase();
            if ([".ttf", ".otf", ".ttc"].includes(ext)) {
              const clean = path.basename(file, ext).replace(/[-_]/g, " ").trim();
              if (clean && !clean.startsWith(".")) fonts.add(clean);
            }
          });
        } catch (_) {}
      }
    });
  }

  const result = Array.from(fonts).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  cachedSystemFonts = result;
  return result;
}

function initFontDropdown() {
  const fontSelect = getEl("fontSelect");
  if (!fontSelect) return;

  const systemGroup = getEl("systemFontsGroup");
  if (!systemGroup) return;

  // Initialize Recent Fonts (5 MRU slots)
  loadRecentFonts();
  updateRecentFontsGroup();

  try {
    const systemFonts = getInstalledFontsSync();
    if (!systemFonts || systemFonts.length === 0) {
      systemGroup.label = "Installed System Fonts (None detected)";
      return;
    }

    systemGroup.label = `Installed System Fonts (${systemFonts.length})`;
    systemGroup.innerHTML = "";

    const searchInput = getEl("fontSearchInput");
    if (searchInput) {
      searchInput.placeholder = `Search ${systemFonts.length}+ fonts...`;
    }

    systemFonts.forEach((fontName) => {
      const opt = document.createElement("option");
      const psName = fontPostScriptMap[fontName] || fontName;
      opt.value = psName;
      opt.dataset.family = fontName;
      opt.textContent = fontName;
      systemGroup.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to populate system fonts:", err);
  }

  fontSelect.removeEventListener("change", applyFontSelection);
  fontSelect.addEventListener("change", applyFontSelection);
  fontSelect.removeEventListener("input", applyFontSelection);
  fontSelect.addEventListener("input", applyFontSelection);

  populateCustomFontList();
  syncCustomFontDisplay();
}

function syncCustomFontDisplay() {
  if (typeof document === "undefined") return;
  const fontSelect = getEl("fontSelect");
  const display = getEl("customFontDisplay");
  if (!fontSelect || !display) return;
  const selOpt = fontSelect.options[fontSelect.selectedIndex];
  if (selOpt) {
    display.textContent = selOpt.dataset.family || selOpt.textContent;
  } else if (fontSelect.value) {
    display.textContent = cleanFontFamily(fontSelect.value);
  }
  const items = document.querySelectorAll(".custom-dropdown-item");
  items.forEach((it) => {
    if (it.dataset.value === fontSelect.value) {
      it.classList.add("is-selected");
    } else {
      it.classList.remove("is-selected");
    }
  });
}

function openCustomFontMenu() {
  const menu = getEl("customFontMenu");
  const trigger = getEl("customFontTrigger");
  const searchInput = getEl("fontSearchInput");
  if (!menu || !trigger) return;

  menu.style.display = "flex";
  trigger.classList.add("is-open");
  trigger.setAttribute("aria-expanded", "true");

  populateCustomFontList(searchInput ? searchInput.value : "");

  setTimeout(() => {
    const selectedItem = menu.querySelector(".custom-dropdown-item.is-selected");
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
    if (searchInput) searchInput.focus();
  }, 20);
}

function closeCustomFontMenu() {
  const menu = getEl("customFontMenu");
  const trigger = getEl("customFontTrigger");
  if (!menu || !trigger) return;

  menu.style.display = "none";
  trigger.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");
}

function populateCustomFontList(filterQuery = "") {
  if (typeof document === "undefined") return;
  const fontSelect = getEl("fontSelect");
  const listEl = getEl("customFontList");
  if (!fontSelect || !listEl) return;

  const q = (filterQuery || "").trim().toLowerCase();
  listEl.innerHTML = "";

  let matchCount = 0;
  const groups = Array.from(fontSelect.querySelectorAll("optgroup"));

  groups.forEach((grp) => {
    const options = Array.from(grp.querySelectorAll("option"));
    const matchingOptions = options.filter((opt) => {
      if (!q) return true;
      return opt.textContent.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q);
    });

    if (matchingOptions.length === 0) return;

    const grpHeader = document.createElement("div");
    grpHeader.className = "custom-dropdown-group-header";
    const rawLabel = grp.label ? grp.label.replace(/\s*\(\d+[^)]*\)/g, "").trim() : "Fonts";
    grpHeader.textContent = `${rawLabel} (${matchingOptions.length})`;
    listEl.appendChild(grpHeader);

    matchingOptions.forEach((opt) => {
      matchCount++;
      const item = document.createElement("div");
      item.className = "custom-dropdown-item";
      item.dataset.value = opt.value;
      if (opt.value === fontSelect.value) {
        item.classList.add("is-selected");
      }

      const labelSpan = document.createElement("span");
      labelSpan.textContent = opt.textContent;
      labelSpan.style.fontFamily = `"${opt.dataset.family || opt.textContent}", "${cleanFontFamily(opt.value)}", sans-serif`;

      const checkSpan = document.createElement("span");
      checkSpan.className = "custom-dropdown-item-check";
      checkSpan.textContent = "✓";

      item.appendChild(labelSpan);
      item.appendChild(checkSpan);

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        fontSelect.value = opt.value;
        recordRecentFont(opt.value, opt.dataset.family, opt.textContent);
        syncCustomFontDisplay();
        applyFontSelection();
        closeCustomFontMenu();
        populateCustomFontList();
      });

      listEl.appendChild(item);
    });
  });

  if (matchCount === 0) {
    const empty = document.createElement("div");
    empty.className = "custom-dropdown-empty";
    empty.textContent = `No fonts matching "${filterQuery}"`;
    listEl.appendChild(empty);
  }
}

function initCustomFontDropdown() {
  if (typeof document === "undefined") return;
  const trigger = getEl("customFontTrigger");
  const menu = getEl("customFontMenu");
  const searchInput = getEl("fontSearchInput");
  const clearBtn = getEl("fontSearchClear");
  const fontSelect = getEl("fontSelect");

  if (!trigger || !menu || !fontSelect) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.style.display === "none" || !menu.style.display) {
      openCustomFontMenu();
    } else {
      closeCustomFontMenu();
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? "flex" : "none";
      populateCustomFontList(val);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCustomFontMenu();
        trigger.focus();
      } else if (e.key === "Enter") {
        const firstItem = menu.querySelector(".custom-dropdown-item");
        if (firstItem) {
          firstItem.click();
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      clearBtn.style.display = "none";
      populateCustomFontList("");
    });
  }

  // Close when clicking outside
  document.addEventListener("pointerdown", (e) => {
    const wrap = getEl("customFontWrapper");
    if (wrap && !wrap.contains(e.target)) {
      closeCustomFontMenu();
    }
  });

  // Keep trigger display text in sync when fontSelect changes
  fontSelect.addEventListener("change", syncCustomFontDisplay);

  populateCustomFontList();
  syncCustomFontDisplay();
}

function saveAppSettings() {
  const settings = {
    lang: getEl("langSelect")?.value || "id",
    style: getEl("styleSelect")?.value,
    font: getEl("fontSelect")?.value,
    recentFonts: recentFonts,
    fontColor: state.fontColorHex || "#FFFFFF",
    wordsPerClip: getEl("wordsPerClip")?.value,
    highlightMode: getEl("highlightMode")?.value,
    highlightColor: state.selectedHex,
    boxColor: state.boxColorHex || "#F43F5E",
    colorTarget: state.colorTarget || "box",
    posY: getEl("posPreset")?.value,
    scale: getEl("textScale")?.value,
    dualLine: getEl("chkDualLine") ? getEl("chkDualLine").checked : false
  };
  try {
    writeJsonAtomic(SETTINGS_FILE, settings);
  } catch (e) { }
}

function loadAppSettings() {
  try {
    let s = readJsonSafe(SETTINGS_FILE, null);
    if (!s && fs.existsSync(LEGACY_DOT_SETTINGS)) {
      s = readJsonSafe(LEGACY_DOT_SETTINGS, null);
    }
    if (s && typeof s === "object") {
      if (Array.isArray(s.recentFonts) && s.recentFonts.length > 0) {
        recentFonts = s.recentFonts.map((item) => {
          if (typeof item === "string") {
            return { value: item, family: cleanFontFamily(item), label: cleanFontFamily(item) };
          }
          return item;
        }).slice(0, MAX_RECENT_FONTS);
        updateRecentFontsGroup();
      }
      if (s.style) s.style = migrateStyleName(s.style);
      if (s.lang && getEl("langSelect")) getEl("langSelect").value = s.lang;
      if (s.style && getEl("styleSelect")) getEl("styleSelect").value = s.style;
      if (s.font && getEl("fontSelect")) {
        let fVal = s.font;
        if (fVal === "PlayfairDisplay-Bold") fVal = "Georgia-Bold";
        if (fVal === "Cinzel-Bold") fVal = "TimesNewRomanPS-BoldMT";
        if (fontPostScriptMap && fontPostScriptMap[fVal]) fVal = fontPostScriptMap[fVal];
        const fontSelect = getEl("fontSelect");
        let found = false;
        for (let i = 0; i < fontSelect.options.length; i++) {
          const opt = fontSelect.options[i];
          if (opt.value === fVal || opt.dataset?.family === fVal || opt.textContent?.trim() === fVal) {
            found = true;
            fVal = opt.value;
            break;
          }
        }
        if (!found && fVal) {
          const customOpt = document.createElement("option");
          customOpt.value = fVal;
          customOpt.textContent = cleanFontFamily(fVal);
          fontSelect.appendChild(customOpt);
        }
        fontSelect.value = fVal;
        applyFontSelection();
      }
      if (s.fontColor) state.fontColorHex = s.fontColor;
      if (s.wordsPerClip && getEl("wordsPerClip")) getEl("wordsPerClip").value = s.wordsPerClip;
      if (s.highlightMode && getEl("highlightMode")) getEl("highlightMode").value = s.highlightMode;
      if (s.highlightColor) {
        state.selectedHex = s.highlightColor;
      }
      if (s.boxColor) {
        state.boxColorHex = s.boxColor;
      }
      if (s.colorTarget) {
        state.colorTarget = s.colorTarget;
      }
      renderColorPalette();
      if (s.posY && getEl("posPreset")) getEl("posPreset").value = s.posY;
      if (s.scale) syncTextScale(s.scale); else syncTextScale(100);
      if (typeof s.dualLine === "boolean" && getEl("chkDualLine")) {
        getEl("chkDualLine").checked = s.dualLine;
      }
      writeJsonAtomic(SETTINGS_FILE, s);
    }
  } catch (e) { }
  renderColorPalette();
}

// ============================================================================
// 3. LOAD SEQUENCE TRACKS
// ============================================================================
async function loadTracks(opts = {}) {
  const applyDefaults = opts.applyDefaults === true;
  const prevAudio = audioSelect ? audioSelect.value : null;
  const prevVideo = videoSelect ? videoSelect.value : null;

  const raw = await evalJSX("getSequenceTracksInfo()");
  try {
    const data = JSON.parse(raw);
    if (data.error) {
      if (audioSelect && audioSelect.options.length === 0) {
        audioSelect.innerHTML = '<option value="" disabled selected>No active sequence (select timeline & click Refresh)</option>';
      }
      return setStatus(data.error, "error");
    }

    // Smart dialogue track score ranking
    let bestAudioIdx = 0;
    let highestScore = -Infinity;
    data.audioTracks.forEach((t) => {
      let score = 0;
      if (t.clipCount === 0) score -= 1000;
      else score += Math.min(t.clipCount, 50) + 100;

      if (t.selectedCount > 0) score += 1000;
      if (t.isTargeted) score += 300;
      if (t.isMuted) score -= 600;

      const lowerName = t.name.toLowerCase();
      if (/dialog|vocal|voice|mic|speech|\bvo\b|talk/.test(lowerName)) {
        score += 500;
      }
      if (/music|bgm|sfx|sound fx|ambience|foley/.test(lowerName)) {
        score -= 400;
      }

      if (score > highestScore) {
        highestScore = score;
        bestAudioIdx = t.index;
      }
    });

    const targetAudioVal = (!applyDefaults && prevAudio !== null && data.audioTracks.some((t) => String(t.index) === String(prevAudio)))
      ? prevAudio
      : String(bestAudioIdx);

    audioSelect.innerHTML = "";
    data.audioTracks.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.index;
      opt.textContent = `${t.name} (${t.clipCount})${t.isMuted ? " [Muted]" : ""}`;
      if (String(t.index) === targetAudioVal) opt.selected = true;
      audioSelect.appendChild(opt);
    });

    // Default video track: choose topmost empty video track across timeline, prioritizing unmuted tracks
    let safeDefaultVideoIdx = -1;
    const unmutedEmptyVideoTracks = data.videoTracks.filter((v) => v.clipCount === 0 && !v.isMuted);
    const emptyVideoTracks = data.videoTracks.filter((v) => v.clipCount === 0);
    if (unmutedEmptyVideoTracks.length > 0) {
      safeDefaultVideoIdx = unmutedEmptyVideoTracks[unmutedEmptyVideoTracks.length - 1].index;
    } else if (emptyVideoTracks.length > 0) {
      safeDefaultVideoIdx = emptyVideoTracks[emptyVideoTracks.length - 1].index;
    } else if (data.videoTracks.length > 0) {
      safeDefaultVideoIdx = data.videoTracks[data.videoTracks.length - 1].index;
    }

    const targetVideoVal = (!applyDefaults && prevVideo !== null && data.videoTracks.some((v) => String(v.index) === String(prevVideo)))
      ? prevVideo
      : String(safeDefaultVideoIdx);

    videoSelect.innerHTML = "";
    data.videoTracks.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.index;
      const status = v.clipCount === 0 ? "Empty" : `${v.clipCount} clips`;
      const mutedTag = v.isMuted ? " [Muted]" : "";
      opt.textContent = `${v.name} (${status})${mutedTag}`;
      if (String(v.index) === targetVideoVal) opt.selected = true;
      videoSelect.appendChild(opt);
    });

    if (opts && opts.applyDefaults) {
      loadAppSettings();
    }
    const resInfo = data.profile ? ` • ${data.profile}` : "";
    const scaleInfo = (data.scalePercent && data.scalePercent !== 100) ? ` (${data.scalePercent}% scale)` : "";
    setStatus(`Sequence "${data.sequenceName}"${resInfo}${scaleInfo} connected.`, "success");
  } catch (e) {
    setStatus("Unable to read sequence tracks.", "error");
  }
}

getEl("btnRefresh")?.addEventListener("click", async (e) => {
  if (e && e.altKey) {
    if (typeof window !== "undefined") window.location.reload();
    return;
  }
  const btn = getEl("btnRefresh");
  const origText = btn ? btn.textContent : "Refresh";
  if (btn) btn.textContent = "Refreshing...";
  try {
    cachedSystemFonts = null;
    await loadTracks({ applyDefaults: false });
    initFontDropdown();
    applyFontSelection();
    renderColorPalette();
    renderWordEditor();
    const curSeqRaw = await evalJSX("bisikGetActiveSequenceId()");
    const curSeq = JSON.parse(curSeqRaw || "{}");
    if (curSeq.sequenceName) {
      setStatus(`Refreshed tracks for "${curSeq.sequenceName}".`, "success");
    } else {
      setStatus("Refreshed sequence tracks, fonts & transcript QC.", "success");
    }
  } catch (err) {
    setStatus("Unable to refresh tracks from Premiere Pro.", "error");
  } finally {
    if (btn) btn.textContent = origText;
  }
});

getEl("btnRefresh")?.addEventListener("dblclick", () => {
  if (typeof window !== "undefined") window.location.reload();
});

if (typeof window !== "undefined") {
  window.addEventListener("focus", () => {
    if (audioSelect && (audioSelect.options.length === 0 || audioSelect.value === "")) {
      loadTracks({ applyDefaults: false });
    }
  });
}

// ============================================================================
// TRANSCRIPT HISTORY STACK (UNDO / REDO)
// ============================================================================
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 30;

function pushHistoryState() {
  if (state.words.length === 0) return;
  undoStack.push(JSON.stringify(state.words));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(state.words));
  const prevJson = undoStack.pop();
  state.words = JSON.parse(prevJson);
  renderWordEditor();
  updateUndoRedoButtons();
  setStatus("Undo action applied.", "info");
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(state.words));
  const nextJson = redoStack.pop();
  state.words = JSON.parse(nextJson);
  renderWordEditor();
  updateUndoRedoButtons();
  setStatus("Redo action applied.", "info");
}

function updateUndoRedoButtons() {
  const btnU = getEl("btnUndo");
  const btnR = getEl("btnRedo");
  if (btnU) btnU.disabled = undoStack.length === 0;
  if (btnR) btnR.disabled = redoStack.length === 0;
}

getEl("btnUndo")?.addEventListener("click", undo);
getEl("btnRedo")?.addEventListener("click", redo);

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : "";
    if (tag === "INPUT" || tag === "TEXTAREA") return; // Task 20: Allow native field undo/redo

    const isMac = (typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    if (modKey && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    } else if (!isMac && modKey && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  });
}

// ============================================================================
// 4. INTERACTIVE TRANSCRIPT EDITOR
// ============================================================================
let textMeasureCanvas = null;
function measureWordInputWidth(text) {
  const str = String(text || "");
  const baseSafe = Math.max(38, Math.ceil(str.length * 10) + 26);
  if (typeof document === "undefined") {
    return baseSafe;
  }
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement("canvas");
  }
  const ctx = textMeasureCanvas.getContext("2d");
  if (ctx) {
    ctx.font = "600 13px adobe-clean, 'Adobe Clean', 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif";
    const textWidth = ctx.measureText(str).width;
    // Provide generous breathing room (+ 28px) so no letter is ever clipped at the end of the input
    return Math.max(baseSafe, Math.ceil(textWidth) + 28);
  }
  return baseSafe;
}

function renderWordEditor() {
  wordGrid.innerHTML = "";

  // Auto-flatten any multi-word entries with whitespace so every chip represents a discrete word
  let hasMultiWord = false;
  for (let i = 0; i < state.words.length; i++) {
    const w = state.words[i];
    if (w && w.text && /\s+/.test(w.text.trim())) {
      hasMultiWord = true;
      break;
    }
  }
  if (hasMultiWord) {
    const flattened = [];
    for (let i = 0; i < state.words.length; i++) {
      const w = state.words[i];
      if (w && w.text && /\s+/.test(w.text.trim())) {
        flattened.push(...splitWordAtSpaces(w));
      } else {
        flattened.push(w);
      }
    }
    state.words = flattened;
  }

  const activeWords = state.words.filter((w) => w.text && w.text.trim().length > 0);
  wordCountBadge.textContent = `(${activeWords.length})`;

  const qcBadge = getEl("qcStatusBadge");
  if (state.words.length === 0) {
    if (qcBadge) qcBadge.style.display = "none";
    wordGrid.innerHTML = `<div style="color:var(--muted); font-size:var(--f-sm); padding:var(--s-4); text-align:center; width:100%;">No transcript loaded. Transcribe an audio track or import an SRT/JSON file.</div>`;
    btnRender.disabled = true;
    if (typeof sessionStorage !== "undefined") {
      try { sessionStorage.removeItem("bisik_cached_words"); } catch (_) {}
    }
    return;
  }

  const { totalIssues, wordWarnings } = analyzeTranscriptQC();

  if (qcBadge) {
    qcBadge.style.display = "inline-flex";
    if (totalIssues > 0) {
      qcBadge.className = "qc-badge-warn";
      qcBadge.textContent = `QC: ${totalIssues} Over-Limit`;
      qcBadge.title = `${totalIssues} subtitle clip(s) exceed standard 38 CPL (characters/line) or 20 CPS (reading speed)`;
    } else {
      qcBadge.className = "qc-badge-ok";
      qcBadge.textContent = "QC: Pass";
      qcBadge.title = "All subtitles comply with standard broadcast CPL (≤38) & CPS (≤20)";
    }
  }

  state.words.forEach((w, idx) => {
    const chip = document.createElement("div");
    let cls = "word-chip";
    if (w.isKeyword) cls += " is-keyword";
    if (w.forceBreak) cls += " force-break";
    const qcWarn = wordWarnings.get(w);
    if (qcWarn) {
      cls += qcWarn.isOverCPS ? " has-qc-danger" : " has-qc-issue";
    }
    chip.className = cls;
    chip.id = `word-chip-${idx}`;

    const timeBadge = document.createElement("span");
    timeBadge.className = "word-time";
    timeBadge.textContent = `${w.start.toFixed(1)}s`;
    timeBadge.tabIndex = 0;
    timeBadge.setAttribute("role", "button");
    timeBadge.setAttribute("aria-label", `Seek to ${w.start.toFixed(1)} seconds`);
    const seekTime = () => evalJSX(`setPlayheadPosition(${w.start})`);
    timeBadge.addEventListener("click", seekTime);
    timeBadge.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seekTime();
      }
    });

    const input = document.createElement("input");
    input.type = "text";
    input.className = "word-input";
    input.value = w.text;
    input.style.width = `${measureWordInputWidth(w.text)}px`;

    input.addEventListener("focus", () => {
      pushHistoryState();
      evalJSX(`setPlayheadPosition(${w.start})`).catch(() => { });
    });
    input.addEventListener("input", (e) => {
      state.words[idx].text = e.target.value;
      input.style.width = `${measureWordInputWidth(e.target.value)}px`;
    });
    input.addEventListener("change", () => {
      const val = (input.value || "").trim();
      // Task 16: If user typed multiple words with spaces, split proportionally
      if (/\s+/.test(val)) {
        pushHistoryState();
        const splitted = splitWordAtSpaces({ ...state.words[idx], text: val });
        state.words.splice(idx, 1, ...splitted);
      }
      renderWordEditor();
    });

    const starBtn = document.createElement("span");
    starBtn.className = "chip-btn star-btn";
    starBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    starBtn.title = "Toggle Keyword Highlight";
    starBtn.tabIndex = 0;
    starBtn.setAttribute("role", "button");
    starBtn.setAttribute("aria-label", "Toggle Keyword Highlight");
    const toggleStar = () => {
      pushHistoryState();
      state.words[idx].isKeyword = !state.words[idx].isKeyword;
      chip.classList.toggle("is-keyword", state.words[idx].isKeyword);
    };
    starBtn.addEventListener("click", toggleStar);
    starBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleStar();
      }
    });

    const breakBtn = document.createElement("span");
    breakBtn.className = "chip-btn break-btn";
    breakBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10L4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>';
    breakBtn.title = "Force Clip Break";
    breakBtn.tabIndex = 0;
    breakBtn.setAttribute("role", "button");
    breakBtn.setAttribute("aria-label", "Force Clip Break");
    const toggleBreak = () => {
      pushHistoryState();
      state.words[idx].forceBreak = !state.words[idx].forceBreak;
      chip.classList.toggle("force-break", state.words[idx].forceBreak);
    };
    breakBtn.addEventListener("click", toggleBreak);
    breakBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBreak();
      }
    });

    const delBtn = document.createElement("span");
    delBtn.className = "chip-btn del-btn";
    delBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.title = "Delete Word";
    delBtn.tabIndex = 0;
    delBtn.setAttribute("role", "button");
    delBtn.setAttribute("aria-label", "Delete Word");
    const deleteWord = () => {
      pushHistoryState();
      state.words.splice(idx, 1);
      renderWordEditor();
    };
    delBtn.addEventListener("click", deleteWord);
    delBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        deleteWord();
      }
    });

    chip.append(timeBadge, input, starBtn, breakBtn, delBtn);
    if (qcWarn && qcWarn.isEnd) {
      const qcPill = document.createElement("span");
      qcPill.className = `qc-pill ${qcWarn.isOverCPS ? "qc-badge-danger" : "qc-badge-warn"}`;
      const reasons = [];
      if (qcWarn.isOverCPS) reasons.push(`${qcWarn.cps.toFixed(1)} CPS (>20)`);
      if (qcWarn.isOverCPL) reasons.push(`${qcWarn.maxCpl} CPL (>38)`);
      qcPill.textContent = qcWarn.isOverCPS ? `${qcWarn.cps.toFixed(0)} cps` : `${qcWarn.maxCpl} cpl`;
      qcPill.title = `QC Warning: ${reasons.join(", ")}`;
      chip.appendChild(qcPill);
    }
    wordGrid.appendChild(chip);
  });

  if (typeof sessionStorage !== "undefined") {
    try {
      if (state.words && state.words.length > 0) {
        sessionStorage.setItem("bisik_cached_words", JSON.stringify(state.words));
      }
    } catch (_) {}
  }

  btnRender.disabled = false;
}

function filterFillerWords(words) {
  if (!Array.isArray(words) || words.length === 0) return [];

  const fillers = new Set([
    // English & international fillers
    "um", "umm", "ummm", "uh", "uhh", "uhhh", "er", "erm", "ah", "ahh", "ahhh",
    "oh", "ohh", "hm", "hmm", "hmmm", "ha", "haa", "haah", "huh", "mhm",
    // Indonesian fillers & hesitations
    "em", "emm", "emmm", "ehm", "eh", "ehh", "ehhh", "eee", "ee", "anu", "nganu"
  ]);

  const isBracketNoise = (str) => /^(\[.*\]|\(.*\))$/.test((str || "").trim());
  const normalize = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const norm = normalize(w.text);

    // 1. Check if word is a recognized filler sound
    if (fillers.has(norm)) continue;

    // 2. Check if word is bracketed noise like [Musik], [Tawa], etc.
    if (isBracketNoise(w.text)) continue;

    // 3. Check for consecutive identical stutter words within 0.65s
    if (filtered.length > 0) {
      const prev = filtered[filtered.length - 1];
      const prevNorm = normalize(prev.text);
      if (norm && norm === prevNorm && Math.abs(w.start - prev.end) < 0.65) {
        // Skip duplicate stutter
        continue;
      }
    }

    filtered.push(w);
  }

  return filtered;
}

getEl("btnCleanFillers")?.addEventListener("click", () => {
  if (state.words.length === 0) {
    return setStatus("No transcript loaded to clean.", "warning");
  }
  pushHistoryState();

  const before = state.words.length;
  const filtered = filterFillerWords(state.words);
  const removedCount = before - filtered.length;

  if (removedCount > 0) {
    state.words = filtered;
    renderWordEditor();
    setStatus(`Cleaned ${removedCount} filler word(s) & stutter(s).`, "success");
  } else {
    setStatus("No filler words or stutters detected in transcript.", "info");
  }
});

let clearTranscriptTimer = null;
const btnClearTranscript = getEl("btnClearTranscript");
btnClearTranscript?.addEventListener("click", () => {
  if (state.words.length === 0) {
    return setStatus("Transcript is already empty.", "info");
  }

  if (btnClearTranscript.dataset.confirming === "true") {
    clearTimeout(clearTranscriptTimer);
    delete btnClearTranscript.dataset.confirming;
    btnClearTranscript.textContent = "Clear";
    pushHistoryState();
    state.words = [];
    renderWordEditor();
    setStatus("Transcript cleared (Press ↺ to Undo).", "info");
    return;
  }

  btnClearTranscript.dataset.confirming = "true";
  btnClearTranscript.textContent = "Confirm?";
  clearTranscriptTimer = setTimeout(() => {
    delete btnClearTranscript.dataset.confirming;
    btnClearTranscript.textContent = "Clear";
  }, 3500);
});

getEl("btnReplaceAll")?.addEventListener("click", () => {
  const findStr = getEl("findInput").value.trim();
  const replStr = getEl("replaceInput").value.trim();
  if (!findStr || state.words.length === 0) return;
  pushHistoryState();
  let count = 0;
  state.words.forEach((w) => {
    const clean = w.text.replace(/[.,?!]+$/, "");
    const punct = w.text.slice(clean.length);
    if (clean.toLowerCase() === findStr.toLowerCase()) {
      w.text = replStr + punct;
      count++;
    }
  });
  renderWordEditor();
  setStatus(`Replaced ${count} word(s).`, "info");
});

getEl("btnCapitalize")?.addEventListener("click", () => {
  if (state.words.length === 0) return;
  pushHistoryState();
  state.caseMode = (state.caseMode + 1) % 3;
  state.words.forEach((w) => {
    if (state.caseMode === 1) w.text = w.text.toUpperCase();
    else if (state.caseMode === 2) w.text = w.text.toLowerCase();
    else w.text = w.text.charAt(0).toUpperCase() + w.text.slice(1).toLowerCase();
  });
  renderWordEditor();
});

// ============================================================================
// 5. CHUNKER, SRT & JSON I/O
// ============================================================================
function buildWordChunks(customWords, customOptions = {}) {
  const sourceWords = customWords || (state && state.words) || [];
  
  // 1. Pre-flatten any multi-word entry containing whitespace.
  // Guarantees discrete individual words even if full segments or multi-word SRT entries are loaded.
  const validWords = [];
  for (let idx = 0; idx < sourceWords.length; idx++) {
    const w = sourceWords[idx];
    if (!w || !w.text || !w.text.trim()) continue;
    const trimmed = w.text.trim();
    if (/\s+/.test(trimmed)) {
      const parts = splitWordAtSpaces(w);
      validWords.push(...parts);
    } else {
      validWords.push(w);
    }
  }

  // 2. Identify style: clean-cut (Cinema / Documentary) vs Animated Kinetic
  const styleId = customOptions.style !== undefined
    ? String(customOptions.style)
    : ((typeof document !== "undefined" && getEl("styleSelect"))
      ? getEl("styleSelect").value
      : "");
  const isCleanCut = styleId.includes("clean-cut");

  // 3. User Two-Line toggle
  const userDualLine = customOptions.isDualLine !== undefined
    ? customOptions.isDualLine
    : ((typeof document !== "undefined" && getEl("chkDualLine"))
      ? getEl("chkDualLine").checked
      : false);

  // 4. Maximum CPL: standard 34 characters per line for safe margins (unifies chunker, QC, and AE MOGRT expression)
  const maxCpl = customOptions.maxCpl || 34;

  // 5. Dynamic wordsMax & maxDuration:
  // - Clean Cut: Cinema sentence phrases (8-12 words, up to 5.0s, bounded strictly by max 2 lines / 68 chars)
  // - Animated styles: Natural sentence clause (3-6 words, up to 3.2s) so words aren't too short,
  //   while strictly bounded by maxCpl so inserted text NEVER exceeds the video frame!
  const uiWords = (typeof document !== "undefined" && getEl("wordsPerClip"))
    ? parseInt(getEl("wordsPerClip").value, 10) || 0
    : 0;

  let wordsMax;
  if (customOptions.wordsMax !== undefined) {
    wordsMax = customOptions.wordsMax;
  } else if (isCleanCut) {
    wordsMax = (uiWords && uiWords !== 5) ? uiWords : 12;
  } else if (uiWords > 0) {
    wordsMax = uiWords;
  } else {
    wordsMax = 5;
  }

  const maxDuration = customOptions.maxDuration || (isCleanCut ? 5.0 : 3.2);

  function formatWordsLine(wList) {
    return wList.map((w) => (w.text ? w.text.trim() : "")).join(" ");
  }

  function splitIntoTwoBalancedLines(wList) {
    if (wList.length <= 1) return [wList];
    let bestIndex = 1;
    let minScore = Infinity;
    for (let k = 1; k < wList.length; k++) {
      const line1 = formatWordsLine(wList.slice(0, k));
      const line2 = formatWordsLine(wList.slice(k));
      let penalty = 0;
      if (line1.length > maxCpl) penalty += (line1.length - maxCpl) * 50;
      if (line2.length > maxCpl) penalty += (line2.length - maxCpl) * 50;
      const endsWithComma = /[,;:]$/.test(wList[k - 1].text);
      if (endsWithComma) penalty -= 15;
      const score = Math.abs(line1.length - line2.length) + penalty;
      if (score < minScore) {
        minScore = score;
        bestIndex = k;
      }
    }
    return [wList.slice(0, bestIndex), wList.slice(bestIndex)];
  }

  function pushChunk(chunkWords) {
    if (!chunkWords || chunkWords.length === 0) return;
    const fullText = formatWordsLine(chunkWords);
    // In clean-cut (if phrase exceeds 1 line or >= 7 words), or if user checked Two-Line, or single line exceeds maxCpl:
    // format as 2 balanced lines so text NEVER exceeds video frame!
    const shouldDualLine = userDualLine || (fullText.length > maxCpl) || (isCleanCut && (fullText.length > maxCpl || chunkWords.length >= 7));
    if (shouldDualLine && chunkWords.length >= 2) {
      chunks.push({
        words: chunkWords,
        lines: splitIntoTwoBalancedLines(chunkWords)
      });
    } else {
      chunks.push({
        words: chunkWords,
        lines: [chunkWords]
      });
    }
  }

  const chunks = [];
  let currentChunk = [];

  for (let i = 0; i < validWords.length; i++) {
    const w = validWords[i];
    const prevWord = currentChunk.length > 0 ? currentChunk[currentChunk.length - 1] : null;

    if (currentChunk.length > 0) {
      const projectedWords = [...currentChunk, w];
      const projectedDuration = (w.end || w.start) - currentChunk[0].start;
      const fullText = formatWordsLine(projectedWords);
      const isSpeechPause = prevWord && (w.start - prevWord.end >= (isCleanCut ? 0.70 : 0.55));

      let exceedsCpl = false;
      const allowDual = userDualLine || isCleanCut;
      if (!allowDual) {
        exceedsCpl = fullText.length > maxCpl;
      } else {
        if (fullText.length > maxCpl * 2) {
          exceedsCpl = true;
        } else {
          const lines = splitIntoTwoBalancedLines(projectedWords);
          if (formatWordsLine(lines[0]).length > maxCpl || (lines[1] && formatWordsLine(lines[1]).length > maxCpl)) {
            exceedsCpl = true;
          }
        }
      }

      // Sentence boundary check: if prevWord ended with sentence punctuation [.?!], break!
      const isSentenceEnd = prevWord && /[.?!]$/.test(prevWord.text) && currentChunk.length >= 2;

      // Natural clause boundary for animated chunks: break on comma if already 3+ words
      const isClauseBreak = !isCleanCut && prevWord && /[,;:]$/.test(prevWord.text) && currentChunk.length >= 3;

      const exceedsDuration = projectedDuration > maxDuration;
      const exceedsWordCount = projectedWords.length > wordsMax;

      if (exceedsWordCount || exceedsDuration || exceedsCpl || isSpeechPause || isSentenceEnd || isClauseBreak) {
        pushChunk(currentChunk);
        currentChunk = [];
      }
    }

    currentChunk.push(w);

    if (w.forceBreak) {
      pushChunk(currentChunk);
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    pushChunk(currentChunk);
  }

  return chunks;
}

function analyzeTranscriptQC(customWords, customOptions) {
  const chunks = buildWordChunks(customWords, customOptions);
  let totalIssues = 0;
  const wordWarnings = new Map();

  chunks.forEach((chunk) => {
    const words = chunk.words;
    if (!words || words.length === 0) return;
    const t0 = words[0].start;
    const t1 = words[words.length - 1].end;
    const dur = Math.max(t1 - t0, MIN_CLIP_DURATION_SEC);
    const totalChars = words.reduce((acc, w) => acc + (w.text ? w.text.trim().length : 0), 0) + Math.max(0, words.length - 1);
    const cps = totalChars / dur;
    const maxCpl = Math.max(...chunk.lines.map((l) => l.map((w) => (w.text ? w.text.trim() : "")).join(" ").length));

    const isOverCPS = cps > 20.0;
    const isOverCPL = maxCpl > 38;

    if (isOverCPS || isOverCPL) {
      totalIssues++;
      words.forEach((w, idx) => {
        const isEnd = idx === words.length - 1;
        wordWarnings.set(w, { isOverCPS, isOverCPL, cps, maxCpl, isEnd });
      });
    }
  });

  return { chunks, totalIssues, wordWarnings };
}

getEl("wordsPerClip")?.addEventListener("input", () => {
  renderWordEditor();
  saveAppSettings();
});
getEl("wordsPerClip")?.addEventListener("change", saveAppSettings);
getEl("chkDualLine")?.addEventListener("change", () => {
  renderWordEditor();
  saveAppSettings();
});
getEl("posPreset")?.addEventListener("change", saveAppSettings);
getEl("highlightMode")?.addEventListener("change", saveAppSettings);
getEl("langSelect")?.addEventListener("change", saveAppSettings);
getEl("styleSelect")?.addEventListener("change", saveAppSettings);
getEl("videoTrackSelect")?.addEventListener("change", saveAppSettings);
getEl("textScaleSlider")?.addEventListener("input", (e) => {
  syncTextScale(e.target.value, "slider");
  saveAppSettings();
});
getEl("textScale")?.addEventListener("input", (e) => {
  const v = parseInt(e.target.value, 10);
  if (!isNaN(v) && v >= 40 && v <= 200) {
    syncTextScale(v, "number");
    saveAppSettings();
  }
});
getEl("textScale")?.addEventListener("change", (e) => {
  syncTextScale(e.target.value);
  saveAppSettings();
});

function validateTranscriptWords(items, maxItems = 50000) {
  if (!Array.isArray(items)) return { words: [], droppedCount: 0 };
  let droppedCount = 0;
  const valid = [];

  for (const item of items) {
    if (valid.length >= maxItems) {
      droppedCount++;
      continue;
    }
    if (!item || typeof item !== "object") {
      droppedCount++;
      continue;
    }
    const text = typeof item.text === "string" ? item.text.trim() : "";
    const start = Number(item.start);
    const end = Number(item.end);

    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end < start || start < 0) {
      droppedCount++;
      continue;
    }

    if (/\s+/.test(text)) {
      const parts = splitWordAtSpaces({
        text,
        start,
        end,
        isKeyword: Boolean(item.isKeyword),
        forceBreak: Boolean(item.forceBreak)
      });
      parts.forEach((p) => {
        if (valid.length < maxItems) {
          valid.push({
            text: p.text,
            start: Number(p.start.toFixed(3)),
            end: Number(p.end.toFixed(3)),
            isKeyword: Boolean(p.isKeyword),
            forceBreak: Boolean(p.forceBreak)
          });
        } else {
          droppedCount++;
        }
      });
    } else {
      valid.push({
        text,
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3)),
        isKeyword: Boolean(item.isKeyword),
        forceBreak: Boolean(item.forceBreak)
      });
    }
  }

  valid.sort((a, b) => a.start - b.start);
  return { words: valid, droppedCount };
}

getEl("btnExportSRT")?.addEventListener("click", () => {
  const chunks = buildWordChunks();
  if (chunks.length === 0) return setStatus("No transcript to export.", "warning");
  const dlg = window.cep.fs.showSaveDialogEx("Export SRT", os.homedir(), ["srt"], "bisik.srt");
  if (!dlg.data) return;

  let srt = "";
  chunks.forEach((cObj, i) => {
    const c = cObj.words;
    const text = cObj.lines.map((l) => l.map((w) => w.text.trim()).join(" ")).join("\n");
    const startTime = c[0].start;
    const nextStart = (i < chunks.length - 1 && chunks[i + 1].words[0]) ? chunks[i + 1].words[0].start : Infinity;
    let endTime = Math.max(c[c.length - 1].end, startTime + MIN_CLIP_DURATION_SEC);
    if (endTime > nextStart) {
      endTime = nextStart; // Task 19: Clamp each cue's end to the next cue's start so cues never overlap
    }
    srt += `${i + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${text}\n\n`;
  });
  fs.writeFileSync(dlg.data, srt, "utf8");
  setStatus(`Saved SRT: ${path.basename(dlg.data)}`, "success");
});

getEl("btnExportJSON")?.addEventListener("click", () => {
  if (state.words.length === 0) return setStatus("No transcript to export.", "warning");
  const dlg = window.cep.fs.showSaveDialogEx("Export JSON", os.homedir(), ["json"], "bisik.json");
  if (!dlg.data) return;
  fs.writeFileSync(dlg.data, JSON.stringify(state.words, null, 2), "utf8");
  setStatus(`Saved JSON: ${path.basename(dlg.data)}`, "success");
});

getEl("btnImportFile")?.addEventListener("click", () => {
  const dlg = window.cep.fs.showOpenDialogEx(false, false, "Import SRT or JSON", os.homedir(), ["srt", "json"]);
  if (!dlg.data || !dlg.data[0]) return;
  const filePath = dlg.data[0];
  const raw = fs.readFileSync(filePath, "utf8");

  try {
    pushHistoryState(); // Task 20: save history state before replacing transcript
    let rawImported = [];
    if (filePath.toLowerCase().endsWith(".json")) {
      rawImported = JSON.parse(raw);
    } else {
      const blocks = raw.trim().split(/\r?\n\r?\n/);
      blocks.forEach((b) => {
        const lines = b.split(/\r?\n/);
        if (lines.length >= 3 && lines[1].includes("-->")) {
          const [t0, t1] = lines[1].split("-->");
          const bStart = parseSrtTime(t0);
          const bEnd = parseSrtTime(t1);
          const tokens = lines.slice(2).join(" ").trim().split(/\s+/).filter(Boolean);
          const step = (bEnd - bStart) / Math.max(1, tokens.length);
          tokens.forEach((tok, idx) => {
            const s = Number((bStart + idx * step).toFixed(3));
            rawImported.push({
              text: tok,
              start: s,
              end: Number((s + step).toFixed(3)),
              isKeyword: autoDetectKeyword(tok),
              forceBreak: idx === tokens.length - 1
            });
          });
        }
      });
    }

    const { words, droppedCount } = validateTranscriptWords(rawImported);
    if (words.length === 0) {
      return setStatus("No valid transcript words found in file.", "warning");
    }
    state.words = words;
    renderWordEditor();
    const droppedMsg = droppedCount > 0 ? ` (${droppedCount} invalid items dropped)` : "";
    setStatus(`Imported ${state.words.length} words${droppedMsg}.`, "success");
  } catch (err) {
    setStatus(err, "error");
  }
});

// ============================================================================
// 6. LIVE PLAYHEAD SYNC POLLING (Adaptive 200ms/500ms + Binary Search) (Task 21)
// ============================================================================
let lastPolledSec = -1;
let lastMoveTime = Date.now();
let isPollingActive = false;

function findActiveWordIndex(words, currentSec) {
  if (!words || words.length === 0) return -1;
  let low = 0, high = words.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const w = words[mid];
    const s = w.start - 0.05;
    const e = w.end + 0.08;
    if (currentSec >= s && currentSec <= e) {
      return mid;
    } else if (currentSec < s) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return -1;
}

async function pollPlayheadStep() {
  if (typeof window === "undefined") return;
  const autoScroll = getEl("chkAutoScroll");
  const isSyncEnabled = !autoScroll || autoScroll.checked;
  const isVisible = typeof document !== "undefined" && !document.hidden;

  if (isVisible && isSyncEnabled && !isPollingActive) {
    isPollingActive = true;
    try {
      const posStr = await evalJSX("getPlayheadPosition()", 2000);
      const currentSec = parseFloat(posStr);
      if (!isNaN(currentSec) && currentSec >= 0) {
        if (Math.abs(currentSec - lastPolledSec) >= 0.001) {
          lastMoveTime = Date.now();
          lastPolledSec = currentSec;

          if (playheadBadge) playheadBadge.textContent = formatTime(currentSec);

          if (state.words.length > 0) {
            const activeIdx = findActiveWordIndex(state.words, currentSec);
            if (activeIdx !== state.lastActiveIndex) {
              if (state.lastActiveIndex !== -1) {
                const prev = getEl(`word-chip-${state.lastActiveIndex}`);
                if (prev) prev.classList.remove("active-playhead");
              }
              if (activeIdx !== -1) {
                const curr = getEl(`word-chip-${activeIdx}`);
                if (curr) {
                  curr.classList.add("active-playhead");
                  if (autoScroll && autoScroll.checked) {
                    curr.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }
              }
              state.lastActiveIndex = activeIdx;
            }
          }
        }
      }
    } catch (_) {
      // Non-blocking playhead poll
    } finally {
      isPollingActive = false;
    }
  }

  let delay = 250;
  if (!isVisible || !isSyncEnabled) {
    delay = 1000;
  } else if (Date.now() - lastMoveTime > 2000) {
    delay = 500; // backed off when stationary for 2s
  } else {
    delay = 200; // active movement
  }
  setTimeout(pollPlayheadStep, delay);
}

if (typeof window !== "undefined") {
  setTimeout(pollPlayheadStep, 250);
}

// ============================================================================
// 7. TRANSCRIBE AUDIO VIA FFMPEG & WHISPER-CPP (NON-BLOCKING SPAWN + PROGRESS)
// ============================================================================
let activeSpawnProcess = null;
let isTranscriptionCancelled = false;

function getExecutableName(baseName) {
  return process.platform === "win32" ? `${baseName}.exe` : baseName;
}

function getSystemEnvPath() {
  const isWin = process.platform === "win32";
  if (isWin) {
    const commonWinPaths = [
      "C:\\Program Files\\ffmpeg\\bin",
      "C:\\ffmpeg\\bin",
      "C:\\ProgramData\\chocolatey\\bin",
      path.join(os.homedir(), "scoop", "shims"),
      path.join(os.homedir(), "AppData", "Local", "Programs", "ffmpeg", "bin"),
      path.join(os.homedir(), "AppData", "Local", "Microsoft", "WinGet", "Links"),
      path.join(os.homedir(), ".whisper-models"),
      path.join(os.homedir(), "whisper-cpp")
    ];
    return [...commonWinPaths, process.env.PATH || ""].join(path.delimiter);
  } else {
    const commonMacPaths = [
      path.join(os.homedir(), "whisper-cpp"),
      path.join(os.homedir(), ".whisper-models"),
      path.join(os.homedir(), "Library", "Application Support", "bisik", "bin"),
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/opt/local/bin"
    ];
    return [...commonMacPaths, process.env.PATH || ""].join(path.delimiter);
  }
}

function resolveExecutable(primaryName, fallbackNames = []) {
  const envPath = getSystemEnvPath();
  const pathDirs = envPath.split(path.delimiter).filter(Boolean);
  const candidates = [primaryName, ...fallbackNames].map(getExecutableName);

  for (const binName of candidates) {
    for (const dir of pathDirs) {
      const fullPath = path.join(dir, binName);
      try {
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          return fullPath;
        }
      } catch (e) { }
    }
  }
  return getExecutableName(primaryName);
}

function getSafeTempRoot() {
  const base = os.tmpdir();
  const dir = path.join(base, "bisik_scratch");
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { }
  }
  return dir;
}

function cleanupDirectorySafe(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const full = path.join(dirPath, entry);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) cleanupDirectorySafe(full);
        else fs.unlinkSync(full);
      } catch (e) { }
    }
    fs.rmdirSync(dirPath);
  } catch (err) { }
}

function cleanOldTempDirectories() {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const rootsToScan = [os.tmpdir(), getSafeTempRoot()];

  for (const root of rootsToScan) {
    try {
      if (!fs.existsSync(root)) continue;
      const entries = fs.readdirSync(root);
      for (const name of entries) {
        if (name.startsWith("bisik_job_") || name.startsWith("bisik_payload_") || name.startsWith("bisik_temp") || name.startsWith("bisik_")) {
          const full = path.join(root, name);
          try {
            const st = fs.statSync(full);
            if (now - st.mtimeMs > ONE_DAY_MS) {
              cleanupDirectorySafe(full);
            }
          } catch (e) { }
        }
      }
    } catch (err) { }
  }
}

let currentJob = null;
function createJob() {
  const dir = fs.mkdtempSync(path.join(getSafeTempRoot(), "bisik_job_"));
  return { id: String(Date.now()), dir, cancelled: false, children: new Set() };
}

function cancelJob(job) {
  if (!job) return;
  job.cancelled = true;
  job.children.forEach(terminateProcess);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (currentJob) cancelJob(currentJob);
  });
}
if (typeof process !== "undefined" && process.on) {
  process.on("exit", () => {
    if (currentJob) cancelJob(currentJob);
  });
}

// Clean old temporary jobs on module boot
try { cleanOldTempDirectories(); } catch (bootCleanErr) { }

function buildChildEnv() {
  const envPath = getSystemEnvPath();
  const clean = { ...process.env };
  if (process.platform === "win32") {
    for (const key of Object.keys(clean)) {
      if (key.toLowerCase() === "path") delete clean[key];
    }
  }
  clean.PATH = envPath;
  return clean;
}

let cachedWhisperCaps = null;
function probeWhisperCapabilities(whisperBin, env) {
  if (cachedWhisperCaps) return cachedWhisperCaps;
  try {
    let output = "";
    try {
      const res = spawnSync(whisperBin, ["--help"], {
        env: env || process.env,
        timeout: 5000,
        windowsHide: true,
        encoding: "utf8"
      });
      output = ((res.stdout || "") + "\n" + (res.stderr || "")).toString();
    } catch (cmdErr) {
      if (cmdErr && cmdErr.stdout) output += cmdErr.stdout.toString();
      if (cmdErr && cmdErr.stderr) output += cmdErr.stderr.toString();
    }

    if (!output || output.trim().length === 0) {
      throw new Error("Empty help output from whisper-cli");
    }

    cachedWhisperCaps = {
      supportsNoPrints: output.includes("-np") || output.includes("--no-prints"),
      supportsPrintProgress: output.includes("-pp") || output.includes("--print-progress"),
      supportsMaxContext: output.includes("-mc") || output.includes("--max-context"),
      supportsEntropyThold: output.includes("--entropy-thold") || output.includes("-et"),
      supportsLogprobThold: output.includes("--logprob-thold") || output.includes("-lpt"),
      supportsSplitOnWord: output.includes("-sow") || output.includes("--split-on-word"),
      supportsMaxLen: output.includes("-ml") || output.includes("--max-len"),
      supportsOutputJsonFull: output.includes("-ojf") || output.includes("--output-json-full"),
      supportsSuppressNst: output.includes("--suppress-nst"),
      isWhisperCpp: output.includes("whisper-cli") || output.includes("usage: main") || output.includes("ggml") || output.includes("--model")
    };
  } catch (err) {
    cachedWhisperCaps = {
      supportsNoPrints: true,
      supportsPrintProgress: true,
      supportsMaxContext: true,
      supportsEntropyThold: false,
      supportsLogprobThold: false,
      supportsSplitOnWord: true,
      supportsMaxLen: true,
      supportsOutputJsonFull: true,
      supportsSuppressNst: false,
      isWhisperCpp: true
    };
  }
  return cachedWhisperCaps;
}

function findAvailableWhisperModel(extRoot, lang = "id") {
  const candidateDirs = [
    path.join(os.homedir(), ".whisper-models"),
    path.join(os.homedir(), "whisper-models"),
    path.join(os.homedir(), "whisper-cpp", "models"),
    path.join(os.homedir(), "whisper-cpp"),
    path.join(os.homedir(), "Library", "Application Support", "bisik", "models"),
    path.join(os.homedir(), "AppData", "Local", "whisper-models"),
    path.join(extRoot || "", "models")
  ];

  // Prioritize quality models: Turbo -> Large-v3 -> Medium -> Small -> Base -> Tiny
  const preferredFiles = [
    "ggml-large-v3-turbo.bin",
    "ggml-large-v3.bin",
    "ggml-medium.bin",
    "ggml-small.bin",
    "ggml-base.bin",
    "ggml-tiny.bin"
  ];

  for (const dir of candidateDirs) {
    for (const f of preferredFiles) {
      if (lang !== "en" && f.endsWith(".en.bin")) continue;
      const p = path.join(dir, f);
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
      } catch (e) { }
    }
  }

  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const entries = fs.readdirSync(dir);
        const binFile = entries.find((e) => {
          if (!e.startsWith("ggml-") || !e.endsWith(".bin")) return false;
          if (e.includes("silero")) return false; // reject VAD model
          if (lang !== "en" && e.endsWith(".en.bin")) return false;
          return true;
        });
        if (binFile) return path.join(dir, binFile);
      }
    } catch (e) { }
  }

  return null;
}

function terminateProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" });
      } catch (e) {
        try { proc.kill(); } catch (e2) { }
      }
    } else {
      try {
        proc.kill("SIGKILL");
      } catch (e) {
        try { proc.kill("SIGTERM"); } catch (e2) { }
      }
    }
  } catch (err) { }
}

function runAsyncProcess(cmd, args, opts = {}) {
  const options = (opts && opts.PATH) ? { env: opts } : (opts || {});
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(cmd, args, {
        env: options.env || process.env,
        cwd: options.cwd,
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"]
      });
      activeSpawnProcess = child;
      if (options.job && options.job.children) {
        options.job.children.add(child);
      }
      let tail = "";
      let stderrRemainder = "";
      child.stderr.on("data", (d) => {
        const s = d.toString();
        tail = (tail + s).slice(-8192);
        if (options.onStderr) {
          options.onStderr(s);
        }
        if (options.onProgress) {
          const streamText = stderrRemainder + s;
          const matches = [...streamText.matchAll(/progress\s*=\s*(\d+)%/g)];
          matches.forEach((m) => {
            const pct = parseInt(m[1], 10);
            if (!isNaN(pct)) options.onProgress(pct);
          });
          stderrRemainder = streamText.slice(-64);
        }
      });
      child.on("error", (err) => {
        if (options.job && options.job.children) options.job.children.delete(child);
        activeSpawnProcess = null;
        reject(err);
      });
      child.on("close", (code) => {
        if (options.job && options.job.children) options.job.children.delete(child);
        activeSpawnProcess = null;
        if (options.job && options.job.cancelled) return reject(new Error("Transcription cancelled by user."));
        if (code === 0) resolve();
        else reject(new Error(tail.trim() || `${cmd} exited with code ${code}`));
      });
    } catch (e) {
      activeSpawnProcess = null;
      reject(e);
    }
  });
}

const progressContainer = getEl("transcribeProgressContainer");
const progressBar = getEl("transcribeProgressBar");
const progressText = getEl("transcribeProgressText");
const btnCancelTranscribe = getEl("btnCancelTranscribe");
const btnTranscribe = getEl("btnTranscribe");

btnCancelTranscribe?.addEventListener("click", () => {
  if (currentJob && !currentJob.cancelled) {
    btnCancelTranscribe.disabled = true;
    btnCancelTranscribe.textContent = "Cancelling...";
    setStatus("Cancelling transcription...", "warning");
    cancelJob(currentJob);
  }
});

btnTranscribe?.addEventListener("click", async () => {
  if (btnTranscribe.disabled) return;
  btnTranscribe.disabled = true;
  if (btnCancelTranscribe) {
    btnCancelTranscribe.disabled = false;
    btnCancelTranscribe.textContent = "Cancel";
  }

  let job = null;
  try {
    const trackIdx = audioSelect ? audioSelect.value : null;
    if (trackIdx === null || trackIdx === "") {
      throw new Error("No audio track selected.");
    }
    const lang = getEl("langSelect") ? getEl("langSelect").value : "id";
    const rangeRadio = queryEl('input[name="rangeMode"]:checked');
    const rangeMode = rangeRadio ? rangeRadio.value : "entire";

    const extRoot = csInterface.getSystemPath(SystemPath.EXTENSION);

    // Task 15: Capture active sequence identifier to prevent rendering to wrong sequence
    try {
      const rawSeq = await evalJSX("bisikGetActiveSequenceId()");
      const seqData = JSON.parse(rawSeq);
      if (seqData && seqData.sequenceId) {
        state.transcribedSequenceId = seqData.sequenceId;
      }
    } catch (seqErr) { }

    // Task 11: Create job with isolated temporary scratch directory and cancellation token
    job = createJob();
    currentJob = job;

    setStatus(`Extracting audio (${rangeMode})...`, "info");
    const rawClips = await evalJSX(`getTrackAudioClipsByRange(${trackIdx}, "${rangeMode}")`);
    let clipData;
    try {
      clipData = JSON.parse(rawClips);
    } catch (parseErr) {
      throw new Error("ExtendScript error while reading timeline audio clips: " + (rawClips ? rawClips.slice(0, 80) : "empty response"));
    }
    if (clipData.error) {
      throw new Error(clipData.error);
    }
    if (!clipData.clips || clipData.clips.length === 0) {
      throw new Error("No audio clips found on selected track in this range.");
    }

    if (state.words.length > 0) pushHistoryState(); // Task 20: save history state before re-transcribing
    state.words = [];
    const childEnv = buildChildEnv();
    const ffmpegBin = resolveExecutable("ffmpeg");
    const whisperBin = resolveExecutable("whisper-cli", ["whisper-cpp"]);

    if (!fs.existsSync(ffmpegBin)) {
      const installCmd = process.platform === "win32" ? "winget install Gyan.FFmpeg" : "brew install ffmpeg";
      throw new Error(`FFmpeg not found. Please install via '${installCmd}' or run the AI setup script.`);
    }

    if (!fs.existsSync(whisperBin)) {
      const installCmd = process.platform === "win32" ? "winget install whisper.cpp" : "brew install whisper-cpp";
      throw new Error(`Whisper CLI not found. Please install via '${installCmd}' or run the AI setup script.`);
    }

    const modelPath = findAvailableWhisperModel(extRoot, lang);
    if (!modelPath) {
      const expectedDir = path.join(os.homedir(), ".whisper-models");
      throw new Error(`Whisper model missing. Run the AI setup script or place a ggml model into ${expectedDir}`);
    }

    const modelShortName = path.basename(modelPath, ".bin").replace(/^ggml-/, "").toUpperCase();

    if (progressContainer) progressContainer.style.display = "flex";
    if (progressBar) progressBar.style.width = "0%";
    const totalClips = clipData.clips.length;
    // Sort clips chronologically by timeline start to guarantee sequential audio assembly
    clipData.clips.sort((a, b) => a.timelineStart - b.timelineStart);

    const concatFiles = [];
    const zones = [];
    let cursor = 0;
    const SILENCE_CAP_SEC = 2.0;

    // Phase 1: Extract 16kHz PCM WAV for each clip & bridge timeline gaps with exact silence
    for (let i = 0; i < totalClips; i++) {
      if (job.cancelled) throw new Error("Transcription cancelled by user.");
      const clip = clipData.clips[i];
      const wavPath = path.join(job.dir, `clip_${i}.wav`);
      const duration = Math.max(0.05, clip.outPoint - clip.inPoint).toFixed(3);

      const convPct = Math.round((i / totalClips) * 40);
      if (progressBar) progressBar.style.width = `${convPct}%`;
      if (progressText) progressText.textContent = `${convPct}% Converting WAV [${i + 1}/${totalClips}]...`;
      setStatus(`[${i + 1}/${totalClips}] Converting WAV via FFmpeg...`);

      // Sample-accurate audio decoding (-accurate_seek -ss before -i guarantees exact sample sync with timeline)
      await runAsyncProcess(
        ffmpegBin,
        [
          "-hide_banner", "-nostats", "-loglevel", "error", "-y",
          "-accurate_seek",
          "-ss", String(clip.inPoint),
          "-i", clip.mediaPath,
          "-t", duration,
          "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
          wavPath
        ],
        { env: childEnv, job }
      );
      if (job.cancelled) throw new Error("Transcription cancelled by user.");

      // Task 8: Measured WAV duration & per-clip offset map
      const wavDur = readWavDurationSec(wavPath);
      const effectiveRatio = Number(clip.speedRatio) || 1.0;
      zones.push({
        kind: "clip",
        masterStart: cursor,
        masterEnd: cursor + wavDur,
        timelineStart: clip.timelineStart,
        timelineEnd: clip.timelineEnd,
        speedRatio: effectiveRatio
      });
      cursor += wavDur;
      concatFiles.push(wavPath);

      // Check gap to next clip and bridge with precise, capped silence
      if (i < totalClips - 1) {
        const gap = clipData.clips[i + 1].timelineStart - clip.timelineEnd;
        if (gap > 0.05) {
          const silDur = Math.min(gap, SILENCE_CAP_SEC);
          const gapWavPath = path.join(job.dir, `gap_${i}.wav`);
          await runAsyncProcess(
            ffmpegBin,
            [
              "-hide_banner", "-nostats", "-loglevel", "error", "-y",
              "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono",
              "-t", silDur.toFixed(3),
              "-c:a", "pcm_s16le",
              gapWavPath
            ],
            { env: childEnv, job }
          );
          if (job.cancelled) throw new Error("Transcription cancelled by user.");

          const actualSilDur = readWavDurationSec(gapWavPath);
          zones.push({
            kind: "silence",
            masterStart: cursor,
            masterEnd: cursor + actualSilDur,
            timelineStart: clip.timelineEnd,
            timelineEnd: clip.timelineEnd + gap,
            speedRatio: 1.0
          });
          cursor += actualSilDur;
          concatFiles.push(gapWavPath);
        }
      }
    }

    if (job.cancelled) throw new Error("Transcription cancelled by user.");

    // Phase 2: Consolidate audio into single master WAV
    let masterWavPath = concatFiles[0];
    if (concatFiles.length > 1) {
      if (progressBar) progressBar.style.width = "45%";
      if (progressText) progressText.textContent = "45% Consolidating sequence audio...";
      const listPath = path.join(job.dir, "concat_list.txt");
      const listContent = concatFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
      fs.writeFileSync(listPath, listContent, "utf8");

      masterWavPath = path.join(job.dir, "master_consolidated.wav");
      await runAsyncProcess(
        ffmpegBin,
        ["-hide_banner", "-nostats", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", masterWavPath],
        { env: childEnv, job }
      );
    }

    if (job.cancelled) throw new Error("Transcription cancelled by user.");

    // Phase 3: Single-pass Whisper AI inference
    if (progressBar) progressBar.style.width = "50%";
    if (progressText) progressText.textContent = `50% Whisper AI (${modelShortName} • ${lang.toUpperCase()})...`;
    setStatus(`Transcribing full sequence via Whisper AI (${modelShortName})...`);

    const numCores = (os.cpus() && os.cpus().length) || 4;
    const threadCount = String(Math.max(1, Math.min(8, numCores - 2)));
    const jsonOutPrefix = path.join(job.dir, "transcription_master");

    // Task 12: Probe Whisper capabilities & configure robust decoding flags
    const caps = probeWhisperCapabilities(whisperBin, childEnv);
    const whisperArgs = [
      "-t", threadCount,
      "-m", modelPath,
      "-f", masterWavPath,
      "-l", lang
    ];

    if (caps.supportsOutputJsonFull) {
      whisperArgs.push("-ojf");
    } else {
      whisperArgs.push("-oj");
    }
    whisperArgs.push("-of", jsonOutPrefix);

    if (caps.supportsSplitOnWord) whisperArgs.push("-sow");
    if (caps.supportsMaxLen) whisperArgs.push("-ml", "1");
    if (caps.supportsNoPrints) whisperArgs.push("-np");
    if (caps.supportsPrintProgress) whisperArgs.push("-pp");
    // -mc 0 stops Whisper carrying over context across 30-sec windows, preventing repetition loops!
    if (caps.supportsMaxContext) whisperArgs.push("-mc", "0");
    if (caps.supportsEntropyThold) whisperArgs.push("--entropy-thold", "2.4");
    if (caps.supportsLogprobThold) whisperArgs.push("--logprob-thold", "-1.0");
    if (caps.supportsSuppressNst) whisperArgs.push("--suppress-nst");

    await runAsyncProcess(
      whisperBin,
      whisperArgs,
      {
        env: childEnv,
        job,
        onProgress: (pct) => {
          const mapped = 50 + Math.round((pct / 100) * 40);
          if (progressBar) progressBar.style.width = `${mapped}%`;
          if (progressText) progressText.textContent = `${mapped}% Whisper AI (${modelShortName} • ${pct}%)...`;
        }
      }
    );

    if (job.cancelled) throw new Error("Transcription cancelled by user.");

    if (progressBar) progressBar.style.width = "90%";
    if (progressText) progressText.textContent = "90% Parsing tokens & mapping timeline...";

    const whisperJson = JSON.parse(fs.readFileSync(`${jsonOutPrefix}.json`, "utf8"));

    // Extract individual tokens from Whisper segments or interpolate words if full segments
    const rawTokens = [];
    if (Array.isArray(whisperJson.transcription)) {
      for (const seg of whisperJson.transcription) {
        if (Array.isArray(seg.tokens) && seg.tokens.length > 0) {
          rawTokens.push(...seg.tokens);
        } else if (seg.text && seg.offsets) {
          const segText = seg.text.trim();
          const wordsInSeg = segText.split(/\s+/).filter(Boolean);
          if (wordsInSeg.length > 1) {
            const segStart = seg.offsets.from;
            const segEnd = seg.offsets.to;
            const segDur = Math.max(100, segEnd - segStart);
            const totalChars = wordsInSeg.reduce((sum, w) => sum + w.length, 0);
            let curFrom = segStart;
            for (let wi = 0; wi < wordsInSeg.length; wi++) {
              const wStr = wordsInSeg[wi];
              const frac = totalChars > 0 ? (wStr.length / totalChars) : (1 / wordsInSeg.length);
              const wDur = segDur * frac;
              const curTo = (wi === wordsInSeg.length - 1) ? segEnd : Math.round(curFrom + wDur);
              rawTokens.push({
                text: " " + wStr,
                offsets: { from: curFrom, to: curTo }
              });
              curFrom = curTo;
            }
          } else {
            rawTokens.push({
              text: seg.text,
              offsets: seg.offsets
            });
          }
        }
      }
    }

    const reconstructed = reconstructFullWords(rawTokens.length > 0 ? rawTokens : (whisperJson.transcription || []));

    // Ensure every single item in reconstructed is a discrete, single word
    const singleTokens = [];
    for (const item of reconstructed) {
      const trimmed = (item.text || "").trim();
      const fromMs = (typeof item.from === "number") ? item.from : ((item.offsets && typeof item.offsets.from === "number") ? item.offsets.from : 0);
      const toMs = (typeof item.to === "number") ? item.to : ((item.offsets && typeof item.offsets.to === "number") ? item.offsets.to : fromMs + 200);
      if (/\s+/.test(trimmed)) {
        const parts = splitWordAtSpaces({
          text: trimmed,
          start: fromMs / 1000,
          end: toMs / 1000
        });
        parts.forEach((p) => {
          singleTokens.push({
            text: p.text,
            from: Math.round(p.start * 1000),
            to: Math.round(p.end * 1000)
          });
        });
      } else {
        singleTokens.push({
          text: trimmed,
          from: fromMs,
          to: toMs
        });
      }
    }

    // Task 8: Map tokens through zone map and drop words recognized during synthetic silence
    singleTokens.forEach((token) => {
      const cleanWord = token.text.trim();
      const tokenStart = token.from / 1000;
      const tokenEnd = token.to / 1000;
      const mapped = mapMasterToTimeline(zones, tokenStart, tokenEnd);
      if (!mapped) return; // Drop silence zone hallucinations

      if (cleanWord.length > 0 && mapped.end > mapped.start) {
        state.words.push({
          text: cleanWord,
          start: mapped.start,
          end: Math.max(mapped.end, mapped.start + 0.16),
          isKeyword: autoDetectKeyword(cleanWord),
          forceBreak: /[.?!]$/.test(cleanWord)
        });
      }
    });

    if (job && !job.cancelled) {
      if (progressBar) progressBar.style.width = "100%";
      if (progressText) progressText.textContent = "100% Done";
      renderWordEditor();
      setStatus(`Transcribed ${state.words.length} words via Whisper ${modelShortName}.`, "success");
    }
  } catch (err) {
    if (!job || !job.cancelled) {
      setStatus(err.message || String(err), "error");
    } else {
      setStatus("Transcription cancelled by user.", "warning");
    }
  } finally {
    if (btnTranscribe) btnTranscribe.disabled = false;
    if (btnCancelTranscribe) {
      btnCancelTranscribe.disabled = false;
      btnCancelTranscribe.textContent = "Cancel";
    }
    setTimeout(() => {
      if (progressContainer) progressContainer.style.display = "none";
    }, 800);

    // Task 11: Safe cleanup of isolated job directory
    if (job && job.dir) {
      cleanupDirectorySafe(job.dir);
    }
    currentJob = null;
  }
});

// ============================================================================
// 8. RENDER MOGRTS TO TIMELINE (WITH FONT & WHEEL COLOR INJECTION)
// ============================================================================
btnRender?.addEventListener("click", async () => {
  if (btnRender.disabled) return;
  btnRender.disabled = true;

  try {
    const styleFile = (getEl("styleSelect") && getEl("styleSelect").value) ? getEl("styleSelect").value : "bisik_clean-cut.mogrt";
    const userDualLine = Boolean(getEl("chkDualLine") && getEl("chkDualLine").checked);
    const chunks = buildWordChunks(state.words, {
      style: styleFile,
      isDualLine: userDualLine
    });
    if (chunks.length === 0) return setStatus("No words to render.", "warning");

    const videoTrackIdx = parseInt(videoSelect.value, 10);
    const rawFont = getEl("fontSelect") ? getEl("fontSelect").value : "Arial-Black";
    const fontName = (fontPostScriptMap && fontPostScriptMap[rawFont]) || rawFont;
    const highlightMode = getEl("highlightMode").value;
    const normalizedColor = hexToNormalizedFloatRgb(state.selectedHex);
    const posMode = getEl("posPreset") ? getEl("posPreset").value : "bottom";
    const textScale = parseInt(getEl("textScale").value, 10) || 100;

    const extRoot = csInterface.getSystemPath(SystemPath.EXTENSION);
    const mogrtPath = path.join(extRoot, "assets", styleFile);

    if (!fs.existsSync(mogrtPath)) {
      btnRender.disabled = false;
      return setStatus(`Missing MOGRT: ${styleFile} in assets/`, "error");
    }

    const allSegments = [];
    const ACOUSTIC_LEAD_SEC = 0.06; // 60ms acoustic onset alignment

    chunks.forEach((chunkObj, idx) => {
      const chunk = chunkObj.words;
      const prevEnd = (idx > 0) ? allSegments[idx - 1].end : 0;
      const rawStart = Math.max(0, chunk[0].start - ACOUSTIC_LEAD_SEC);
      const clipStartSec = Math.max(prevEnd, rawStart);

      const nextStart = (idx < chunks.length - 1 && chunks[idx + 1].words[0])
        ? Math.max(0, chunks[idx + 1].words[0].start - ACOUSTIC_LEAD_SEC)
        : Infinity;

      const naturalEnd = chunk[chunk.length - 1].end;
      const minEnd = clipStartSec + 0.35;
      let clipEndSec = Math.max(naturalEnd, minEnd);
      if (clipEndSec >= nextStart) {
        clipEndSec = Math.max(clipStartSec + 0.2, nextStart - 0.03);
      }

      const wordTimings = [];
      const formattedText = chunkObj.lines.map((line) => line.map((w) => w.text.trim()).join(" ")).join("\n");

      chunk.forEach((w) => {
        const relStart = Number(Math.max(0, w.start - clipStartSec).toFixed(3));
        const relEnd = Number(Math.max(relStart + 0.10, w.end - clipStartSec).toFixed(3));

        // Highlight flag contract:
        // 0 = no highlight
        // 1 = highlight only while the word is being spoken
        // 2 = keyword, always highlighted
        // 3 = keyword (in "Active + Key" mode), always highlighted
        let kFlag = 0;
        if (highlightMode === "active") kFlag = 1;
        else if (highlightMode === "keywords") kFlag = w.isKeyword ? 2 : 0;
        else if (highlightMode === "both") kFlag = w.isKeyword ? 3 : 1;
        else if (highlightMode === "off") kFlag = 0;

        wordTimings.push({
          s: relStart,
          e: relEnd,
          k: kFlag
        });
      });

      const clipDurationSec = Number((clipEndSec - clipStartSec).toFixed(3));
      const jsonTimingString = JSON.stringify({
        t: formattedText,
        f: fontName,
        fc: hexToNormalizedFloatRgb(state.fontColorHex || "#FFFFFF"),
        c: normalizedColor,
        bc: hexToNormalizedFloatRgb(state.boxColorHex || "#F43F5E"),
        pos: posMode,
        sc: textScale,
        d: clipDurationSec,
        w: wordTimings
      });

      allSegments.push({
        start: clipStartSec,
        end: clipEndSec,
        mogrtPath: mogrtPath,
        text: formattedText,
        font: fontName,
        posMode: posMode,
        textScale: textScale,
        wordTimingJson: jsonTimingString
      });
    });

    // Guard against active sequence changes between Transcribe and Render
    if (state.transcribedSequenceId) {
      try {
        const curSeqRaw = await evalJSX("bisikGetActiveSequenceId()");
        const curSeq = JSON.parse(curSeqRaw);
        if (curSeq.sequenceId && curSeq.sequenceId !== state.transcribedSequenceId) {
          btnRender.disabled = false;
          return setStatus("Active sequence changed since transcription. Switch back or re-transcribe.", "warning");
        }
      } catch (seqCheckErr) { }
    }

    // Pre-check target track validity and collision safety upfront before batching
    const minStart = allSegments.length > 0 ? allSegments[0].start : 0;
    const maxEnd = allSegments.length > 0 ? allSegments[allSegments.length - 1].end : 0;
    const precheckRaw = await evalJSX(`bisikPrecheckTarget(${videoTrackIdx}, ${minStart}, ${maxEnd})`);
    const precheck = JSON.parse(precheckRaw);
    if (precheck.error) {
      btnRender.disabled = false;
      return setStatus(precheck.error, "error");
    }

    // Optimized batch size of 5 for instant, crash-free, highly responsive imports
    const BATCH_SIZE = 5;
    let totalInserted = 0;

    const hasAnyDualLine = chunks.some((c) => c.lines && c.lines.length > 1);
    const isDualLine = userDualLine || hasAnyDualLine;
    const numBatches = Math.ceil(allSegments.length / BATCH_SIZE);
    for (let b = 0; b < numBatches; b++) {
      const batchSegments = allSegments.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const startIdx = b * BATCH_SIZE + 1;
      const endIdx = Math.min((b + 1) * BATCH_SIZE, allSegments.length);
      setStatus(`Inserting captions ${startIdx}-${endIdx}/${allSegments.length} (${fontName} • ${state.selectedHex})...`, "info");

      const payloadObject = {
        mogrtPath: mogrtPath,
        videoTrackIndex: videoTrackIdx,
        fontName: fontName,
        posMode: posMode,
        isDualLine: isDualLine,
        textScale: textScale,
        segments: batchSegments
      };

      const payloadPath = writePayloadFile(payloadObject);
      let rawRes = "";
      try {
        rawRes = await evalJSX(`bisikInjectFromFile(${jsxStringLiteral(payloadPath)})`, 120000);
      } finally {
        try {
          if (fs.existsSync(payloadPath)) {
            fs.unlinkSync(payloadPath);
            const pDir = path.dirname(payloadPath);
            if (fs.existsSync(pDir)) fs.rmdirSync(pDir);
          }
        } catch (cleanErr) { }
      }

      const res = JSON.parse(rawRes);
      if (res.error) {
        throw new Error(res.error);
      }
      totalInserted += (res.inserted || 0);

      if (b < numBatches - 1) {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    saveAppSettings();
    await loadTracks({ applyDefaults: false });
    setStatus(`Successfully inserted ${totalInserted} captions to timeline.`, "success");
  } catch (err) {
    setStatus(err.message || String(err), "error");
  } finally {
    btnRender.disabled = false;
  }
});

let clearConfirmTimer = null;
const btnClearTrack = getEl("btnClearTrack");
btnClearTrack?.addEventListener("click", async () => {
  const videoTrackIdx = parseInt(videoSelect.value, 10);

  // If already in confirming state, execute the clear:
  if (btnClearTrack.dataset.confirming === "true") {
    clearTimeout(clearConfirmTimer);
    delete btnClearTrack.dataset.confirming;
    btnClearTrack.textContent = "Clear Track";

    try {
      const raw = await evalJSX(`clearTargetTracks(${videoTrackIdx})`);
      const res = JSON.parse(raw);
      if (res.error) return setStatus(res.error, "error");
      await loadTracks({ applyDefaults: false });
      setStatus(`Cleared ${res.removedVideo} bisik captions.`, "success");
    } catch (err) {
      setStatus(err, "error");
    }
    return;
  }

  // First click: query clearable count
  try {
    const rawCount = await evalJSX(`bisikCountClearable(${videoTrackIdx})`);
    const countData = JSON.parse(rawCount);
    if (countData.error) return setStatus(countData.error, "error");

    const total = countData.videoCount || 0;
    if (total === 0) {
      return setStatus("No bisik caption clips found on the selected video track.", "warning");
    }

    btnClearTrack.dataset.confirming = "true";
    btnClearTrack.textContent = `Click again to confirm (${total} captions)`;

    clearConfirmTimer = setTimeout(() => {
      delete btnClearTrack.dataset.confirming;
      btnClearTrack.textContent = "Clear Track";
    }, 4000);
  } catch (e) {
    setStatus("Failed to inspect track for clearable captions.", "error");
  }
});

// Boot Studio
if (typeof window !== "undefined" && typeof document !== "undefined") {
  syncThemeWithHost();
  renderColorPalette();
  initPhotoshopColorPicker();
  initGalleryAndFilterListeners();
  renderStylePreviewGallery();
  initFontDropdown();
  initCustomFontDropdown();
  loadPresets();
  loadTracks({ applyDefaults: true });
  if (typeof sessionStorage !== "undefined") {
    try {
      const cached = sessionStorage.getItem("bisik_cached_words");
      if (cached && (!state.words || state.words.length === 0)) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.words = parsed;
          renderWordEditor();
        }
      }
    } catch (_) {}
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ADOBE_TICKS_PER_SECOND,
    MIN_CLIP_DURATION_SEC,
    SPECTRUM_SWATCHES,
    BISIK_ANIMATION_STYLES,
    measureWordInputWidth,
    reconstructFullWords,
    buildWordChunks,
    analyzeTranscriptQC,
    formatTime,
    formatSrtTime,
    parseSrtTime,
    secondsToTimecode,
    timecodeToSeconds,
    secondsToQuantizedTicks,
    ticksToSeconds,
    jsxStringLiteral,
    writePayloadFile,
    runAsyncProcess,
    readWavDurationSec,
    mapMasterToTimeline,
    splitWordAtSpaces,
    validateTranscriptWords,
    findActiveWordIndex,
    writeJsonAtomic,
    readJsonSafe,
    hexToNormalizedFloatRgb,
    autoDetectKeyword,
    filterFillerWords,
    getInstalledFontsSync,
    initFontDropdown,
    initCustomFontDropdown,
    populateCustomFontList,
    syncCustomFontDisplay,
    cleanFontFamily,
    applyFontSelection,
    fontPostScriptMap,
    loadRecentFonts,
    saveRecentFonts,
    recordRecentFont,
    MAX_RECENT_FONTS,
    DEFAULT_RECENT_FONTS,
    recentFonts,
    probeWhisperCapabilities,
    saveAppSettings,
    loadAppSettings,
    state
  };
}
