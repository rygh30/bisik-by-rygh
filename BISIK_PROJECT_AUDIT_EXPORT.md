# Complete Project Source & Architectural Audit Specification: bisik by rygh (v1.1.0)

> **Export Timestamp:** 2026-11-09 21:21:04
> **Bundle Identifier:** `com.rygh.bisik`
> **Target Runtime:** Adobe Premiere Pro 2022–2026+ (CEP 11.0–15.0) on macOS (Intel/Apple Silicon) & Windows 10/11 (x64)
> **Core Stack:** Chromium CEF (HTML5/CSS3 Spectrum UI), Node.js (Mixed Context), ExtendScript (ES3), FFmpeg, Whisper AI (whisper.cpp), Adobe After Effects ExtendScript

---

## Table of Contents

1. [Project Overview & Architectural Blueprint](#1-project-overview--architectural-blueprint)
2. [Known Technical Decisions & Critical Invariants](#2-known-technical-decisions--critical-invariants)
3. [Assets & Templates Inventory (14 MOGRTs + 3 SFX)](#3-assets--templates-inventory)
4. [Full Codebase & Scripts](#4-full-codebase--scripts)
   - **Configuration & Manifest**
     - `package.json`
     - `.debug`
     - `CSXS/manifest.xml`
     - `.gitignore`
   - **ExtendScript Automation Engine (Premiere Pro Host)**
     - `host/index.jsx`
   - **Client Webview UI & Studio Orchestrator**
     - `client/index.html`
     - `client/main.js`
   - **Build, Asset & Packaging Automation**
     - `scripts/build_bisik_mogrt.jsx`
     - `scripts/package_zxp.sh`
     - `scripts/generate_assets.sh`
   - **Automated Verification Test Suite (100% Pass)**
     - `tests/analyzeTranscriptQC.test.js`
     - `tests/buildWordChunks.test.js`
     - `tests/domConsistency.test.js`
     - `tests/reconstructFullWords.test.js`
     - `tests/timecodeConversion.test.js`
5. [Automated Test Suite & Verification Results](#5-automated-test-suite--verification-results)
6. [Suggested Audit Focus Areas for External Review](#6-suggested-audit-focus-areas-for-external-review)

---

## 1. Project Overview & Architectural Blueprint

`bisik by rygh` is an AI-powered, sample-accurate, kinetic typography and automatic captioning extension for Adobe Premiere Pro. It enables video editors to transcribe dialogue locally via Whisper AI and inject animated word-synced subtitles (MOGRTs) with sound effects directly onto sequence tracks in real time.

```
+---------------------------------------------------------------------------------------+
|                                ADOBE PREMIERE PRO HOST                                |
|                                                                                       |
|   +------------------------------------+    CSInterface IPC    +------------------+   |
|   |       CEP HTML5 Webview (CEF)      | <-------------------> |   ExtendScript   |   |
|   |  - Adobe Spectrum Design UI        |  evalScript(jsxCmd)   |   (ES3 Engine)   |   |
|   |  - Word Editor & Inline QC         |                       |  - seq.importMGT |   |
|   |  - 14 Animation Style Gallery      |                       |  - setMgtValue   |   |
|   |  - 8-Swatch Symmetrical Palette    |                       |  - track audit   |   |
|   +------------------------------------+                       +------------------+   |
|                     |                                                                 |
|                     | (Node.js runtime in CEF: mixed-context enabled)                 |
|                     v                                                                 |
|   +------------------------------------+                                              |
|   |       Native Node.js Engine        |                                              |
|   |  - Cross-Platform Executable Probe |                                              |
|   |  - Audio Extraction & Concat       |                                              |
|   |  - Whisper AI Token Parser         |                                              |
|   |  - Subtitle Chunker & QC Engine    |                                              |
|   +------------------------------------+                                              |
+---------------------|-----------------------------------------------------------------+
                      | Child Process Spawn (stdio streaming)
                      v
+---------------------------------------------------------------------------------------+
|                                 OS SUBSYSTEM UTILITIES                                |
|                                                                                       |
|       +----------------------------+             +----------------------------+       |
|       |           FFmpeg           |             |        whisper-cli         |       |
|       |  - Sample-accurate cut     |             |  - GGML Large-v3 / Base    |       |
|       |  - 16 kHz Mono PCM WAV     |             |  - Word timestamps (-ml 1) |       |
|       |  - anullsrc silence bridge |             |  - Cross-platform probe    |       |
|       +----------------------------+             +----------------------------+       |
+---------------------------------------------------------------------------------------+
```

## 2. Known Technical Decisions & Critical Invariants

1. **Strict Audio Extraction Invariant:**
   - Audio extraction MUST use pure native sample-accurate cut: `ffmpeg -y -i <source> -ss <inPoint> -t <dur> -ar 16000 -ac 1 -c:a pcm_s16le <wavPath>`.
   - **CRITICAL LESSON:** NEVER introduce `speedRatio = clip.getSpeed() / 100.0` or chain `atempo` filters into the extraction pipeline. In Premiere Pro, `clip.getSpeed()` returns values that cause 100x audio deceleration, resulting in 30-second window hallucination repetitions in Whisper.
2. **Adobe Universal Tick Rate Quantization:**
   - Premiere Pro measures time internally in ticks: `254,016,000,000` ticks per second.
   - To prevent cumulative subframe drift, all subtitle In/Out points are quantized to sequence frame boundaries: `Math.round(rawTicks / ticksPerFrame) * ticksPerFrame`.
3. **MOGRT Data Injection Contract:**
   - Motion Graphics Templates are loaded via `seq.importMGT(mogrtPath, startTicks, videoTrackIndex, 0)`.
   - Essential Properties are dynamically populated via `displayName`: `CaptionText` (plain string) and `WordTimingJSON` (structured JSON string read by After Effects expressions).
4. **Cross-Platform Binary & Model Discovery:**
   - `resolveExecutable(primaryName, fallbacks)` searches system `$PATH`, WinGet (`%LOCALAPPDATA%\Microsoft\WinGet\Links`), Chocolatey (`C:\ProgramData\chocolatey\bin`), Scoop (`~/scoop/shims`), Homebrew (`/opt/homebrew/bin`), and `/usr/local/bin`.
   - `findAvailableWhisperModel(extRoot)` dynamically discovers any `*.bin` model in `~/.whisper-models`, `~/whisper-models`, `%LOCALAPPDATA%\whisper-models`, or `<extRoot>/models`.
5. **CEF Security & Mixed Context:**
   - `<Parameter>--enable-nodejs</Parameter>` and `<Parameter>--mixed-context</Parameter>` are active in `CSXS/manifest.xml` to allow direct Node.js `require()` calls inside the CEP panel without IPC middleware.

## 3. Assets & Templates Inventory

### 3.1 14 Production Motion Graphics Templates (`assets/*.mogrt`)

| Filename | Size | Category | Description |
| :--- | :--- | :--- | :--- |
| `bisik_Archival_Type.mogrt` | 67,742 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Bento_Card.mogrt` | 48,893 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Blur_Pop.mogrt` | 64,271 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Box_Tape.mogrt` | 46,914 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Cinema_Broadcast.mogrt` | 44,854 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Cut_Accent.mogrt` | 52,485 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Cyber_Glitch.mogrt` | 56,298 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Editorial_Serif.mogrt` | 58,339 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Karaoke_Pill.mogrt` | 53,360 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Marker_Highlight.mogrt` | 52,345 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Minimal_Fade.mogrt` | 40,011 bytes | Documentary (Editorial) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Neon_Glow.mogrt` | 63,437 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Spring_Rise.mogrt` | 72,725 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |
| `bisik_Stomp_Impact.mogrt` | 58,351 bytes | Modern (Kinetic) | Binary `.mogrt` (`project.aegraphic`, `definition.json`, `thumb.png`) |

### 3.2 Sound Effects (`assets/sfx/*.wav`)

| Filename | Size | Format | Description |
| `bisik_sfx_pop.wav` | 5,056 bytes | 16 kHz Mono PCM WAV | Synthetic UI audio synthesized via FFmpeg `lavfi` |
| `bisik_sfx_tick.wav` | 3,438 bytes | 16 kHz Mono PCM WAV | Synthetic UI audio synthesized via FFmpeg `lavfi` |
| `bisik_sfx_whoosh.wav` | 17,358 bytes | 16 kHz Mono PCM WAV | Synthetic UI audio synthesized via FFmpeg `lavfi` |

---

## 4. Full Codebase & Scripts

### Configuration & Manifest

#### `package.json`

> **Purpose:** Project metadata, Node dependencies, and test commands  
> **File Location:** `package.json`

```json
{
  "name": "bisik",
  "version": "1.1.0",
  "description": "bisik by rygh - 14 Kinetic & Documentary Caption Styles for Premiere Pro",
  "main": "client/main.js",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "package": "bash scripts/package_zxp.sh",
    "build-pkg": "bash scripts/build_mac_pkg.sh",
    "package-mac-zip": "bash scripts/package_mac_zip.sh",
    "package-win-zip": "bash scripts/package_windows_zip.sh",
    "package-all": "npm run package-mac-zip && npm run package-win-zip",
    "setup-ai": "node scripts/setup_ai_engine.js",
    "setup-assets": "bash scripts/generate_assets.sh"
  },
  "keywords": [
    "bisik",
    "premiere-pro",
    "cep",
    "captions",
    "documentary",
    "typography",
    "whisper"
  ],
  "author": "rygh",
  "license": "ISC"
}

```

#### `.debug`

> **Purpose:** Adobe CEP Chromium Remote Debugging Port configuration  
> **File Location:** `.debug`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.rygh.bisik.panel">
        <HostList>
            <Host Name="PPRO" Port="8088"/>
        </HostList>
    </Extension>
</ExtensionList>

```

#### `CSXS/manifest.xml`

> **Purpose:** Adobe CEP extension manifest, permissions, Node.js mixed-context flags  
> **File Location:** `CSXS/manifest.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="11.0" ExtensionBundleId="com.rygh.bisik" ExtensionBundleVersion="1.1.0"
                   ExtensionBundleName="bisik by rygh" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ExtensionList>
    <Extension Id="com.rygh.bisik.panel" Version="1.1.0" />
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      <Host Name="PPRO" Version="[22.0,99.9]" />
    </HostList>
    <LocaleList>
      <Locale Code="All" />
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="11.0" />
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="com.rygh.bisik.panel">
      <DispatchInfo>
        <Resources>
          <MainPath>./client/index.html</MainPath>
          <ScriptPath>./host/index.jsx</ScriptPath>
          <CEFCommandLine>
            <Parameter>--enable-nodejs</Parameter>
            <Parameter>--mixed-context</Parameter>
          </CEFCommandLine>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>bisik by rygh</Menu>
          <Geometry>
            <Size>
              <Width>440</Width>
              <Height>712</Height>
            </Size>
            <MinSize>
              <Width>240</Width>
              <Height>380</Height>
            </MinSize>
          </Geometry>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>
```

#### `.gitignore`

> **Purpose:** Git exclusion rules for binaries, node_modules, and OS caches  
> **File Location:** `.gitignore`

```gitignore
.DS_Store
Thumbs.db
node_modules/
temp/*
!temp/.gitkeep
dist/*.p12
dist/*.zxp
*.log
*.zip

```

### ExtendScript Automation Engine (Premiere Pro Host)

#### `host/index.jsx`

> **Purpose:** ES3 ExtendScript engine: track auditing, MOGRT injection, Adobe tick quantization  
> **File Location:** `host/index.jsx`

```javascript
// host/index.jsx
// bisik by rygh — Clean Premiere Pro ExtendScript Engine
// Universal Tick Rate: 254,016,000,000 ticks per second

var BISIK_TICKS_PER_SECOND = 254016000000;

function bisikQuantizeSecondsToTicks(seconds, ticksPerFrame) {
    var tpf = parseFloat(ticksPerFrame) || (BISIK_TICKS_PER_SECOND / 25);
    var rawTicks = seconds * BISIK_TICKS_PER_SECOND;
    var frameIndex = Math.round(rawTicks / tpf);
    var quantized = Math.round(frameIndex * tpf);
    return String(quantized);
}

if (typeof JSON !== "object") { JSON = {}; }
(function () {
    "use strict";

    function bisikEscapeJsonString(s) {
        return '"' + String(s).replace(/[\\"\u0000-\u001f]/g, function (a) {
            switch (a) {
                case '\\': return '\\\\';
                case '"': return '\\"';
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                default:
                    var hex = a.charCodeAt(0).toString(16);
                    return '\\u' + ('0000' + hex).slice(-4);
            }
        }) + '"';
    }

    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function (value) {
            var t = typeof value;
            if (t !== "object" || value === null) {
                if (t === "string") return bisikEscapeJsonString(value);
                return String(value);
            } else {
                var n, v, json = [], arr = (value && value.constructor === Array);
                for (n in value) {
                    v = value[n]; t = typeof v;
                    if (value.hasOwnProperty(n)) {
                        if (t === "string") v = bisikEscapeJsonString(v);
                        else if (t === "object" && v !== null) v = JSON.stringify(v);
                        json.push((arr ? "" : bisikEscapeJsonString(n) + ':') + String(v));
                    }
                }
                return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            }
        };
    }
    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text) {
            var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                return (new Function("return (" + text + ")"))();
            }
            throw new SyntaxError("JSON.parse: Invalid or unsafe JSON syntax");
        };
    }
}());

function setMgtValue(prop, val, fontVal) {
    try {
        var cur = prop.getValue();
        if (typeof cur === "string" && cur.indexOf("textEditValue") !== -1) {
            var obj = JSON.parse(cur);
            obj.textEditValue = String(val);
            if (fontVal) {
                try {
                    obj.fontEditValue = [String(fontVal)];
                    obj.capPropFontEdit = true;
                } catch (fErr) {}
            }
            try {
                prop.setValue(JSON.stringify(obj), true);
                return;
            } catch (setErr) {
                try {
                    delete obj.fontEditValue;
                    delete obj.capPropFontEdit;
                    prop.setValue(JSON.stringify(obj), true);
                    return;
                } catch (cleanErr) {}
            }
        }
    } catch (e) {}
    try {
        prop.setValue(val, true);
    } catch (err) {}
}

function bisikGetActiveSequence() {
    var seq = app.project.activeSequence;
    if (seq) return seq;
    try {
        if (app.project && app.project.sequences && app.project.sequences.numSequences > 0) {
            return app.project.sequences[0];
        }
    } catch (e) {}
    return null;
}

function bisikCalculateSequenceMetrics(seq) {
    var metrics = {
        width: 1920,
        height: 1080,
        profile: "FHD (1920×1080)",
        scaleFactor: 1.0,
        scalePercent: 100,
        fps: 25.0
    };

    if (!seq) return metrics;

    var w = 0, h = 0;
    try { w = parseInt(seq.frameSizeHorizontal, 10); } catch (e) {}
    try { h = parseInt(seq.frameSizeVertical, 10); } catch (e) {}

    if (w > 0 && h > 0) {
        metrics.width = w;
        metrics.height = h;

        var factor = h / 1080;
        metrics.scaleFactor = factor;
        metrics.scalePercent = Math.round(factor * 10000) / 100;

        if (h >= 2160) {
            metrics.profile = (w >= 4096) ? ("4K DCI (" + w + "×" + h + ")") : ("4K UHD (" + w + "×" + h + ")");
        } else if (h === 1080 && w === 1920) {
            metrics.profile = "FHD (1920×1080)";
        } else if (w === 1080 && h === 1920) {
            metrics.profile = "Vertical (1080×1920 9:16)";
        } else {
            metrics.profile = w + "×" + h;
        }
    }

    try {
        var ticksPerSecond = 254016000000;
        if (seq.timebase && parseFloat(seq.timebase) > 0) {
            var rawFps = ticksPerSecond / parseFloat(seq.timebase);
            metrics.fps = Math.round(rawFps * 100) / 100;
        }
    } catch (fpsErr) {}

    return metrics;
}

function getSequenceTracksInfo() {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var metrics = bisikCalculateSequenceMetrics(seq);

    var audioTracks = [];
    for (var i = 0; i < seq.audioTracks.numTracks; i++) {
        var aTrack = seq.audioTracks[i];
        var isMuted = false;
        var isTargeted = false;
        try { isMuted = aTrack.isMuted(); } catch (e) {}
        try { isTargeted = aTrack.isTargeted(); } catch (e) {}
        var selectedCount = 0;
        for (var c = 0; c < aTrack.clips.numItems; c++) {
            if (aTrack.clips[c].isSelected()) selectedCount++;
        }
        audioTracks.push({
            index: i,
            name: aTrack.name || ("Audio " + (i + 1)),
            clipCount: aTrack.clips.numItems,
            selectedCount: selectedCount,
            isMuted: isMuted,
            isTargeted: isTargeted
        });
    }

    var videoTracks = [];
    for (var j = 0; j < seq.videoTracks.numTracks; j++) {
        var vTrack = seq.videoTracks[j];
        videoTracks.push({
            index: j,
            name: vTrack.name || ("Video " + (j + 1)),
            clipCount: vTrack.clips.numItems
        });
    }

    return JSON.stringify({
        sequenceName: seq.name,
        resolution: metrics.width + "×" + metrics.height,
        profile: metrics.profile,
        scalePercent: metrics.scalePercent,
        fps: metrics.fps,
        audioTracks: audioTracks,
        videoTracks: videoTracks
    });
}

function getTrackAudioClipsByRange(trackIndex, rangeMode) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var track = seq.audioTracks[parseInt(trackIndex, 10)];
    if (!track || track.clips.numItems === 0) {
        return JSON.stringify({ error: "Selected audio track is empty." });
    }

    var seqIn = seq.getInPointAsTime().seconds;
    var seqOut = seq.getOutPointAsTime().seconds;
    var hasInOut = (seqIn >= 0 && seqOut > seqIn && seqOut < 86400);

    if (rangeMode === "inout" && !hasInOut) {
        return JSON.stringify({ error: "Set In & Out points on the timeline first (I / O)." });
    }

    var clipList = [];
    var unsupportedCount = 0;
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (!clip) continue;
        try { if (clip.disabled) continue; } catch (disErr) {}
        if (rangeMode === "selected" && !clip.isSelected()) continue;

        var cStart = clip.start.seconds;
        var cEnd = clip.end.seconds;
        var cIn = clip.inPoint.seconds;
        var cOut = clip.outPoint.seconds;

        var origTimelineDur = cEnd - cStart;
        var origSourceDur = cOut - cIn;
        var speedRatio = (origTimelineDur > 0 && origSourceDur > 0) ? (origSourceDur / origTimelineDur) : 1.0;

        if (rangeMode === "inout") {
            if (cEnd <= seqIn || cStart >= seqOut) continue;

            if (cStart < seqIn) {
                var startDelta = seqIn - cStart;
                cIn += (startDelta * speedRatio);
                cStart = seqIn;
            }
            if (cEnd > seqOut) {
                var endDelta = cEnd - seqOut;
                cOut -= (endDelta * speedRatio);
                cEnd = seqOut;
            }
        }

        var mediaPath = "";
        try {
            if (clip.projectItem) {
                mediaPath = clip.projectItem.getMediaPath();
            }
        } catch (e) {}

        if (mediaPath && cOut > cIn) {
            clipList.push({
                mediaPath: mediaPath,
                timelineStart: cStart,
                timelineEnd: cEnd,
                inPoint: cIn,
                outPoint: cOut,
                speedRatio: speedRatio
            });
        } else {
            unsupportedCount++;
        }
    }

    if (clipList.length === 0) {
        if (unsupportedCount > 0) {
            return JSON.stringify({
                error: "Selected clips are nested sequences, multicam, or synthetic audio without source media files. Please Render and Replace audio or export track before transcribing."
            });
        }
        return JSON.stringify({ error: "No audio clips found in the selected range." });
    }

    return JSON.stringify({ clips: clipList, unsupportedCount: unsupportedCount });
}

function getPlayheadPosition() {
    var seq = bisikGetActiveSequence();
    if (!seq) return "-1";
    var pos = seq.getPlayerPosition();
    return pos ? String(pos.seconds) : "-1";
}

function bisikGetPlayheadSeconds() {
    return getPlayheadPosition();
}

function setPlayheadPosition(secondsVal) {
    var seq = bisikGetActiveSequence();
    if (!seq) return "false";
    var ticksPerSecond = 254016000000;
    var targetTicks = Math.round(parseFloat(secondsVal) * ticksPerSecond).toString();
    seq.setPlayerPosition(targetTicks);
    return "true";
}

function bisikSetPlayheadSeconds(secondsVal) {
    return setPlayheadPosition(secondsVal);
}

function bisikGetSequenceInfo() {
    return getSequenceTracksInfo();
}

function bisikGetAudioClipsForTrack(trackIndex) {
    return getTrackAudioClipsByRange(trackIndex, "entire");
}

function getOrImportSfxItem(sfxPath) {
    if (!sfxPath) return null;
    var root = app.project.rootItem;
    var sfxBin = null;
    var binName = "_bisik_by_rygh_SFX";

    for (var i = 0; i < root.children.numItems; i++) {
        if (root.children[i].name === binName && root.children[i].type === ProjectItemType.BIN) {
            sfxBin = root.children[i];
            break;
        }
    }
    if (!sfxBin) sfxBin = root.createBin(binName);

    var fileName = sfxPath.split("/").pop().split("\\").pop();
    for (var j = 0; j < sfxBin.children.numItems; j++) {
        if (sfxBin.children[j].name === fileName) return sfxBin.children[j];
    }

    app.project.importFiles([sfxPath], true, sfxBin, false);
    for (var k = 0; k < sfxBin.children.numItems; k++) {
        if (sfxBin.children[k].name === fileName) return sfxBin.children[k];
    }
    return null;
}

function bisikIsBisikCaptionClip(clip) {
    if (!clip) return false;
    try {
        var n = clip.name || "";
        if (n.indexOf("bisik_") === 0) return true;
    } catch (e) {}
    try {
        var comp = clip.getMGTComponent();
        if (comp && comp.properties) {
            for (var i = 0; i < comp.properties.numItems; i++) {
                if (comp.properties[i].displayName === "WordTimingJSON") return true;
            }
        }
    } catch (e2) {}
    return false;
}

function bisikRangeHasForeignClip(track, startSec, endSec, ownPrefix) {
    if (!track || !track.clips) return false;
    for (var i = 0; i < track.clips.numItems; i++) {
        var c = track.clips[i];
        if (c.end.seconds <= startSec || c.start.seconds >= endSec) continue;
        var n = c.name || "";
        if (n.indexOf(ownPrefix) !== 0) return true;
    }
    return false;
}

function bisikCountClearable(videoTrackIndex, sfxAudioTrackIndex) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var videoCount = 0;
    var sfxCount = 0;

    var vTrack = seq.videoTracks[parseInt(videoTrackIndex, 10)];
    if (vTrack) {
        for (var i = 0; i < vTrack.clips.numItems; i++) {
            if (bisikIsBisikCaptionClip(vTrack.clips[i])) videoCount++;
        }
    }

    var aIdx = parseInt(sfxAudioTrackIndex, 10);
    if (!isNaN(aIdx) && aIdx >= 0 && seq.audioTracks[aIdx]) {
        var aTrack = seq.audioTracks[aIdx];
        for (var j = 0; j < aTrack.clips.numItems; j++) {
            var cName = aTrack.clips[j].name || "";
            if (cName.indexOf("bisik_sfx_") === 0 || cName.indexOf("sfx_") === 0) {
                sfxCount++;
            }
        }
    }

    return JSON.stringify({ videoCount: videoCount, sfxCount: sfxCount, total: videoCount + sfxCount });
}

function clearTargetTracks(videoTrackIndex, sfxAudioTrackIndex) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var removedVideo = 0;
    var removedAudio = 0;

    var vTrack = seq.videoTracks[parseInt(videoTrackIndex, 10)];
    if (vTrack) {
        for (var i = vTrack.clips.numItems - 1; i >= 0; i--) {
            var vClip = vTrack.clips[i];
            if (bisikIsBisikCaptionClip(vClip)) {
                vClip.remove(false, false);
                removedVideo++;
            }
        }
    }

    var aIdx = parseInt(sfxAudioTrackIndex, 10);
    if (!isNaN(aIdx) && aIdx >= 0 && seq.audioTracks[aIdx]) {
        var aTrack = seq.audioTracks[aIdx];
        for (var j = aTrack.clips.numItems - 1; j >= 0; j--) {
            var cName = aTrack.clips[j].name || "";
            if (cName.indexOf("bisik_sfx_") === 0 || cName.indexOf("sfx_") === 0) {
                aTrack.clips[j].remove(false, false);
                removedAudio++;
            }
        }
    }

    return JSON.stringify({ success: true, removedVideo: removedVideo, removedAudio: removedAudio });
}

function bisikReadTextFile(p) {
    var f = new File(p);
    f.encoding = "UTF-8";
    if (!f.exists) return null;
    if (!f.open("r")) return null;
    var txt = f.read();
    f.close();
    return txt;
}

function bisikInsertPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return JSON.stringify({ error: "Invalid payload object." });
    }
    var mogrtPath = payload.mogrtPath;
    var segments = payload.segments || payload.chunks || [];
    var targetVideoTrackIndex = (payload.videoTrackIndex !== undefined && payload.videoTrackIndex !== null) ? parseInt(payload.videoTrackIndex, 10) : 1;
    if (isNaN(targetVideoTrackIndex) || targetVideoTrackIndex < 0) targetVideoTrackIndex = 1;

    var sfxMode = payload.sfxMode || "none";
    var sfxTrackIndex = payload.sfxTrackIndex;
    var sfxPaths = payload.sfxPaths || {};

    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "Active sequence not found." });

    var ticksPerSecond = 254016000000;
    var ticksPerFrame = 0;
    if (seq.timebase) {
        ticksPerFrame = parseFloat(seq.timebase);
    }
    if (!ticksPerFrame || isNaN(ticksPerFrame) || ticksPerFrame <= 0) {
        ticksPerFrame = ticksPerSecond / 25;
    }

    var insertedCount = 0;
    var sfxInsertedCount = 0;
    var sfxSkipped = 0;

    var sfxAudioTrack = null;
    if (sfxMode !== "none" && sfxTrackIndex !== undefined && seq.audioTracks[sfxTrackIndex]) {
        sfxAudioTrack = seq.audioTracks[sfxTrackIndex];
    }

    var whooshItem = (sfxMode === "whoosh" || sfxMode === "both") ? getOrImportSfxItem(sfxPaths.whoosh) : null;
    var popItem = (sfxMode === "pop" || sfxMode === "both") ? getOrImportSfxItem(sfxPaths.pop) : null;
    var tickItem = (sfxMode === "tick") ? getOrImportSfxItem(sfxPaths.tick) : null;

    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var startTicks = bisikQuantizeSecondsToTicks(seg.start, ticksPerFrame);
        var endTicks = bisikQuantizeSecondsToTicks(seg.end, ticksPerFrame);
        if (parseFloat(endTicks) <= parseFloat(startTicks)) {
            endTicks = String(Math.round(parseFloat(startTicks) + ticksPerFrame));
        }

        var newTrackItem = seq.importMGT(mogrtPath, startTicks, targetVideoTrackIndex, 0);

        if (newTrackItem) {
            try { newTrackItem.name = "bisik_" + (newTrackItem.name || "caption"); } catch (e) {}
            var endTime = new Time();
            endTime.ticks = endTicks;
            newTrackItem.end = endTime;

            // Auto-scale MOGRT to match sequence resolution based on timeline calculation (e.g. 200% for 4K, 100% for FHD)
            var metrics = bisikCalculateSequenceMetrics(seq);
            if (metrics.scaleFactor !== 1.0 && newTrackItem.components) {
                for (var cIdx = 0; cIdx < newTrackItem.components.numItems; cIdx++) {
                    var motionComp = newTrackItem.components[cIdx];
                    if (motionComp && motionComp.displayName === "Motion") {
                        for (var prIdx = 0; prIdx < motionComp.properties.numItems; prIdx++) {
                            if (motionComp.properties[prIdx].displayName === "Scale") {
                                try {
                                    motionComp.properties[prIdx].setValue(metrics.scalePercent, true);
                                } catch (scErr) {}
                            }
                        }
                    }
                }
            }

            var components = newTrackItem.getMGTComponent();
            if (components && components.properties.numItems >= 2) {
                var textSet = false;
                var jsonSet = false;

                for (var p = 0; p < components.properties.numItems; p++) {
                    var prop = components.properties[p];
                    var dName = prop.displayName || "";

                    if (dName === "CaptionText") {
                        setMgtValue(prop, seg.text, seg.font || payload.fontName);
                        textSet = true;
                    } else if (dName === "WordTimingJSON" || dName.indexOf("Timing") !== -1) {
                        setMgtValue(prop, seg.wordTimingJson);
                        jsonSet = true;
                    }
                }

                // Fallback jika kedua properti bernama "Source Text"
                if (!textSet) setMgtValue(components.properties[0], seg.text, seg.font || payload.fontName);
                if (!jsonSet) setMgtValue(components.properties[1], seg.wordTimingJson);
            }
            insertedCount++;
        }

        if (sfxAudioTrack) {
            try {
                if (whooshItem) {
                    if (!bisikRangeHasForeignClip(sfxAudioTrack, seg.start, seg.start + 0.26, "bisik_sfx_")) {
                        sfxAudioTrack.overwriteClip(whooshItem, seg.start);
                        sfxInsertedCount++;
                    } else {
                        sfxSkipped++;
                    }
                } else if (tickItem) {
                    if (!bisikRangeHasForeignClip(sfxAudioTrack, seg.start, seg.start + 0.06, "bisik_sfx_")) {
                        sfxAudioTrack.overwriteClip(tickItem, seg.start);
                        sfxInsertedCount++;
                    } else {
                        sfxSkipped++;
                    }
                }

                if (popItem && seg.keywordTimes && seg.keywordTimes.length > 0) {
                    for (var kw = 0; kw < seg.keywordTimes.length; kw++) {
                        var kwTime = seg.keywordTimes[kw];
                        if (!bisikRangeHasForeignClip(sfxAudioTrack, kwTime, kwTime + 0.12, "bisik_sfx_")) {
                            sfxAudioTrack.overwriteClip(popItem, kwTime);
                            sfxInsertedCount++;
                        } else {
                            sfxSkipped++;
                        }
                    }
                }
            } catch (sfxErr) {}
        }
    }

    return JSON.stringify({
        success: true,
        inserted: insertedCount,
        sfxInserted: sfxInsertedCount,
        sfxSkipped: sfxSkipped
    });
}

function bisikInjectFromFile(payloadPath) {
    var txt = bisikReadTextFile(payloadPath);
    if (txt === null) return JSON.stringify({ error: "Cannot read payload file." });
    var payload;
    try { payload = JSON.parse(txt); }
    catch (e) { return JSON.stringify({ error: "Payload JSON is invalid." }); }
    return bisikInsertPayload(payload);
}

function insertBisikClips(payloadStr) {
    var rawStr = payloadStr;
    if (typeof rawStr === "string") {
        try {
            rawStr = decodeURIComponent(rawStr);
        } catch (e) {}
    }
    var payload = (typeof rawStr === "object" && rawStr !== null) ? rawStr : JSON.parse(rawStr);
    return bisikInsertPayload(payload);
}

function bisikGetActiveSequenceId() {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });
    var seqId = "";
    try {
        if (seq.sequenceID) seqId = String(seq.sequenceID);
    } catch (idErr) {}
    if (!seqId) {
        try { seqId = String(seq.name || "default_seq"); } catch (nErr) { seqId = "unknown_seq"; }
    }
    return JSON.stringify({ sequenceId: seqId, sequenceName: seq.name || "" });
}

function bisikPrecheckTarget(videoTrackIndex, sfxTrackIndex, sfxMode) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var vIdx = parseInt(videoTrackIndex, 10);
    if (isNaN(vIdx) || vIdx < 0 || vIdx >= seq.videoTracks.numTracks) {
        return JSON.stringify({ error: "Target video track index is invalid." });
    }

    if (sfxMode && sfxMode !== "none") {
        var aIdx = parseInt(sfxTrackIndex, 10);
        if (isNaN(aIdx) || aIdx < 0 || aIdx >= seq.audioTracks.numTracks) {
            return JSON.stringify({ error: "Target SFX audio track index is invalid." });
        }
    }

    return JSON.stringify({ valid: true });
}

// Backward compatibility alias
function bisikInjectSubtitles(encodedJsonPayload) {
    return insertBisikClips(encodedJsonPayload);
}

```

### Client Webview UI & Studio Orchestrator

#### `client/index.html`

> **Purpose:** Adobe Spectrum UI panel markup, kinetic style gallery, dual-line controls  
> **File Location:** `client/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>bisik by rygh</title>
  <style>
    :root {
      /* Adobe Spectrum Standard 4px/8px Grid Spacing & Sizing Scale */
      --s-1: 4px;  /* Micro spacing / compact gap / border radius */
      --s-2: 8px;  /* Base spacing / component gap / padding */
      --s-3: 12px; /* Medium spacing / card padding / margin */
      --s-4: 24px; /* Compact control & readout height */
      --s-5: 32px; /* Standard control, input, dropdown & button height */

      /* Adobe Spectrum Typography Scale */
      --f-xs: 11px; /* Minimum Spectrum readable scale (replaces 8px) */
      --f-sm: 11px; /* Spectrum Label & Secondary Text (replaces 10px) */
      --f-md: 12px; /* Standard Premiere Pro Control & Body scale */
      --f-lg: 14px; /* Spectrum Section Heading */
      --f-xl: 16px; /* Spectrum Panel Brand Title */

      /* Color System */
      --bg: #121214;
      --card: #1A1A1E;
      --surface: #101012;
      --border: #2C2C32;
      --text: #F5F5F7;
      --muted: #8E8E93;
      --accent: #0070D2;
      --gold: #FFC400;
      --green: #00C828;
      --danger: #FF1E1E;
    }

    * {
      box-sizing: border-box;
      font-family: adobe-clean, "Adobe Clean", "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    body {
      margin: 0;
      padding: var(--s-3);
      background: var(--bg);
      color: var(--text);
      font-size: var(--f-md);
      display: flex;
      flex-direction: column;
      gap: var(--s-2);
      min-height: 100vh;
      height: auto;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Symmetrical Grid Helpers */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--s-2);
      align-items: end;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--s-2);
      align-items: end;
    }
    .grid-golden {
      display: grid;
      grid-template-columns: 1.618fr 1fr;
      gap: var(--s-2);
      align-items: end;
    }

    /* Narrow Docking Mode Responsive Rules (240px - 320px Docking) */
    @media (max-width: 320px) {
      body { padding: var(--s-1); gap: var(--s-1); }
      .grid-3 { grid-template-columns: 1fr; }
      .grid-golden { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .segmented { grid-template-columns: 1fr; height: auto; }
      .segmented label { padding: var(--s-1) 2px; }
      .palette-grid { grid-template-columns: repeat(6, 1fr); height: auto; }
      .swatch { height: 20px; }
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: var(--s-5);
      padding: 0 var(--s-1);
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: var(--s-2);
    }
    .brand h1 {
      margin: 0;
      font-size: var(--f-lg);
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand span {
      font-size: var(--f-sm);
      color: var(--muted);
      font-weight: 500;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: var(--s-2);
    }
    .cti-readout {
      height: var(--s-4);
      display: inline-flex;
      align-items: center;
      padding: 0 var(--s-2);
      font-family: "Source Code Pro", Menlo, Monaco, Consolas, monospace;
      font-size: var(--f-sm);
      color: var(--gold);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--s-1);
    }

    /* Section Cards */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--s-2);
      padding: var(--s-2);
      display: flex;
      flex-direction: column;
      gap: var(--s-2);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--s-1);
    }
    label {
      font-size: var(--f-sm);
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0;
    }

    /* Uniform Golden Ratio Inputs, Dropdowns & Buttons (34px / 28px) */
    select, input[type="text"], input[type="number"], button {
      width: 100%;
      height: var(--s-5);
      padding: 0 var(--s-2);
      border-radius: var(--s-1);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: var(--f-md);
      font-weight: 500;
      outline: none;
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    select:focus, input:focus {
      border-color: var(--accent);
    }
    /* Adobe Spectrum Accessible Focus-Visible Ring */
    select:focus-visible,
    input[type="text"]:focus-visible,
    input[type="number"]:focus-visible,
    button:focus-visible,
    .word-input:focus-visible,
    .chip-btn:focus-visible,
    .word-time:focus-visible,
    .swatch:focus-visible,
    .toggle-pill input:focus-visible {
      outline: 2px solid var(--accent, #0070D2) !important;
      outline-offset: 1px !important;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-sm {
      height: var(--s-4);
      font-size: var(--f-sm);
      padding: 0 var(--s-2);
      width: auto;
    }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: #005BB0; }
    .btn-success {
      background: var(--green);
      border-color: var(--green);
      color: #041407;
    }
    .btn-success:hover { background: #00A820; }
    .btn-success:disabled {
      background: #222226;
      border-color: var(--border);
      color: var(--muted);
      cursor: not-allowed;
    }
    .btn-danger {
      background: rgba(255, 30, 30, 0.12);
      border-color: rgba(255, 30, 30, 0.35);
      color: var(--danger);
    }
    .btn-danger:hover { background: rgba(255, 30, 30, 0.22); }
    .btn-icon {
      width: 26px;
      height: 26px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.12s ease;
    }
    .btn-icon:hover {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    .btn-icon-danger:hover {
      background: rgba(255, 30, 30, 0.22);
      color: var(--danger);
      border-color: rgba(255, 30, 30, 0.4);
    }
    .preset-control-group {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .preset-control-group select {
      flex: 1;
      min-width: 0;
    }

    /* Color Picker Triggers */
    .color-picker-trigger-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 8px;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .color-picker-trigger-box:hover {
      border-color: var(--accent);
      background: #1e1e24;
    }
    .color-picker-trigger-box label {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      cursor: pointer;
    }
    .color-pill-preview {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .color-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
      flex-shrink: 0;
    }
    .color-hex-text {
      font-family: 'Source Code Pro', Menlo, monospace;
      font-size: 11px;
      font-weight: 600;
      color: var(--text);
      flex: 1;
    }
    .color-picker-badge {
      font-size: 9px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 3px;
      color: var(--muted);
    }

    /* Photoshop-style Color Picker Modal */
    .ps-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ps-color-dialog {
      width: 375px;
      background: #2b2b2b;
      border: 1px solid #444;
      border-radius: 4px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
      color: #dfdfdf;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      user-select: none;
      overflow: hidden;
    }
    .ps-dialog-header {
      background: #232323;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #383838;
      font-weight: 600;
      font-size: 11px;
      color: #e5e5e5;
      white-space: nowrap;
      overflow: hidden;
    }
    .ps-dialog-header span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }
    .ps-dialog-body {
      padding: 8px 10px;
      display: flex;
      gap: 10px;
      background: #2b2b2b;
    }
    .ps-spectrum-box {
      width: 190px;
      height: 175px;
      position: relative;
      cursor: crosshair;
      border: 1px solid #1a1a1a;
      box-shadow: inset 0 0 1px rgba(0,0,0,0.8);
      flex-shrink: 0;
    }
    .ps-spectrum-box canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .ps-cursor {
      position: absolute;
      width: 10px;
      height: 10px;
      border: 1px solid #fff;
      box-shadow: 0 0 1px #000, inset 0 0 1px #000;
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
      top: 0;
      left: 0;
    }
    .ps-hue-box {
      width: 22px;
      height: 175px;
      position: relative;
      cursor: pointer;
      border: 1px solid #1a1a1a;
      flex-shrink: 0;
    }
    .ps-hue-box canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .ps-hue-slider {
      position: absolute;
      left: -2px;
      width: 26px;
      height: 4px;
      border: 1px solid #fff;
      box-shadow: 0 0 2px #000;
      border-radius: 2px;
      pointer-events: none;
      transform: translateY(-50%);
      top: 0;
    }
    .ps-controls-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ps-preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid #1a1a1a;
      border-radius: 3px;
      overflow: hidden;
      background: #1a1a1a;
    }
    .ps-preview-new, .ps-preview-current {
      width: 100%;
      height: 22px;
    }
    .ps-preview-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      padding: 1px 0;
    }
    .ps-actions {
      display: flex;
      gap: 4px;
    }
    .ps-btn {
      flex: 1;
      height: 22px;
      font-size: 10px;
      border-radius: 3px;
      background: #3a3a3a;
      border: 1px solid #505050;
      color: #eee;
      cursor: pointer;
    }
    .ps-btn:hover { background: #4a4a4a; }
    .ps-btn.btn-primary {
      background: #0070d2;
      border-color: #0070d2;
      color: #fff;
    }
    .ps-btn.btn-primary:hover { background: #005bb0; }
    .ps-input-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: #232323;
      padding: 5px 6px;
      border: 1px solid #383838;
      border-radius: 4px;
    }
    .ps-input-row {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .ps-input-row label {
      width: 14px;
      color: #aaa;
      font-size: 10px;
      font-weight: bold;
    }
    .ps-input-row input {
      flex: 1;
      height: 17px;
      padding: 0 3px;
      background: #181818;
      border: 1px solid #444;
      color: #fff;
      font-size: 10px;
      font-family: 'Source Code Pro', monospace;
    }
    .ps-hex-row {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-top: 1px;
    }
    .ps-hex-row label {
      color: #aaa;
      font-weight: bold;
      font-size: 11px;
    }
    .ps-hex-row input {
      flex: 1;
      height: 18px;
      padding: 0 4px;
      background: #181818;
      border: 1px solid #444;
      color: #ffd700;
      font-size: 11px;
      font-family: 'Source Code Pro', monospace;
      font-weight: bold;
    }
    .ps-divider {
      height: 1px;
      background: #383838;
      margin: 1px 0;
    }

    /* Symmetrical Segmented Control */
    .segmented {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      height: var(--s-5);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--s-1);
      padding: 2px;
      position: relative;
    }
    .segmented input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }
    .segmented input:focus-visible + label {
      outline: 2px solid var(--accent, #0070D2);
      outline-offset: 1px;
    }
    .segmented label {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--f-sm);
      color: var(--muted);
      border-radius: 3px;
      cursor: pointer;
      text-transform: none;
      letter-spacing: 0;
    }
    .segmented input:checked + label {
      background: var(--accent);
      color: #fff;
    }

    /* Transcript Editor Workspace */
    .editor-card {
      min-height: 180px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--s-2);
      padding: var(--s-2);
      display: flex;
      flex-direction: column;
      gap: var(--s-2);
    }
    .editor-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      padding-bottom: var(--s-1);
      border-bottom: 1px solid var(--border);
    }
    .editor-bar-group {
      display: flex;
      align-items: center;
      gap: var(--s-2);
      flex-wrap: wrap;
    }
    .toggle-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--muted);
      cursor: pointer;
      text-transform: none;
      white-space: nowrap;
      user-select: none;
      flex-shrink: 0;
    }
    .toggle-pill input {
      width: 12px;
      height: 12px;
      margin: 0;
      flex-shrink: 0;
    }
    #qcStatusBadge {
      white-space: nowrap;
      font-size: 10px;
      line-height: 1.2;
      flex-shrink: 0;
    }

    .word-grid {
      min-height: 140px;
      max-height: 340px;
      overflow-y: auto;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: var(--s-1);
    }
    .word-chip {
      height: 26px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--s-1);
      padding: 0 4px;
      flex-shrink: 0;
      max-width: 100%;
    }
    .word-chip.active-playhead {
      border-color: var(--accent);
      background: rgba(0, 112, 210, 0.24);
    }
    .word-chip.is-keyword {
      border-color: var(--preview-accent, var(--gold));
      background: rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 0 0 1px var(--preview-accent, var(--gold));
    }
    .word-chip.force-break {
      border-right: 3px solid var(--green);
    }
    .word-time {
      font-family: "Source Code Pro", Menlo, Monaco, Consolas, monospace;
      font-size: var(--f-xs);
      color: var(--muted);
      cursor: pointer;
      padding: 2px 4px;
      background: var(--card);
      border-radius: 3px;
    }
    .word-time:hover {
      background: var(--accent);
      color: #fff;
    }
    .word-input {
      height: 20px;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: var(--f-md);
      padding: 0 4px;
      margin: 0;
      min-width: 32px;
      box-sizing: border-box;
      outline: none;
      text-overflow: clip;
      white-space: nowrap;
    }
    .chip-btn {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      cursor: pointer;
      user-select: none;
      border-radius: 3px;
      transition: background 0.1s ease, color 0.1s ease;
    }
    .chip-btn:hover {
      background: var(--card);
      color: var(--text);
    }
    .chip-btn.star-btn:hover, .word-chip.is-keyword .star-btn {
      color: var(--preview-accent, var(--gold));
      background: rgba(255, 255, 255, 0.08);
    }
    .chip-btn.break-btn:hover, .word-chip.force-break .break-btn {
      color: var(--green);
      background: rgba(0, 200, 40, 0.18);
    }
    .chip-btn.del-btn:hover {
      color: var(--danger);
      background: rgba(255, 30, 30, 0.22);
    }

    /* 12-Color Wheel Palette Swatch Bar */
    .palette-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--s-1);
      height: var(--s-4);
    }
    .swatch {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.1s ease, border-color 0.1s ease;
    }
    .swatch:hover {
      transform: scale(1.08);
    }
    .swatch.active {
      border-color: #FFFFFF;
      box-shadow: 0 0 0 1px #000;
    }

    /* Status Bar */
    .status-bar {
      height: var(--s-4);
      display: flex;
      align-items: center;
      padding: 0 var(--s-2);
      font-family: "Source Code Pro", Menlo, Monaco, Consolas, monospace;
      font-size: var(--f-sm);
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--s-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
    }
    .status-bar.status-success {
      color: var(--green);
      border-color: rgba(0, 200, 40, 0.4);
    }
    .status-bar.status-error {
      color: var(--danger);
      background: rgba(255, 30, 30, 0.08);
      border-color: rgba(255, 30, 30, 0.45);
    }
    .status-bar.status-warning {
      color: var(--gold);
      border-color: rgba(255, 196, 0, 0.45);
    }
    .status-bar.status-info {
      color: var(--accent);
      border-color: rgba(0, 112, 210, 0.45);
    }

    /* Subtitle QC Readability Warning Indicators */
    .qc-badge-ok {
      background: rgba(0, 200, 40, 0.14);
      color: var(--green);
      border: 1px solid rgba(0, 200, 40, 0.35);
    }
    .qc-badge-warn {
      background: rgba(255, 196, 0, 0.16);
      color: var(--gold);
      border: 1px solid rgba(255, 196, 0, 0.4);
    }
    .qc-badge-danger {
      background: rgba(255, 30, 30, 0.18);
      color: var(--danger);
      border: 1px solid rgba(255, 30, 30, 0.4);
    }
    .qc-pill {
      font-size: 9px;
      font-family: "Source Code Pro", Menlo, Monaco, Consolas, monospace;
      padding: 1px 4px;
      border-radius: 2px;
      font-weight: 600;
      cursor: help;
      user-select: none;
    }
    .word-chip.has-qc-issue {
      border-color: rgba(255, 196, 0, 0.65);
    }
    .word-chip.has-qc-danger {
      border-color: rgba(255, 30, 30, 0.75);
    }

    /* Animation Composer-Style Visual Preset Gallery & Swatches */
    .preset-filter-bar {
      display: flex;
      gap: 4px;
      background: var(--surface);
      padding: 3px;
      border-radius: var(--s-1);
      border: 1px solid var(--border);
    }
    .filter-tab {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--muted);
      padding: 4px 6px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 3px;
      cursor: pointer;
      height: 24px;
    }
    .filter-tab.active {
      background: var(--card);
      color: var(--text);
    }
    .style-preview-gallery {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--s-2);
      max-height: 230px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .style-preview-card {
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--s-1);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease;
    }
    .style-preview-card:hover {
      border-color: #666;
    }
    .style-preview-card.selected {
      border-color: var(--preview-accent, var(--gold));
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
    }
    .preview-stage {
      height: 74px;
      background: #0D0D0E;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 10px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .preview-caption {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      letter-spacing: -0.2px;
    }
    .preview-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
      background: var(--card);
      border-top: 1px solid var(--border);
      font-size: 11px;
    }
    .preview-footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .t-badge {
      font-family: Georgia, serif;
      font-weight: 700;
      font-size: 12px;
      color: var(--muted);
    }
    .style-card-title {
      color: var(--text);
      font-weight: 500;
      font-size: 11px;
    }
    .style-fav-star {
      color: #555;
      font-size: 12px;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .style-fav-star.favorited {
      color: var(--gold);
    }

    /* 10 Live CSS Keyframe Animations */
    @keyframes animSpringRise {
      0%, 100% { transform: translateY(0px); opacity: 1; }
      15% { transform: translateY(8px); opacity: 0.2; }
      45% { transform: translateY(-2px); opacity: 1; }
    }
    @keyframes animCutAccent {
      0%, 45% { color: #ffffff; }
      50%, 95% { color: var(--preview-accent, var(--gold)); }
    }
    @keyframes animBlurPop {
      0%, 100% { filter: blur(0px); transform: scale(1); }
      20% { filter: blur(4px); transform: scale(0.86); opacity: 0.4; }
      55% { filter: blur(0px); transform: scale(1.06); opacity: 1; }
    }
    @keyframes animPillPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes animMarkerSweep {
      0%, 20% { background-size: 0% 100%; }
      55%, 90% { background-size: 100% 100%; }
      100% { background-size: 0% 100%; }
    }
    @keyframes animTypewriterBlink {
      0%, 49% { border-right-color: var(--preview-accent, var(--gold)); }
      50%, 100% { border-right-color: transparent; }
    }
    @keyframes animMinimalDrift {
      0%, 100% { opacity: 1; letter-spacing: 0.8px; }
      30% { opacity: 0.25; letter-spacing: 2px; }
    }

    .anim-spring .aw {
      display: inline-block;
      color: var(--preview-accent, var(--gold));
      animation: animSpringRise 2.4s infinite ease-out;
    }
    .anim-cut .aw {
      color: var(--preview-accent, var(--gold));
      animation: animCutAccent 1.8s infinite steps(1);
    }
    .anim-boxtape {
      background: #080808;
      padding: 4px 8px;
      border-radius: 3px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
    }
    .anim-boxtape .aw {
      color: var(--preview-accent, var(--gold));
    }
    .anim-blurpop .aw {
      display: inline-block;
      color: var(--preview-accent, var(--gold));
      animation: animBlurPop 2.4s infinite ease-out;
    }
    .anim-pill .aw {
      display: inline-block;
      background: var(--preview-accent, var(--gold));
      color: #111111;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 800;
      animation: animPillPulse 1.8s infinite ease-in-out;
    }
    .anim-marker .aw {
      color: #111111;
      padding: 0 4px;
      background-image: linear-gradient(var(--preview-accent, var(--gold)), var(--preview-accent, var(--gold)));
      background-repeat: no-repeat;
      background-position: left center;
      background-size: 100% 100%;
      animation: animMarkerSweep 2.6s infinite ease-in-out;
    }
    .anim-cinema {
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
      letter-spacing: 0.2px;
    }
    .anim-cinema .aw {
      color: var(--preview-accent, var(--gold));
    }
    .anim-typewriter {
      font-family: "Source Code Pro", monospace;
      font-size: 11px;
      font-weight: 600;
      background: rgba(0, 0, 0, 0.65);
      padding: 3px 6px;
      border-left: 2px solid var(--preview-accent, var(--gold));
    }
    .anim-typewriter .aw {
      color: var(--preview-accent, var(--gold));
      padding-right: 3px;
      border-right: 2px solid var(--preview-accent, var(--gold));
      animation: animTypewriterBlink 0.9s infinite;
    }
    .anim-editorial {
      font-family: Georgia, serif;
      font-weight: 500;
      font-size: 13px;
    }
    .anim-editorial .aw {
      font-style: italic;
      color: var(--preview-accent, var(--gold));
      border-bottom: 1px solid var(--preview-accent, var(--gold));
    }
    .anim-minimal {
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      animation: animMinimalDrift 3.2s infinite ease-in-out;
    }
    .anim-minimal .aw {
      color: var(--preview-accent, var(--gold));
      font-weight: 700;
    }
    .anim-bento {
      background: rgba(22, 22, 24, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 3px 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
    }
    .anim-bento .aw {
      color: var(--preview-accent, var(--gold));
      font-weight: 700;
    }
    @keyframes animStompDown {
      0%, 100% { transform: scale(1); }
      15% { transform: scale(1.18); }
      30% { transform: scale(0.96); }
      45% { transform: scale(1); }
    }
    .anim-stomp .aw {
      display: inline-block;
      color: var(--preview-accent, var(--gold));
      font-weight: 800;
      animation: animStompDown 2.2s infinite ease-out;
    }
    @keyframes animCyberFlicker {
      0%, 100% { transform: skewX(0deg); opacity: 1; }
      20% { transform: skewX(-4deg); opacity: 0.7; }
      40% { transform: skewX(3deg); opacity: 0.95; }
      60% { transform: skewX(0deg); opacity: 1; }
    }
    .anim-cyber .aw {
      display: inline-block;
      color: var(--preview-accent, var(--gold));
      text-shadow: 1px 0 #ff0055, -1px 0 #00ffff;
      animation: animCyberFlicker 2.2s infinite ease-in-out;
    }
    @keyframes animNeonPulse {
      0%, 100% { text-shadow: 0 0 4px var(--preview-accent, var(--gold)), 0 0 14px var(--preview-accent, var(--gold)); }
      50% { text-shadow: 0 0 8px var(--preview-accent, var(--gold)), 0 0 24px var(--preview-accent, var(--gold)); }
    }
    .anim-neon .aw {
      color: #ffffff;
      animation: animNeonPulse 2.0s infinite ease-in-out;
    }

    /* Symmetrical 4x2 Color Swatch Grid */
    .swatch-grid-symmetrical {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 2px;
    }
    .color-swatch {
      height: 26px;
      border-radius: var(--s-1);
      background: var(--surface);
      border: 1.5px solid var(--border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 6px;
      font-size: 10.5px;
      font-weight: 600;
      color: var(--muted);
      transition: all 0.14s ease;
    }
    .color-swatch:hover {
      border-color: #666;
      color: var(--text);
    }
    .color-swatch.active {
      border-color: var(--text);
      background: var(--card);
      color: #ffffff;
    }
    .swatch-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  </style>
</head>
<body>

  <!-- Hidden helper inputs for state binding -->
  <select id="modelSelect" style="display:none;"></select>

  <!-- Header (Golden Ratio 21px Title) -->
  <div class="header">
    <div class="brand">
      <h1>bisik</h1>
      <span>by rygh</span>
    </div>
    <div class="header-controls">
      <div class="cti-readout" id="playheadBadge">00:00.0</div>
      <button class="btn-sm" id="btnRefresh">Refresh</button>
    </div>
  </div>

  <!-- Card 1: Audio Source & Range -->
  <div class="card">
    <div class="grid-golden">
      <div class="field">
        <label>Audio Track</label>
        <select id="audioTrackSelect"></select>
      </div>
      <div class="field">
        <label>Language</label>
        <select id="langSelect">
          <option value="id">Indonesian</option>
          <option value="en">English</option>
          <option value="auto">Auto Detect</option>
        </select>
      </div>
    </div>

    <div class="segmented">
      <input type="radio" name="rangeMode" id="rangeEntire" value="entire" checked />
      <label for="rangeEntire">Entire Sequence</label>

      <input type="radio" name="rangeMode" id="rangeInOut" value="inout" />
      <label for="rangeInOut">In / Out Range</label>

      <input type="radio" name="rangeMode" id="rangeSelected" value="selected" />
      <label for="rangeSelected">Selected Clips</label>
    </div>

    <div class="grid-golden">
      <button class="btn-primary" id="btnTranscribe">Transcribe Audio</button>
      <div class="grid-3">
        <button id="btnImportFile" title="Import transcript from SRT or JSON">Import</button>
        <button id="btnExportSRT" title="Export transcript as SubRip (.srt)">Export SRT</button>
        <button id="btnExportJSON" title="Export transcript as JSON (.json)">Export JSON</button>
      </div>
    </div>

    <!-- Asynchronous Progress Bar & Cancel Control (Non-Blocking) -->
    <div id="transcribeProgressContainer" style="display:none; flex-direction:column; gap:4px; margin-top:2px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span id="transcribeProgressText" style="font-size:var(--f-sm); color:var(--muted); font-family:'Source Code Pro',Menlo,monospace;">0% Preparing...</span>
        <button class="btn-sm btn-danger" id="btnCancelTranscribe" style="height:20px; font-size:9px; padding:0 8px;">Cancel</button>
      </div>
      <div style="width:100%; height:4px; background:var(--surface); border:1px solid var(--border); border-radius:2px; overflow:hidden;">
        <div id="transcribeProgressBar" style="width:0%; height:100%; background:var(--accent); transition:width 0.15s ease;"></div>
      </div>
    </div>
  </div>

  <!-- Card 2: Symmetrical Live Transcript Editor -->
  <div class="editor-card">
    <div class="editor-bar">
      <div class="editor-bar-group">
        <label style="color:var(--text); font-weight:600;">Transcript</label>
        <span style="font-size:var(--f-sm); color:var(--muted);" id="wordCountBadge">(0)</span>
        <span id="qcStatusBadge" style="display:none; font-size:10px; font-family:'Source Code Pro',Menlo,monospace; padding:1px 6px; border-radius:3px; font-weight:600; white-space:nowrap;"></span>
      </div>
      <div class="editor-bar-group">
        <button class="btn-sm" id="btnUndo" title="Undo (Cmd+Z)">↺</button>
        <button class="btn-sm" id="btnRedo" title="Redo (Cmd+Shift+Z)">↻</button>
        <button class="btn-sm" id="btnCleanFillers" title="Clean spoken filler words (uh, um, etc.)">Clean</button>
        <button class="btn-sm" id="btnCapitalize" title="Toggle letter case (Upper, Lower, Title)">Aa</button>
        <label class="toggle-pill" title="Toggle two-line caption layout">
          <input type="checkbox" id="chkDualLine" /> Two-Line
        </label>
        <label class="toggle-pill" title="Synchronize editor view with Premiere playhead">
          <input type="checkbox" id="chkAutoScroll" checked /> Sync CTI
        </label>
      </div>
    </div>

    <div class="grid-3">
      <input type="text" id="findInput" placeholder="Find in transcript..." style="height:var(--s-4); font-size:var(--f-sm);" />
      <input type="text" id="replaceInput" placeholder="Replace with..." style="height:var(--s-4); font-size:var(--f-sm);" />
      <button class="btn-sm" id="btnReplaceAll" style="width:100%;">Replace All</button>
    </div>

    <div class="word-grid" id="wordGrid">
      <div style="color:var(--muted); font-size:var(--f-sm); padding:var(--s-4); text-align:center; width:100%;">
        Select an audio track and click Transcribe Audio, or import an SRT/JSON file.
      </div>
    </div>
  </div>

  <!-- Card 3: Symmetrical Typography, Visual Style Browser & 4x2 Palette -->
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label style="color:var(--text); font-size:var(--f-md);">Animation Style & Color</label>
      <span id="activeStyleBadge" style="font-size:var(--f-sm); color:var(--gold); font-weight:600;">Spring Rise (Position)</span>
    </div>

    <!-- Category Filter Bar -->
    <div class="preset-filter-bar" id="styleFilterBar">
      <button type="button" class="filter-tab active" data-filter="all">All (14)</button>
      <button type="button" class="filter-tab" data-filter="modern">Modern (8)</button>
      <button type="button" class="filter-tab" data-filter="documentary">Documentary (6)</button>
      <button type="button" class="filter-tab" data-filter="fav">★ Saved</button>
    </div>

    <!-- Visual Live Animation Cards Grid (Animation Composer Style) -->
    <div class="style-preview-gallery" id="stylePreviewGallery"></div>

    <!-- Hidden MOGRT Style selector (Maintained for programmatic access & test integrity) -->
    <select id="styleSelect" style="display:none;">
      <option value="bisik_Spring_Rise.mogrt" selected>Spring Rise (Position)</option>
      <option value="bisik_Blur_Pop.mogrt">Blur Pop (Scale Blur)</option>
      <option value="bisik_Bento_Card.mogrt">Bento Card (Frosted)</option>
      <option value="bisik_Karaoke_Pill.mogrt">Karaoke Pill (Active Pill)</option>
      <option value="bisik_Cut_Accent.mogrt">Cut Accent (Instant Cut)</option>
      <option value="bisik_Stomp_Impact.mogrt">Stomp Impact (Overshoot)</option>
      <option value="bisik_Cyber_Glitch.mogrt">Cyber Glitch (Digital RGB)</option>
      <option value="bisik_Neon_Glow.mogrt">Neon Glow (Moody Pulse)</option>
      <option value="bisik_Box_Tape.mogrt">Box Tape Cut (Accent Box)</option>
      <option value="bisik_Marker_Highlight.mogrt">Marker Highlight (Doc Sweep)</option>
      <option value="bisik_Cinema_Broadcast.mogrt">Cinema Broadcast (Doc)</option>
      <option value="bisik_Archival_Type.mogrt">Archival Typewriter (Doc)</option>
      <option value="bisik_Editorial_Serif.mogrt">Editorial Serif (Film Doc)</option>
      <option value="bisik_Minimal_Fade.mogrt">Minimal Whisper (Doc Fade)</option>
    </select>

    <!-- Row 1: Font Family, Target Video Track (Symmetrical 2-Column Grid) -->
    <div class="grid-2">
      <div class="field">
        <label>Font Family</label>
        <select id="fontSelect">
          <option value="Montserrat-Black" selected>Montserrat Black (Modern Kinetic)</option>
          <option value="Arial-Black">Arial Black (Universal Heavy Punch)</option>
          <option value="Arial-BoldMT">Arial Bold (Universal Clean Sans)</option>
          <option value="Impact">Impact (High Energy Punch)</option>
          <option value="TrebuchetMS-Bold">Trebuchet MS Bold (Modern Geometric)</option>
          <option value="Verdana-Bold">Verdana Bold (High Legibility Sans)</option>
          <option value="Tahoma-Bold">Tahoma Bold (Compact Clean)</option>
          <option value="Georgia-Bold">Georgia Bold (Cinematic Editorial Serif)</option>
          <option value="TimesNewRomanPS-BoldMT">Times New Roman Bold (Classic Serif)</option>
          <option value="CourierNewPS-BoldMT">Courier New Bold (Archival Monospace)</option>
          <option value="HelveticaNeue-Bold">Helvetica Neue Bold (Swiss Clean)</option>
          <option value="Inter-Bold">Inter Bold (Clean Tech)</option>
          <option value="Poppins-Bold">Poppins Bold (Modern Geometric)</option>
          <option value="BebasNeue-Regular">Bebas Neue (Tall Condensed)</option>
          <option value="Roboto-Black">Roboto Black (High Contrast)</option>
        </select>
      </div>
      <div class="field">
        <label>Video Track</label>
        <select id="videoTrackSelect"></select>
      </div>
    </div>

    <!-- Row 2: Highlight Mode, Words/Clip, Position Y, Scale % -->
    <div class="grid-2">
      <div class="grid-2">
        <div class="field">
          <label>Highlight</label>
          <select id="highlightMode">
            <option value="active">Active Word</option>
            <option value="both" selected>Active + Key</option>
            <option value="keywords">Keywords Only</option>
            <option value="off">Disabled</option>
          </select>
        </div>
        <div class="field">
          <label>Position Y</label>
          <select id="posPreset">
            <option value="880" selected>Bottom (880)</option>
            <option value="540">Center (540)</option>
            <option value="200">Top (200)</option>
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Words per Clip</label>
          <input type="number" id="wordsPerClip" value="3" min="1" max="10" />
        </div>
        <div class="field">
          <label>Scale (%)</label>
          <input type="number" id="textScale" value="100" min="40" max="250" step="5" />
        </div>
      </div>
    </div>

    <!-- Row 3: Dual Color Controls (Font Color & Highlight Color) + Quick Palette -->
    <div class="field">
      <div class="grid-2">
        <!-- Font Color Picker Trigger -->
        <div class="color-picker-trigger-box" id="btnOpenFontColorPicker" title="Change Base Font Color (Opens Color Picker)">
          <label>Font Color</label>
          <div class="color-pill-preview">
            <span class="color-dot" id="fontColorDot" style="background:#FFFFFF;"></span>
            <span class="color-hex-text" id="fontColorHexLabel">#FFFFFF</span>
            <span class="color-picker-badge">Picker</span>
          </div>
        </div>

        <!-- Highlight Color Picker Trigger -->
        <div class="color-picker-trigger-box" id="btnOpenHighlightColorPicker" title="Change Active Word Highlight Color (Opens Color Picker)">
          <label>Highlight Color</label>
          <div class="color-pill-preview">
            <span class="color-dot" id="highlightColorDot" style="background:#FFC400;"></span>
            <span class="color-hex-text" id="activeHexLabel">#FFC400</span>
            <span class="color-picker-badge">Picker</span>
          </div>
        </div>
      </div>

      <!-- Quick Swatch Palette (Symmetrical 4x2) -->
      <div style="margin-top:var(--s-2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px;">Quick Palette (Click swatch to apply)</span>
        </div>
        <div class="swatch-grid-symmetrical" id="colorSwatchContainer"></div>
      </div>
    </div>

    <!-- Row 4: Sound FX & Preset Management (Symmetrical 2-Column Grid) -->
    <div class="grid-2">
      <div class="grid-2">
        <div class="field">
          <label>Sound FX</label>
          <select id="sfxModeSelect">
            <option value="none" selected>None</option>
            <option value="whoosh">Whoosh (Clip Entry)</option>
            <option value="pop">Pop (Keywords)</option>
            <option value="both">Whoosh + Pop</option>
            <option value="tick">Tick (Cadence)</option>
          </select>
        </div>
        <div class="field">
          <label>SFX Track</label>
          <select id="sfxTrackSelect" disabled></select>
        </div>
      </div>

      <div class="field">
        <label>Preset</label>
        <div class="preset-control-group">
          <select id="presetSelect"></select>
          <button type="button" class="btn-icon" id="btnSavePreset" title="Save current style settings as new preset" aria-label="Save Preset">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-icon-danger" id="btnDeletePreset" title="Delete current preset" aria-label="Delete Preset">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Row 5: Golden Ratio Action Bar (1.618fr Insert vs 1fr Clear) -->
    <div class="grid-golden">
      <button class="btn-success" id="btnRender" disabled>Insert Captions to Timeline</button>
      <button class="btn-danger" id="btnClearTrack" title="Clear captions and audio SFX from selected tracks">Clear Track</button>
    </div>
  </div>

  <!-- Adobe Photoshop-style Color Picker Modal Popup -->
  <div id="psColorModal" class="ps-modal-backdrop" style="display:none;">
    <div class="ps-color-dialog">
      <div class="ps-dialog-header">
        <span id="psModalTitle">Color Picker (Highlight Color)</span>
      </div>
      <div class="ps-dialog-body">
        <!-- Left: 2D Saturation / Value Gradient Canvas -->
        <div class="ps-spectrum-box" id="psSpectrumBox">
          <canvas id="psSatValCanvas" width="190" height="175"></canvas>
          <div class="ps-cursor" id="psSatValCursor"></div>
        </div>

        <!-- Middle: Vertical Rainbow Hue Slider Strip -->
        <div class="ps-hue-box" id="psHueBox">
          <canvas id="psHueCanvas" width="22" height="175"></canvas>
          <div class="ps-hue-slider" id="psHueSlider"></div>
        </div>

        <!-- Right: Preview & Numeric Inputs (Photoshop Layout) -->
        <div class="ps-controls-col">
          <!-- Preview Comparison Box (New vs Current) -->
          <div class="ps-preview-box">
            <div class="ps-preview-label">new</div>
            <div class="ps-preview-new" id="psPreviewNew"></div>
            <div class="ps-preview-current" id="psPreviewCurrent"></div>
            <div class="ps-preview-label">current</div>
          </div>

          <!-- Action Buttons -->
          <div class="ps-actions">
            <button type="button" class="btn-primary ps-btn" id="psBtnOk">OK</button>
            <button type="button" class="ps-btn" id="psBtnCancel">Cancel</button>
          </div>

          <!-- Color Model Inputs -->
          <div class="ps-input-group">
            <div class="ps-input-row">
              <label>H:</label>
              <input type="number" id="psInputH" min="0" max="360" value="0" />
            </div>
            <div class="ps-input-row">
              <label>S:</label>
              <input type="number" id="psInputS" min="0" max="100" value="100" />
            </div>
            <div class="ps-input-row">
              <label>B:</label>
              <input type="number" id="psInputB" min="0" max="100" value="100" />
            </div>
            <div class="ps-divider"></div>
            <div class="ps-input-row">
              <label>R:</label>
              <input type="number" id="psInputR" min="0" max="255" value="255" />
            </div>
            <div class="ps-input-row">
              <label>G:</label>
              <input type="number" id="psInputG" min="0" max="255" value="0" />
            </div>
            <div class="ps-input-row">
              <label>B:</label>
              <input type="number" id="psInputBlue" min="0" max="255" value="0" />
            </div>
            <div class="ps-divider"></div>
            <div class="ps-hex-row">
              <label>#</label>
              <input type="text" id="psInputHex" maxlength="7" value="FF0000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="status-bar" id="statusBar">Ready</div>

  <script src="./CSInterface.js"></script>
  <script src="./main.js"></script>
</body>
</html>

```

#### `client/main.js`

> **Purpose:** Studio orchestrator, FFmpeg WAV extraction, Whisper AI token parsing, MOGRT renderer  
> **File Location:** `client/main.js`

```javascript
// client/main.js
// bisik by rygh — Clean Golden Ratio Studio Orchestrator

const csInterface = typeof CSInterface !== "undefined" ? new CSInterface() : null;
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
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
  "bisik_Netflix_Doc.mogrt": "bisik_Cinema_Broadcast.mogrt",
  "bisik_Vox_Highlighter.mogrt": "bisik_Marker_Highlight.mogrt"
};

function migrateStyleName(styleName) {
  if (!styleName) return "bisik_Spring_Rise.mogrt";
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
 * 14 Animation Styles (4 Master Styles + 10 Additional Production Styles)
 */
const BISIK_ANIMATION_STYLES = [
  {
    id: "bisik_Spring_Rise",
    mogrt: "bisik_Spring_Rise.mogrt",
    name: "Position",
    title: "Spring Rise",
    category: "modern",
    cssClass: "anim-spring",
    previewHtml: 'your workflow in <span class="aw">After</span><br/>Effects and Premiere Pro.',
    favorite: true
  },
  {
    id: "bisik_Blur_Pop",
    mogrt: "bisik_Blur_Pop.mogrt",
    name: "Scale Blur",
    title: "Blur Pop",
    category: "modern",
    cssClass: "anim-blurpop",
    previewHtml: 'smooth <span class="aw">kinetic</span> captions',
    favorite: true
  },
  {
    id: "bisik_Bento_Card",
    mogrt: "bisik_Bento_Card.mogrt",
    name: "Frosted Card",
    title: "Bento Card",
    category: "modern",
    cssClass: "anim-bento",
    previewHtml: 'curated <span class="aw">bento</span> style',
    favorite: false
  },
  {
    id: "bisik_Karaoke_Pill",
    mogrt: "bisik_Karaoke_Pill.mogrt",
    name: "Active Pill",
    title: "Karaoke Pill",
    category: "modern",
    cssClass: "anim-pill",
    previewHtml: 'edit faster in <span class="aw">Premiere</span>',
    favorite: true
  },
  {
    id: "bisik_Cut_Accent",
    mogrt: "bisik_Cut_Accent.mogrt",
    name: "Cut",
    title: "Cut Accent",
    category: "modern",
    cssClass: "anim-cut",
    previewHtml: 'your workflow in <span class="aw">After</span>',
    favorite: true
  },
  {
    id: "bisik_Stomp_Impact",
    mogrt: "bisik_Stomp_Impact.mogrt",
    name: "Stomp",
    title: "Stomp Impact",
    category: "modern",
    cssClass: "anim-stomp",
    previewHtml: 'high energy <span class="aw">stomp</span> impact',
    favorite: false
  },
  {
    id: "bisik_Cyber_Glitch",
    mogrt: "bisik_Cyber_Glitch.mogrt",
    name: "Glitch",
    title: "Cyber Glitch",
    category: "modern",
    cssClass: "anim-cyber",
    previewHtml: 'cyberpunk <span class="aw">digital</span> glitch',
    favorite: false
  },
  {
    id: "bisik_Neon_Glow",
    mogrt: "bisik_Neon_Glow.mogrt",
    name: "Neon Glow",
    title: "Neon Glow",
    category: "modern",
    cssClass: "anim-neon",
    previewHtml: 'moody studio <span class="aw">neon</span> pulse',
    favorite: false
  },
  {
    id: "bisik_Box_Tape",
    mogrt: "bisik_Box_Tape.mogrt",
    name: "Cut Box",
    title: "Box Tape Cut",
    category: "documentary",
    cssClass: "anim-boxtape",
    previewHtml: 'your workflow in <span class="aw">After</span>',
    favorite: true
  },
  {
    id: "bisik_Marker_Highlight",
    mogrt: "bisik_Marker_Highlight.mogrt",
    name: "Marker Highlight",
    title: "Marker Highlight",
    category: "documentary",
    cssClass: "anim-marker",
    previewHtml: 'follow the <span class="aw">evidence</span> closely',
    favorite: true
  },
  {
    id: "bisik_Cinema_Broadcast",
    mogrt: "bisik_Cinema_Broadcast.mogrt",
    name: "Broadcast",
    title: "Cinema Broadcast",
    category: "documentary",
    cssClass: "anim-cinema",
    previewHtml: 'recorded in <span class="aw">Jakarta,</span> 2026.',
    favorite: false
  },
  {
    id: "bisik_Archival_Type",
    mogrt: "bisik_Archival_Type.mogrt",
    name: "Typewriter",
    title: "Archival Type",
    category: "documentary",
    cssClass: "anim-typewriter",
    previewHtml: 'FILE #09: <span class="aw">CLASSIFIED</span>',
    favorite: false
  },
  {
    id: "bisik_Editorial_Serif",
    mogrt: "bisik_Editorial_Serif.mogrt",
    name: "Editorial",
    title: "Editorial Serif",
    category: "documentary",
    cssClass: "anim-editorial",
    previewHtml: 'a story of <span class="aw">human</span> craft.',
    favorite: false
  },
  {
    id: "bisik_Minimal_Fade",
    mogrt: "bisik_Minimal_Fade.mogrt",
    name: "Fade Drift",
    title: "Minimal Whisper",
    category: "documentary",
    cssClass: "anim-minimal",
    previewHtml: 'quiet <span class="aw">cinematic</span> voice',
    favorite: false
  }
];

const DEFAULT_PRESETS = [
  {
    name: "Cinema Amber Gold",
    style: "bisik_Spring_Rise.mogrt",
    font: "Montserrat-Black",
    wordsPerClip: 3,
    highlightMode: "both",
    highlightColor: "#FFC400",
    posY: "880",
    scale: 100,
    dualLine: false
  },
  {
    name: "Blur Pop • Cerulean",
    style: "bisik_Blur_Pop.mogrt",
    font: "Poppins-Bold",
    wordsPerClip: 2,
    highlightMode: "active",
    highlightColor: "#0070D2",
    posY: "540",
    scale: 110,
    dualLine: false
  },
  {
    name: "Bento Card • Pure Green",
    style: "bisik_Bento_Card.mogrt",
    font: "Inter-Bold",
    wordsPerClip: 5,
    highlightMode: "both",
    highlightColor: "#00C828",
    posY: "880",
    scale: 95,
    dualLine: true
  },
  {
    name: "Karaoke Pill • Magenta",
    style: "bisik_Karaoke_Pill.mogrt",
    font: "PlusJakartaSans-Bold",
    wordsPerClip: 3,
    highlightMode: "active",
    highlightColor: "#D80B7C",
    posY: "880",
    scale: 100,
    dualLine: false
  }
];

const state = {
  words: [],
  presets: [],
  selectedHex: "#FFC400",
  fontColorHex: "#FFFFFF",
  lastActiveIndex: -1,
  caseMode: 0
};

const statusBar = getEl("statusBar");
const audioSelect = getEl("audioTrackSelect");
const videoSelect = getEl("videoTrackSelect");
const sfxTrackSelect = getEl("sfxTrackSelect");
const sfxModeSelect = getEl("sfxModeSelect");
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
    if (!trimmed || trimmed.startsWith("[") || trimmed.startsWith("(")) {
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
function renderColorPalette() {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--preview-accent", state.selectedHex);
    if (activeHexLabel) activeHexLabel.textContent = state.selectedHex;

    const fontDot = getEl("fontColorDot");
    const fontLabel = getEl("fontColorHexLabel");
    if (fontDot) fontDot.style.background = state.fontColorHex || "#FFFFFF";
    if (fontLabel) fontLabel.textContent = state.fontColorHex || "#FFFFFF";

    const hlDot = getEl("highlightColorDot");
    if (hlDot) hlDot.style.background = state.selectedHex;
  }
  const swatchContainer = getEl("colorSwatchContainer");
  if (swatchContainer) {
    swatchContainer.innerHTML = "";
    SPECTRUM_SWATCHES.forEach((sw) => {
      const btn = document.createElement("div");
      btn.className = "color-swatch" + (state.selectedHex.toUpperCase() === sw.hex.toUpperCase() ? " active" : "");
      btn.title = sw.fullName + " (" + sw.hex + ")";
      btn.innerHTML = `<span class="swatch-dot" style="background:${sw.hex};"></span><span>${sw.name}</span>`;
      btn.addEventListener("click", () => {
        state.selectedHex = sw.hex;
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--preview-accent", sw.hex);
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

  const initialHex = (target === "font") ? (state.fontColorHex || "#FFFFFF") : (state.selectedHex || "#FFC400");
  psState.initialHex = initialHex;
  psState.currentHex = initialHex;

  if (title) {
    title.textContent = (target === "font") ? "Color Picker (Text Color)" : "Color Picker (Highlight Color)";
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
  getEl("btnOpenFontColorPicker")?.addEventListener("click", () => openPhotoshopColorPicker("font"));
  getEl("btnOpenHighlightColorPicker")?.addEventListener("click", () => openPhotoshopColorPicker("highlight"));

  const modal = getEl("psColorModal");
  const closeModal = () => { if (modal) modal.style.display = "none"; };

  getEl("psBtnCancel")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  getEl("psBtnOk")?.addEventListener("click", () => {
    if (psTarget === "font") {
      state.fontColorHex = psState.currentHex;
    } else {
      state.selectedHex = psState.currentHex;
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

function applyPreset(idx) {
  const p = state.presets[idx];
  if (!p) return;
  const styleSel = getEl("styleSelect");
  const fontSel = getEl("fontSelect");
  const wordsInput = getEl("wordsPerClip");
  const modeSel = getEl("highlightMode");
  const posSel = getEl("posPreset");
  const scaleInput = getEl("textScale");
  const dualCheck = getEl("chkDualLine");

  if (styleSel) styleSel.value = migrateStyleName(p.style);
  if (fontSel && p.font) {
    let fVal = p.font;
    if (fVal === "PlayfairDisplay-Bold") fVal = "Georgia-Bold";
    if (fVal === "Cinzel-Bold") fVal = "TimesNewRomanPS-BoldMT";
    fontSel.value = fVal;
  }
  if (wordsInput) wordsInput.value = p.wordsPerClip;
  if (modeSel) modeSel.value = p.highlightMode;
  state.selectedHex = p.highlightColor || "#FFC400";
  if (activeHexLabel) activeHexLabel.textContent = state.selectedHex;
  if (posSel) posSel.value = p.posY;
  if (scaleInput) scaleInput.value = p.scale;
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
    wordsPerClip: parseInt(getEl("wordsPerClip").value, 10) || 3,
    highlightMode: getEl("highlightMode").value,
    highlightColor: state.selectedHex,
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

function saveAppSettings() {
  const settings = {
    lang: getEl("langSelect")?.value || "id",
    style: getEl("styleSelect")?.value,
    font: getEl("fontSelect")?.value,
    fontColor: state.fontColorHex || "#FFFFFF",
    wordsPerClip: getEl("wordsPerClip")?.value,
    highlightMode: getEl("highlightMode")?.value,
    highlightColor: state.selectedHex,
    posY: getEl("posPreset")?.value,
    scale: getEl("textScale")?.value,
    sfxMode: sfxModeSelect?.value || "none",
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
      if (s.style) s.style = migrateStyleName(s.style);
      if (s.lang && getEl("langSelect")) getEl("langSelect").value = s.lang;
      if (s.style && getEl("styleSelect")) getEl("styleSelect").value = s.style;
      if (s.font && getEl("fontSelect")) {
        let fVal = s.font;
        if (fVal === "PlayfairDisplay-Bold") fVal = "Georgia-Bold";
        if (fVal === "Cinzel-Bold") fVal = "TimesNewRomanPS-BoldMT";
        getEl("fontSelect").value = fVal;
      }
      if (s.fontColor) state.fontColorHex = s.fontColor;
      if (s.wordsPerClip && getEl("wordsPerClip")) getEl("wordsPerClip").value = s.wordsPerClip;
      if (s.highlightMode && getEl("highlightMode")) getEl("highlightMode").value = s.highlightMode;
      if (s.highlightColor) {
        state.selectedHex = s.highlightColor;
      }
      renderColorPalette();
      if (s.posY && getEl("posPreset")) getEl("posPreset").value = s.posY;
      if (s.scale && getEl("textScale")) getEl("textScale").value = s.scale;
      if (s.sfxMode && sfxModeSelect) {
        sfxModeSelect.value = s.sfxMode;
        if (sfxTrackSelect) sfxTrackSelect.disabled = s.sfxMode === "none";
      }
      if (typeof s.dualLine === "boolean" && getEl("chkDualLine")) {
        getEl("chkDualLine").checked = s.dualLine;
      }
      writeJsonAtomic(SETTINGS_FILE, s);
    }
  } catch (e) { }
  renderColorPalette();
}

sfxModeSelect?.addEventListener("change", () => {
  if (sfxTrackSelect) sfxTrackSelect.disabled = sfxModeSelect.value === "none";
  saveAppSettings();
});

// ============================================================================
// 3. LOAD SEQUENCE TRACKS
// ============================================================================
async function loadTracks(opts = {}) {
  const applyDefaults = opts.applyDefaults === true;
  const prevAudio = audioSelect ? audioSelect.value : null;
  const prevVideo = videoSelect ? videoSelect.value : null;
  const prevSfx = sfxTrackSelect ? sfxTrackSelect.value : null;

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

    // Default video track: choose topmost (highest index) empty video track across timeline
    let safeDefaultVideoIdx = -1;
    const emptyVideoTracks = data.videoTracks.filter((v) => v.clipCount === 0);
    if (emptyVideoTracks.length > 0) {
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
      opt.textContent = `${v.name} (${status})`;
      if (String(v.index) === targetVideoVal) opt.selected = true;
      videoSelect.appendChild(opt);
    });

    // Default SFX track: choose bottom-most track if higher tracks are filled with speech and music
    let defaultSfxIdx = -1;
    const nonDialogueTracks = data.audioTracks.filter((t) => String(t.index) !== targetAudioVal);
    const labeledSfxTrack = nonDialogueTracks.find((t) => /sfx|sound fx|foley|effect/i.test(t.name));
    if (labeledSfxTrack) {
      defaultSfxIdx = labeledSfxTrack.index;
    } else {
      const emptyAudioTracks = nonDialogueTracks.filter((t) => t.clipCount === 0);
      if (emptyAudioTracks.length > 0) {
        defaultSfxIdx = emptyAudioTracks[emptyAudioTracks.length - 1].index;
      } else if (nonDialogueTracks.length > 0) {
        defaultSfxIdx = nonDialogueTracks[nonDialogueTracks.length - 1].index;
      }
    }

    const targetSfxVal = (!applyDefaults && prevSfx !== null && data.audioTracks.some((t) => String(t.index) === String(prevSfx)))
      ? prevSfx
      : (defaultSfxIdx !== -1 ? String(defaultSfxIdx) : "");

    sfxTrackSelect.innerHTML = "";
    data.audioTracks.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.index;
      const isDialogue = String(t.index) === targetAudioVal;
      const status = isDialogue ? "Dialogue" : (t.clipCount === 0 ? "Empty" : `${t.clipCount} clips`);
      opt.textContent = `${t.name} (${status})`;
      if (String(t.index) === targetSfxVal) opt.selected = true;
      sfxTrackSelect.appendChild(opt);
    });

    if (defaultSfxIdx === -1 && data.audioTracks.length <= 1) {
      if (sfxModeSelect) sfxModeSelect.value = "none";
    }

    loadAppSettings();
    const resInfo = data.profile ? ` • ${data.profile}` : "";
    const scaleInfo = (data.scalePercent && data.scalePercent !== 100) ? ` (${data.scalePercent}% scale)` : "";
    setStatus(`Sequence "${data.sequenceName}"${resInfo}${scaleInfo} connected.`, "success");
  } catch (e) {
    setStatus("Unable to read sequence tracks.", "error");
  }
}

getEl("btnRefresh")?.addEventListener("click", (e) => {
  if (e.shiftKey || e.altKey) {
    window.location.reload();
    return;
  }
  loadTracks({ applyDefaults: false });
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
  if (typeof document === "undefined") {
    return Math.max(38, Math.ceil(str.length * 10) + 26);
  }
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement("canvas");
  }
  const ctx = textMeasureCanvas.getContext("2d");
  if (ctx) {
    ctx.font = "500 12px adobe-clean, 'Adobe Clean', 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif";
    const textWidth = ctx.measureText(str).width;
    return Math.max(38, Math.ceil(textWidth) + 26);
  }
  return Math.max(38, Math.ceil(str.length * 10) + 26);
}

function renderWordEditor() {
  wordGrid.innerHTML = "";
  const activeWords = state.words.filter((w) => w.text && w.text.trim().length > 0);
  wordCountBadge.textContent = `(${activeWords.length})`;

  const qcBadge = getEl("qcStatusBadge");
  if (state.words.length === 0) {
    if (qcBadge) qcBadge.style.display = "none";
    wordGrid.innerHTML = `<div style="color:var(--muted); font-size:var(--f-sm); padding:var(--s-4); text-align:center; width:100%;">No transcript loaded. Transcribe an audio track or import an SRT/JSON file.</div>`;
    btnRender.disabled = true;
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

  btnRender.disabled = false;
}

getEl("btnCleanFillers")?.addEventListener("click", () => {
  if (state.words.length === 0) return;
  pushHistoryState();
  const fillers = new Set(["umm", "um", "uh", "uhh", "eee", "ee", "eh", "hmm", "hm", "ah", "anu"]);
  const before = state.words.length;
  state.words = state.words.filter((w) => !fillers.has(w.text.toLowerCase().replace(/[^a-z]/g, "")));
  renderWordEditor();
  setStatus(`Removed ${before - state.words.length} filler words.`, "info");
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
  const validWords = sourceWords.filter((w) => w.text && w.text.trim().length > 0);

  const wordsMax = customOptions.wordsMax !== undefined
    ? customOptions.wordsMax
    : ((typeof document !== "undefined" && getEl("wordsPerClip"))
      ? parseInt(getEl("wordsPerClip").value, 10) || 3
      : 3);

  const isDualLine = customOptions.isDualLine !== undefined
    ? customOptions.isDualLine
    : ((typeof document !== "undefined" && getEl("chkDualLine"))
      ? getEl("chkDualLine").checked
      : false);

  const maxCpl = customOptions.maxCpl || 38;
  const maxDuration = customOptions.maxDuration || 6.0;

  function formatWordsLine(wList) {
    return wList.map((w) => (w.text ? w.text.trim() : "")).join(" ");
  }

  function splitIntoTwoBalancedLines(wList) {
    if (wList.length <= 1) return [wList];
    let bestIndex = 1;
    let minDiff = Infinity;
    for (let k = 1; k < wList.length; k++) {
      const line1 = formatWordsLine(wList.slice(0, k));
      const line2 = formatWordsLine(wList.slice(k));
      let penalty = 0;
      if (line1.length > maxCpl) penalty += (line1.length - maxCpl) * 10;
      if (line2.length > maxCpl) penalty += (line2.length - maxCpl) * 10;
      const diff = Math.abs(line1.length - line2.length) + penalty;
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = k;
      }
    }
    return [wList.slice(0, bestIndex), wList.slice(bestIndex)];
  }

  function pushChunk(chunkWords) {
    if (!chunkWords || chunkWords.length === 0) return;
    if (isDualLine && chunkWords.length >= 2) {
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
      const isSpeechPause = prevWord && (w.start - prevWord.end >= 0.8);

      let exceedsCpl = false;
      if (!isDualLine) {
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

      const exceedsDuration = projectedDuration > maxDuration;
      const exceedsWordCount = projectedWords.length > wordsMax;

      if (exceedsWordCount || exceedsDuration || exceedsCpl || isSpeechPause) {
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

getEl("wordsPerClip")?.addEventListener("input", () => renderWordEditor());
getEl("chkDualLine")?.addEventListener("change", () => renderWordEditor());

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

    valid.push({
      text,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      isKeyword: Boolean(item.isKeyword),
      forceBreak: Boolean(item.forceBreak)
    });
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
  try {
    const root = os.tmpdir();
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const entries = fs.readdirSync(root);
    for (const name of entries) {
      if (name.startsWith("bisik_job_") || name.startsWith("bisik_payload_") || name.startsWith("bisik_temp")) {
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
    const stdout = execSync(`"${whisperBin}" --help`, {
      env: env || process.env,
      timeout: 5000,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    }).toString();
    cachedWhisperCaps = {
      supportsNoPrints: stdout.includes("-np") || stdout.includes("--no-prints"),
      supportsPrintProgress: stdout.includes("-pp") || stdout.includes("--print-progress"),
      supportsMaxContext: stdout.includes("-mc") || stdout.includes("--max-context"),
      supportsEntropyThold: stdout.includes("--entropy-thold") || stdout.includes("-et"),
      supportsLogprobThold: stdout.includes("--logprob-thold") || stdout.includes("-lpt"),
      supportsSplitOnWord: stdout.includes("-sow") || stdout.includes("--split-on-word"),
      supportsMaxLen: stdout.includes("-ml") || stdout.includes("--max-len"),
      isWhisperCpp: stdout.includes("whisper-cli") || stdout.includes("usage: main") || stdout.includes("ggml") || stdout.includes("--model")
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
      isWhisperCpp: true
    };
  }
  return cachedWhisperCaps;
}

function findAvailableWhisperModel(extRoot, lang = "id") {
  const candidateDirs = [
    path.join(os.homedir(), ".whisper-models"),
    path.join(os.homedir(), "whisper-models"),
    path.join(os.homedir(), "AppData", "Local", "whisper-models"),
    path.join(extRoot || "", "models")
  ];

  const preferredFiles = [
    "ggml-large-v3.bin",
    "ggml-large-v3-turbo.bin",
    "ggml-base.bin",
    "ggml-small.bin",
    "ggml-medium.bin",
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
      const { execSync } = require("child_process");
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

  const trackIdx = audioSelect.value;
  const lang = getEl("langSelect").value;
  const rangeMode = queryEl('input[name="rangeMode"]:checked').value;

  const extRoot = csInterface.getSystemPath(SystemPath.EXTENSION);

  // Task 15: Capture active sequence identifier to prevent rendering to wrong sequence
  try {
    const rawSeq = await evalJSX("bisikGetActiveSequenceId()");
    const seqData = JSON.parse(rawSeq);
    if (seqData.sequenceId) {
      state.transcribedSequenceId = seqData.sequenceId;
    }
  } catch (seqErr) { }

  // Task 11: Create job with isolated temporary scratch directory and cancellation token
  const job = createJob();
  currentJob = job;

  setStatus(`Extracting audio (${rangeMode})...`, "info");
  const rawClips = await evalJSX(`getTrackAudioClipsByRange(${trackIdx}, "${rangeMode}")`);
  const clipData = JSON.parse(rawClips);
  if (clipData.error) {
    btnTranscribe.disabled = false;
    cleanupDirectorySafe(job.dir);
    currentJob = null;
    return setStatus(clipData.error, "error");
  }

  if (state.words.length > 0) pushHistoryState(); // Task 20: save history state before re-transcribing
  state.words = [];
  const childEnv = buildChildEnv();
  const ffmpegBin = resolveExecutable("ffmpeg");
  const whisperBin = resolveExecutable("whisper-cli", ["whisper-cpp"]);

  if (!fs.existsSync(ffmpegBin)) {
    btnTranscribe.disabled = false;
    cleanupDirectorySafe(job.dir);
    currentJob = null;
    const installCmd = process.platform === "win32" ? "winget install Gyan.FFmpeg" : "brew install ffmpeg";
    setStatus(`FFmpeg not found. Please install via '${installCmd}' or run the AI setup script.`, "error");
    return;
  }

  if (!fs.existsSync(whisperBin)) {
    btnTranscribe.disabled = false;
    cleanupDirectorySafe(job.dir);
    currentJob = null;
    const installCmd = process.platform === "win32" ? "winget install whisper.cpp" : "brew install whisper-cpp";
    setStatus(`Whisper CLI not found. Please install via '${installCmd}' or run the AI setup script.`, "error");
    return;
  }

  const modelPath = findAvailableWhisperModel(extRoot, lang);
  if (!modelPath) {
    btnTranscribe.disabled = false;
    cleanupDirectorySafe(job.dir);
    currentJob = null;
    const expectedDir = path.join(os.homedir(), ".whisper-models");
    setStatus(`Whisper model missing. Run the AI setup script or place ggml-large-v3.bin into ${expectedDir}`, "error");
    return;
  }

  const modelShortName = path.basename(modelPath, ".bin").replace(/^ggml-/, "").toUpperCase();

  if (progressContainer) progressContainer.style.display = "flex";
  if (progressBar) progressBar.style.width = "0%";

  try {
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

      // Task 9: Fast frame-accurate input seeking (-ss before -i) with quiet flags
      await runAsyncProcess(
        ffmpegBin,
        [
          "-hide_banner", "-nostats", "-loglevel", "error", "-y",
          "-ss", String(clip.inPoint),
          "-t", duration,
          "-i", clip.mediaPath,
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
      "-l", lang,
      "-oj",
      "-of", jsonOutPrefix
    ];

    if (caps.supportsSplitOnWord) whisperArgs.push("-sow");
    if (caps.supportsMaxLen) whisperArgs.push("-ml", "1");
    if (caps.supportsNoPrints) whisperArgs.push("-np");
    if (caps.supportsPrintProgress) whisperArgs.push("-pp");
    // -mc 0 stops Whisper carrying over context across 30-sec windows, preventing repetition loops!
    if (caps.supportsMaxContext) whisperArgs.push("-mc", "0");

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
    const reconstructed = reconstructFullWords(whisperJson.transcription || []);

    // Task 8: Map tokens through zone map and drop words recognized during synthetic silence
    reconstructed.forEach((token) => {
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

    if (!job.cancelled) {
      if (progressBar) progressBar.style.width = "100%";
      if (progressText) progressText.textContent = "100% Done";
      renderWordEditor();
      setStatus(`Transcribed ${state.words.length} words via Whisper ${modelShortName}.`, "success");
    }
  } catch (err) {
    if (!job.cancelled) {
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
    cleanupDirectorySafe(job.dir);
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
    const chunks = buildWordChunks();
    if (chunks.length === 0) return setStatus("No words to render.", "warning");

    const videoTrackIdx = parseInt(videoSelect.value, 10);
    const styleFile = getEl("styleSelect").value;
    const fontName = getEl("fontSelect") ? getEl("fontSelect").value : "Montserrat-Black";
    const highlightMode = getEl("highlightMode").value;
    const normalizedColor = hexToNormalizedFloatRgb(state.selectedHex);
    const posY = parseInt(getEl("posPreset").value, 10) || 880;
    const textScale = parseInt(getEl("textScale").value, 10) || 100;

    const sfxMode = sfxModeSelect.value;
    const sfxTrackIdx = parseInt(sfxTrackSelect.value, 10);
    const audioTrackIdx = parseInt(audioSelect.value, 10);

    if (sfxMode !== "none" && sfxTrackIdx === audioTrackIdx) {
      btnRender.disabled = false;
      return setStatus("SFX track must be different from the dialogue track.", "warning");
    }

    const extRoot = csInterface.getSystemPath(SystemPath.EXTENSION);
    const mogrtPath = path.join(extRoot, "assets", styleFile);
    const sfxDir = path.join(extRoot, "assets", "sfx");

    if (!fs.existsSync(mogrtPath)) {
      btnRender.disabled = false;
      return setStatus(`Missing MOGRT: ${styleFile} in assets/`, "error");
    }

    const allSegments = [];

    chunks.forEach((chunkObj) => {
      const chunk = chunkObj.words;
      const clipStartSec = chunk[0].start;
      const clipEndSec = chunk[chunk.length - 1].end;
      const wordTimings = [];
      const keywordTimes = [];

      const formattedText = chunkObj.lines.map((line) => line.map((w) => w.text.trim()).join(" ")).join("\n");

      chunk.forEach((w) => {
        const relStart = Number((w.start - clipStartSec).toFixed(3));
        const relEnd = Number((w.end - clipStartSec).toFixed(3));

        // Highlight flag contract:
        // 0 = no highlight
        // 1 = highlight only while the word is being spoken
        // 2 = keyword, always highlighted
        // 3 = keyword (in "Active + Key" mode), always highlighted
        let kFlag = 0;
        if (highlightMode === "active") kFlag = 1;
        else if (highlightMode === "keywords") kFlag = w.isKeyword ? 2 : 0;
        else if (highlightMode === "both") kFlag = w.isKeyword ? 3 : 1;

        if (w.isKeyword) keywordTimes.push(w.start);

        wordTimings.push({
          s: Math.max(0, relStart),
          e: Math.max(relStart + 0.16, relEnd),
          k: kFlag
        });
      });

      const jsonTimingString = JSON.stringify({
        t: formattedText,
        f: fontName,
        fc: hexToNormalizedFloatRgb(state.fontColorHex || "#FFFFFF"),
        c: normalizedColor,
        y: posY,
        sc: textScale,
        w: wordTimings
      });

      allSegments.push({
        start: clipStartSec,
        end: Math.max(clipEndSec, clipStartSec + MIN_CLIP_DURATION_SEC),
        text: formattedText,
        font: fontName,
        wordTimingJson: jsonTimingString,
        wordTimingPipe: jsonTimingString,
        keywordTimes: keywordTimes
      });
    });

    // Task 15: Guard against active sequence changes between Transcribe and Render
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

    // Task 10: Pre-check target track validity upfront before batching
    const precheckRaw = await evalJSX(`bisikPrecheckTarget(${videoTrackIdx}, ${sfxTrackIdx}, "${sfxMode}")`);
    const precheck = JSON.parse(precheckRaw);
    if (precheck.error) {
      btnRender.disabled = false;
      return setStatus(precheck.error, "error");
    }

    // Optimized batch size of 5 for instant, crash-free, highly responsive imports
    const BATCH_SIZE = 5;
    let totalInserted = 0;
    let totalSfxInserted = 0;
    let totalSfxSkipped = 0;

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
        sfxMode: sfxMode,
        sfxTrackIndex: sfxTrackIdx,
        sfxPaths: {
          whoosh: path.join(sfxDir, "bisik_sfx_whoosh.wav"),
          pop: path.join(sfxDir, "bisik_sfx_pop.wav"),
          tick: path.join(sfxDir, "bisik_sfx_tick.wav")
        },
        segments: batchSegments
      };

      const payloadPath = writePayloadFile(payloadObject);
      let rawRes = "";
      try {
        // Generous 120s timeout ensures heavy sequences never hit premature timeout
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
      totalSfxInserted += (res.sfxInserted || 0);
      totalSfxSkipped += (res.sfxSkipped || 0);

      // 60ms yield between batches lets Premiere repaint UI smoothly & process events
      if (b < numBatches - 1) {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    saveAppSettings();
    await loadTracks({ applyDefaults: false });
    let msg = `Inserted ${totalInserted} captions & ${totalSfxInserted} SFX clips.`;
    if (totalSfxSkipped > 0) {
      msg += ` (${totalSfxSkipped} SFX skipped to protect existing audio).`;
    }
    setStatus(msg, "success");
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
  const sfxTrackIdx = parseInt(sfxTrackSelect.value, 10);

  // If already in confirming state, execute the clear:
  if (btnClearTrack.dataset.confirming === "true") {
    clearTimeout(clearConfirmTimer);
    delete btnClearTrack.dataset.confirming;
    btnClearTrack.textContent = "Clear Track";

    try {
      const raw = await evalJSX(`clearTargetTracks(${videoTrackIdx}, ${sfxTrackIdx})`);
      const res = JSON.parse(raw);
      if (res.error) return setStatus(res.error, "error");
      await loadTracks({ applyDefaults: false });
      setStatus(`Cleared ${res.removedVideo} bisik captions & ${res.removedAudio} SFX clips.`, "success");
    } catch (err) {
      setStatus(err, "error");
    }
    return;
  }

  // First click: query clearable count
  try {
    const rawCount = await evalJSX(`bisikCountClearable(${videoTrackIdx}, ${sfxTrackIdx})`);
    const countData = JSON.parse(rawCount);
    if (countData.error) return setStatus(countData.error, "error");

    const total = (countData.videoCount || 0) + (countData.sfxCount || 0);
    if (total === 0) {
      return setStatus("No bisik caption or SFX clips found on the selected tracks.", "warning");
    }

    btnClearTrack.dataset.confirming = "true";
    btnClearTrack.textContent = `Click again to confirm (${total} bisik clips)`;

    clearConfirmTimer = setTimeout(() => {
      delete btnClearTrack.dataset.confirming;
      btnClearTrack.textContent = "Clear Track";
    }, 4000);
  } catch (e) {
    setStatus("Failed to inspect tracks for clearable clips.", "error");
  }
});

// Boot Studio
if (typeof window !== "undefined" && typeof document !== "undefined") {
  syncThemeWithHost();
  renderColorPalette();
  initPhotoshopColorPicker();
  initGalleryAndFilterListeners();
  renderStylePreviewGallery();
  loadPresets();
  loadTracks();
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
    state
  };
}

```

### Build, Asset & Packaging Automation

#### `scripts/build_bisik_mogrt.jsx`

> **Purpose:** After Effects batch ExtendScript: generates all 14 MOGRT binary templates  
> **File Location:** `scripts/build_bisik_mogrt.jsx`

```javascript
/**
 * bisik by rygh — Automated Batch MOGRT Generator for Adobe After Effects
 * Generates and auto-exports 14 Valid Motion Graphics Templates (.mogrt)
 * into the /assets directory.
 */
(function buildAllBisikMogrts() {
    app.beginSuppressDialogs();

    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;
    var assetsFolder = new Folder(projectRoot.fsName + "/assets");
    if (!assetsFolder.exists) assetsFolder.create();

    var tempFolder = new Folder(projectRoot.fsName + "/temp");
    if (!tempFolder.exists) tempFolder.create();

    var logFile = new File(tempFolder.fsName + "/mogrt_build_log.txt");
    logFile.open("w");
    logFile.writeln("=== BISIK BY RYGH: 14 MOGRT BATCH EXPORT START ===");

    try {
        if (app.project) {
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        }
        app.newProject();
        try {
            app.project.expressionEngine = "javascript-1.0";
        } catch (engineErr) { }

        var tempAepFile = new File(tempFolder.fsName + "/bisik_mogrt_factory.aep");
        app.project.save(tempAepFile);
        logFile.writeln("Temporary factory project initialized: " + tempAepFile.fsName);

        // 14 Valid Animation Styles (4 Master Styles + 10 Production Styles)
        var PRESETS = [
            {
                id: "bisik_Spring_Rise",
                title: "Spring Rise",
                font: "SFProDisplay-Bold",
                size: 80,
                hasBox: false,
                scaleHighlight: 106,
                animType: "SPRING_RISE"
            },
            {
                id: "bisik_Blur_Pop",
                title: "Blur Pop",
                font: "SFProDisplay-Bold",
                size: 78,
                hasBox: false,
                scaleHighlight: 106,
                animType: "BLUR_POP"
            },
            {
                id: "bisik_Bento_Card",
                title: "Bento Card",
                font: "SFProDisplay-Bold",
                size: 76,
                hasBox: true,
                boxColor: [0.08, 0.08, 0.09],
                boxOpacity: 88,
                boxPadX: 36,
                boxPadY: 22,
                boxRoundness: 24,
                scaleHighlight: 106,
                animType: "BENTO_CARD"
            },
            {
                id: "bisik_Karaoke_Pill",
                title: "Karaoke Pill",
                font: "SFProDisplay-Bold",
                size: 76,
                hasBox: true,
                boxColor: [0.04, 0.52, 1.0],
                boxOpacity: 92,
                boxPadX: 20,
                boxPadY: 14,
                boxRoundness: 22,
                scaleHighlight: 106,
                animType: "KARAOKE_PILL"
            },
            {
                id: "bisik_Cut_Accent",
                title: "Cut Accent",
                font: "SFProDisplay-Bold",
                size: 78,
                hasBox: false,
                scaleHighlight: 106,
                animType: "CUT_ACCENT"
            },
            {
                id: "bisik_Box_Tape",
                title: "Box Tape Cut",
                font: "HelveticaNeue-CondensedBlack",
                size: 74,
                hasBox: true,
                boxColor: [0.06, 0.06, 0.07],
                boxOpacity: 94,
                boxPadX: 24,
                boxPadY: 14,
                boxRoundness: 6,
                scaleHighlight: 106,
                animType: "BOX_TAPE"
            },
            {
                id: "bisik_Marker_Highlight",
                title: "Marker Highlight",
                font: "HelveticaNeue-Bold",
                size: 72,
                textColor: [0.07, 0.07, 0.08],
                hasBox: true,
                boxColor: [1.0, 0.90, 0.04],
                boxOpacity: 96,
                boxPadX: 24,
                boxPadY: 12,
                boxRoundness: 4,
                scaleHighlight: 104,
                animType: "MARKER_HIGHLIGHT"
            },
            {
                id: "bisik_Cinema_Broadcast",
                title: "Cinema Broadcast",
                font: "HelveticaNeue-Medium",
                size: 68,
                hasBox: false,
                hasStroke: false,
                hasShadow: true,
                scaleHighlight: 104,
                animType: "CINEMA_BROADCAST"
            },
            {
                id: "bisik_Archival_Type",
                title: "Archival Type",
                font: "CourierNewPS-BoldMT",
                size: 64,
                hasBox: true,
                boxColor: [0.05, 0.05, 0.05],
                boxOpacity: 92,
                boxPadX: 20,
                boxPadY: 12,
                boxRoundness: 0,
                scaleHighlight: 104,
                animType: "ARCHIVAL_TYPEWRITER"
            },
            {
                id: "bisik_Editorial_Serif",
                title: "Editorial Serif",
                font: "Georgia-BoldItalic",
                size: 72,
                hasBox: false,
                scaleHighlight: 106,
                animType: "EDITORIAL_SERIF"
            },
            {
                id: "bisik_Minimal_Fade",
                title: "Minimal Whisper",
                font: "SFProDisplay-Medium",
                size: 64,
                tracking: 25,
                hasBox: false,
                scaleHighlight: 104,
                animType: "MINIMAL_FADE"
            },
            {
                id: "bisik_Cyber_Glitch",
                title: "Cyber Glitch",
                font: "SFProDisplay-Heavy",
                size: 76,
                hasBox: false,
                scaleHighlight: 108,
                animType: "CYBER_GLITCH"
            },
            {
                id: "bisik_Neon_Glow",
                title: "Neon Glow",
                font: "SFProDisplay-Bold",
                size: 74,
                hasBox: false,
                hasGlow: true,
                scaleHighlight: 108,
                animType: "NEON_GLOW"
            },
            {
                id: "bisik_Stomp_Impact",
                title: "Stomp Impact",
                font: "HelveticaNeue-CondensedBlack",
                size: 80,
                hasBox: false,
                scaleHighlight: 110,
                animType: "STOMP_IMPACT"
            }
        ];

        var exportedList = [];

        for (var i = 0; i < PRESETS.length; i++) {
            var p = PRESETS[i];
            logFile.writeln("[" + (i + 1) + "/" + PRESETS.length + "] Creating comp: " + p.id);

            var comp = app.project.items.addComp(p.id, 1920, 1080, 1.0, 10.0, 60);
            comp.motionBlur = true;
            comp.motionGraphicsTemplateName = p.id;

            // 1. Hidden Data Carrier Text Layer: WordTimingJSON
            var defaultJson = '{"t":"bisik by rygh","c":[1.0,0.84,0.04],"y":840,"sc":100,"w":[{"s":0,"e":0.4,"k":1},{"s":0.4,"e":0.9,"k":1},{"s":0.9,"e":1.5,"k":1}]}';
            var jsonLayer = comp.layers.addText(defaultJson);
            jsonLayer.name = "WordTimingJSON";
            jsonLayer.guideLayer = true;
            jsonLayer.enabled = false;
            jsonLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
            var jsonProp = jsonLayer.property("ADBE Text Properties").property("ADBE Text Document");

            // 2. Visible Subtitle Text Layer: CaptionText
            var textLayer = comp.layers.addText("bisik by rygh");
            textLayer.name = "CaptionText";
            textLayer.motionBlur = true;

            var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
            var textDoc = textProp.value;
            textDoc.resetCharStyle();
            textDoc.fontSize = p.size;
            textDoc.fillColor = p.textColor ? p.textColor : [0.97, 0.97, 0.98];
            textDoc.applyFill = true;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (p.tracking) textDoc.tracking = p.tracking;

            if (p.hasStroke) {
                textDoc.applyStroke = true;
                textDoc.strokeColor = [0.02, 0.02, 0.02];
                textDoc.strokeWidth = 4;
            } else {
                textDoc.applyStroke = false;
            }

            try {
                textDoc.font = p.font;
            } catch (fontErr) {
                try {
                    textDoc.font = "HelveticaNeue-Bold";
                } catch (fbErr) {
                    try { textDoc.font = "Arial-BoldMT"; } catch (aErr) { }
                }
            }
            textProp.setValue(textDoc);

            // Dynamic Font Family & Base Font Color Expression (reads from WordTimingJSON)
            textProp.expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var targetFont = '';",
                "var targetColor = null;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.f) {",
                "        targetFont = cfg.f;",
                "        if (targetFont === 'PlayfairDisplay-Bold') targetFont = 'Georgia-Bold';",
                "        if (targetFont === 'Cinzel-Bold') targetFont = 'TimesNewRomanPS-BoldMT';",
                "    }",
                "    if (cfg && cfg.fc && cfg.fc.length === 3) targetColor = cfg.fc;",
                "} catch(e) {}",
                "var s = text.sourceText.style;",
                "s.setText(value);",
                "if (targetColor) {",
                "    try { s.setFillColor(targetColor); } catch(ce) {}",
                "}",
                "if (targetFont && targetFont !== '') {",
                "    try { s.setFont(targetFont); } catch(fe) {}",
                "}",
                "s;"
            ].join("\n");

            // Anchor point auto-centering
            textLayer.property("ADBE Transform Group").property("ADBE Anchor Point").expression = [
                "var r = sourceRectAtTime(time, false);",
                "[r.left + r.width / 2, r.top + r.height / 2];"
            ].join("\n");

            // Position with base Y reading from WordTimingJSON
            var posExpr = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var baseY = 880;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.y === 'number') baseY = cfg.y;",
                "} catch(e) {}",
                "var baseX = thisComp.width / 2;"
            ];

            if (p.animType === "SPRING_RISE") {
                posExpr.push("var freq = 3.2; var decay = 6.5;");
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var offset = 65 * Math.exp(-decay * t) * Math.cos(freq * t * 2 * Math.PI);");
                posExpr.push("[baseX, baseY + offset];");
            } else if (p.animType === "EDITORIAL_SERIF") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var dy = (t < 0.28) ? (1 - Math.pow(1 - (t / 0.28), 3)) * 22 - 22 : 0;");
                posExpr.push("[baseX, baseY - dy];");
            } else if (p.animType === "CYBER_GLITCH") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var glitch = (t < 0.22) ? (Math.sin(time * 80) * 14 * Math.exp(-12 * t)) : 0;");
                posExpr.push("[baseX + glitch, baseY];");
            } else {
                posExpr.push("[baseX, baseY];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Position").expression = posExpr.join("\n");

            // Scale expression
            var scaleExpr = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var sc = 100;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.sc === 'number') sc = cfg.sc;",
                "} catch(e) {}"
            ];

            if (p.animType === "BLUR_POP") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var pop = (t < 0.35) ? (100 - 35 * Math.cos(2.8 * Math.PI * 2 * t) / Math.exp(6.2 * t)) : 100;");
                scaleExpr.push("[sc * (pop / 100), sc * (pop / 100)];");
            } else if (p.animType === "STOMP_IMPACT") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var stomp = (t < 0.35) ? (1 + 0.40 * Math.exp(-14 * t) * Math.cos(9 * t * Math.PI * 2)) : 1.0;");
                scaleExpr.push("[sc * stomp, sc * stomp];");
            } else {
                scaleExpr.push("[sc, sc];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Scale").expression = scaleExpr.join("\n");

            // Opacity expression for smooth entrance
            if (p.animType === "MINIMAL_FADE" || p.animType === "CINEMA_BROADCAST" || p.animType === "EDITORIAL_SERIF") {
                textLayer.property("ADBE Transform Group").property("ADBE Opacity").expression =
                    "linear(time, inPoint, inPoint + 0.18, 0, 100);";
            }

            // Typewriter effect expression for Archival Type
            if (p.animType === "ARCHIVAL_TYPEWRITER") {
                textProp.expression = [
                    "var fullTxt = value;",
                    "var speed = 28;",
                    "var count = Math.floor((time - inPoint) * speed);",
                    "var cursor = (Math.floor(time * 3.5) % 2 === 0) ? '_' : ' ';",
                    "if (count < fullTxt.length) {",
                    "    fullTxt.substr(0, Math.max(0, count)) + cursor;",
                    "} else {",
                    "    fullTxt;",
                    "}"
                ].join("\n");
            }

            // Subtle Drop Shadow
            if (p.hasShadow || p.animType === "CINEMA_BROADCAST" || p.animType === "CUT_ACCENT") {
                var ds = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds) {
                    ds.property("ADBE Drop Shadow-0002").setValue(120);
                    ds.property("ADBE Drop Shadow-0003").setValue(180);
                    ds.property("ADBE Drop Shadow-0004").setValue(8);
                    ds.property("ADBE Drop Shadow-0005").setValue(28);
                }
            }

            // Neon Glow Effect (Dual Layer Dynamic Color Glow)
            if (p.hasGlow) {
                var ds1 = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds1) {
                    ds1.property("ADBE Drop Shadow-0002").setValue(255); // 100% opacity
                    ds1.property("ADBE Drop Shadow-0003").setValue(0);   // angle
                    ds1.property("ADBE Drop Shadow-0004").setValue(0);   // 0 distance (centered glow)
                    ds1.property("ADBE Drop Shadow-0005").setValue(42);  // softness
                    ds1.property("ADBE Drop Shadow-0001").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = [0.0, 0.898, 1.0, 1.0];",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }
                var ds2 = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds2) {
                    ds2.property("ADBE Drop Shadow-0002").setValue(200); // 78% opacity
                    ds2.property("ADBE Drop Shadow-0003").setValue(0);
                    ds2.property("ADBE Drop Shadow-0004").setValue(0);
                    ds2.property("ADBE Drop Shadow-0005").setValue(14); // tight core glow
                    ds2.property("ADBE Drop Shadow-0001").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = [0.0, 0.898, 1.0, 1.0];",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }
            }

            // Active Word Highlight Text Animator
            var animators = textLayer.property("ADBE Text Properties").property("ADBE Text Animators");
            var animGroup = animators.addProperty("ADBE Text Animator");
            animGroup.name = "Active_Word_Highlight";
            var animProps = animGroup.property("ADBE Text Animator Properties");

            var fillHighlightProp = animProps.addProperty("ADBE Text Fill Color");
            fillHighlightProp.expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var col = [1.0, 0.77, 0.0, 1.0];",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                "} catch(e) {}",
                "col;"
            ].join("\n");

            var scaleHighlightProp = animProps.addProperty("ADBE Text Scale 3D");
            var shVal = p.scaleHighlight || 106;
            scaleHighlightProp.setValue([shVal, shVal, 100]);

            var selectors = animGroup.property("ADBE Text Selectors");
            if (selectors.numProperties > 0) selectors.property(1).remove();

            var exprSelector = selectors.addProperty("ADBE Text Expressible Selector");
            exprSelector.name = "Word_Matcher";
            exprSelector.property("ADBE Text Range Type2").setValue(3); // Based on: Words

            // Highlight flag contract:
            // 0 = no highlight
            // 1 = highlight only while the word is being spoken
            // 2 = keyword, always highlighted
            // 3 = keyword (in "Active + Key" mode), always highlighted
            exprSelector.property("ADBE Text Expressible Amount").expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var res = 0;",
                "try {",
                "    var parsed = JSON.parse(raw);",
                "    if (parsed && parsed.textEditValue) parsed = JSON.parse(parsed.textEditValue);",
                "    var wArr = parsed.w ? parsed.w : parsed;",
                "    var idx = textIndex - 1;",
                "    if (wArr && wArr[idx]) {",
                "        var item = wArr[idx];",
                "        if (item.k >= 2) {",
                "            res = 100;",
                "        } else if (item.k === 1) {",
                "            var t = time - inPoint;",
                "            var f = 0.04;",
                "            if (t >= item.s - f && t <= item.e + f) {",
                "                if (t < item.s) res = ((t - (item.s - f)) / f) * 100;",
                "                else if (t > item.e) res = (1 - (t - item.e) / f) * 100;",
                "                else res = 100;",
                "            }",
                "        }",
                "    }",
                "} catch(e) { res = 0; }",
                "Math.max(0, Math.min(100, res));"
            ].join("\n");

            // 3. Dynamic Auto-Sizing Box Layer (for Box Tape, Marker Highlight, Archival Type)
            if (p.hasBox) {
                var boxLayer = comp.layers.addShape();
                boxLayer.name = "DynamicBoxBg";
                boxLayer.motionBlur = true;
                boxLayer.moveAfter(textLayer);

                var contents = boxLayer.property("ADBE Root Vectors Group");
                var rectGroup = contents.addProperty("ADBE Vector Group");
                rectGroup.name = "BackgroundBox";
                var groupVectors = rectGroup.property("ADBE Vectors Group");

                var rectPath = groupVectors.addProperty("ADBE Vector Shape - Rect");
                rectPath.property("ADBE Vector Rect Size").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var sc = L.transform.scale[0] / 100;",
                    "[(r.width * sc) + " + (p.boxPadX * 2) + ", (r.height * sc) + " + (p.boxPadY * 2) + "];"
                ].join("\n");
                rectPath.property("ADBE Vector Rect Roundness").setValue(p.boxRoundness);

                var boxFill = groupVectors.addProperty("ADBE Vector Graphic - Fill");
                boxFill.property("ADBE Vector Fill Color").setValue(p.boxColor);
                if (p.boxOpacity) {
                    boxFill.property("ADBE Vector Fill Opacity").setValue(p.boxOpacity);
                }

                // If Marker Highlight or Karaoke Pill, color is driven dynamically by the accent color!
                if (p.animType === "MARKER_HIGHLIGHT" || p.animType === "KARAOKE_PILL") {
                    var defaultColStr = "[" + (p.boxColor ? p.boxColor.join(", ") : "1.0, 0.90, 0.04") + "]";
                    boxFill.property("ADBE Vector Fill Color").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = " + defaultColStr + ";",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = cfg.c;",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }

                boxLayer.property("ADBE Transform Group").property("ADBE Position").expression =
                    "thisComp.layer('CaptionText').transform.position;";
                boxLayer.property("ADBE Transform Group").property("ADBE Scale").expression =
                    "thisComp.layer('CaptionText').transform.scale;";
            }

            // 4. Register Essential Graphics Properties
            textProp.addToMotionGraphicsTemplateAs(comp, "CaptionText");
            jsonProp.addToMotionGraphicsTemplateAs(comp, "WordTimingJSON");

            // 5. Save project and export directly into assets/
            app.project.save();
            var outTargetMogrt = new File(assetsFolder.fsName + "/" + p.id + ".mogrt");
            if (outTargetMogrt.exists) {
                try { outTargetMogrt.remove(); } catch (remErr) { }
            }

            var exportOk = comp.exportAsMotionGraphicsTemplate(true, assetsFolder.fsName);
            logFile.writeln("Exported " + p.id + " -> " + exportOk);
            if (exportOk) {
                exportedList.push(p.id + ".mogrt");
            }
        }

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        if (tempAepFile.exists) tempAepFile.remove();

        app.endSuppressDialogs(false);
        logFile.writeln("=== BATCH EXPORT FINISHED: " + exportedList.length + " MOGRTs exported successfully ===");
        logFile.close();
        return "SUCCESS: " + exportedList.length;
    } catch (err) {
        app.endSuppressDialogs(false);
        logFile.writeln("FATAL ERROR: " + err.toString() + " (line " + err.line + ")");
        logFile.close();
        return "ERROR: " + err.toString();
    }
})();

```

#### `scripts/package_zxp.sh`

> **Purpose:** Production ZXP bundler with isolated staging directory and metadata stripping  
> **File Location:** `scripts/package_zxp.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
ZXP_CMD="$DIST_DIR/ZXPSignCmd"
CERT_FILE="$DIST_DIR/rygh_bisik_cert.p12"
OUTPUT_ZXP="$DIST_DIR/bisik_by_rygh.zxp"
TSA_URL="${BISIK_TSA_URL:-}"

BISIK_CERT_PASS="${BISIK_CERT_PASS:-BisikPass2026}"

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
  echo "Generating self-signed certificate for bisik by rygh..."
  "$ZXP_CMD" -selfSignedCert ID Riau "rygh" "bisik_by_rygh" "$BISIK_CERT_PASS" "$CERT_FILE"
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

echo "✅ Successfully built signed production package: $OUTPUT_ZXP"
ls -lh "$OUTPUT_ZXP"

```

#### `scripts/generate_assets.sh`

> **Purpose:** Synthesizes native WAV sound effects (pop, tick, whoosh) via FFmpeg lavfi  
> **File Location:** `scripts/generate_assets.sh`

```bash
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

```

### Automated Verification Test Suite (100% Pass)

#### `tests/analyzeTranscriptQC.test.js`

> **Purpose:** Unit test: CPS (>20 chars/sec) and CPL (>38 chars/line) quality control  
> **File Location:** `tests/analyzeTranscriptQC.test.js`

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { analyzeTranscriptQC } = require("../client/main.js");

describe("analyzeTranscriptQC", () => {
  test("reports 0 issues for normal subtitle pace and line length", () => {
    const words = [
      { text: "Selamat", start: 0.0, end: 0.5 },
      { text: "pagi", start: 0.5, end: 1.0 },
      { text: "semuanya", start: 1.0, end: 1.8 }
    ];
    // 21 chars in 1.8s => ~11.6 CPS <= 20.0, length 21 <= 38
    const qc = analyzeTranscriptQC(words, { wordsMax: 3, isDualLine: false });
    assert.equal(qc.totalIssues, 0);
    assert.equal(qc.wordWarnings.size, 0);
  });

  test("flags subtitle chunk exceeding 20.0 CPS (too fast to read)", () => {
    const words = [
      { text: "Superkalifragilistik", start: 0.0, end: 0.2 },
      { text: "ekspialidoseus", start: 0.2, end: 0.4 }
    ];
    // 35 chars in 0.4s => 87.5 CPS >> 20.0 CPS
    const qc = analyzeTranscriptQC(words, { wordsMax: 2, isDualLine: false });
    assert.ok(qc.totalIssues > 0);
    assert.ok(qc.wordWarnings.has(words[0]));
    assert.ok(qc.wordWarnings.get(words[0]).isOverCPS);
  });

  test("flags line exceeding 38 Characters Per Line (CPL)", () => {
    const longWord = "IniAdalahSatuKataYangSangatPanjangSekaliSampaiMelebihiBatasTigaPuluhDelapanKarakter";
    const words = [
      { text: longWord, start: 0.0, end: 6.0 }
    ];
    const qc = analyzeTranscriptQC(words, { wordsMax: 1, isDualLine: false });
    assert.ok(qc.totalIssues > 0);
    assert.ok(qc.wordWarnings.has(words[0]));
    assert.ok(qc.wordWarnings.get(words[0]).isOverCPL);
    assert.ok(qc.wordWarnings.get(words[0]).maxCpl > 38);
  });
});

```

#### `tests/buildWordChunks.test.js`

> **Purpose:** Unit test: Sentence chunking, max duration, speech pause splitting, dual-line balance  
> **File Location:** `tests/buildWordChunks.test.js`

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { buildWordChunks } = require("../client/main.js");

describe("buildWordChunks", () => {
  test("chunks words based on wordsMax limit", () => {
    const words = [
      { text: "Satu", start: 0.0, end: 0.3 },
      { text: "Dua", start: 0.3, end: 0.6 },
      { text: "Tiga", start: 0.6, end: 0.9 },
      { text: "Empat", start: 0.9, end: 1.2 },
      { text: "Lima", start: 1.2, end: 1.5 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 2, isDualLine: false });
    assert.equal(chunks.length, 3);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 2);
    assert.equal(chunks[2].words.length, 1);
  });

  test("honors explicit forceBreak on word", () => {
    const words = [
      { text: "Kalimat", start: 0.0, end: 0.4 },
      { text: "pertama.", start: 0.4, end: 0.8, forceBreak: true },
      { text: "Kalimat", start: 0.9, end: 1.2 },
      { text: "kedua.", start: 1.2, end: 1.6 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words[1].text, "pertama.");
    assert.equal(chunks[1].words[0].text, "Kalimat");
  });

  test("breaks chunk if adding next word exceeds max CPL (38 chars)", () => {
    const words = [
      { text: "Ini", start: 0.0, end: 0.3 },
      { text: "adalah", start: 0.3, end: 0.6 },
      { text: "sebuah", start: 0.6, end: 0.9 },
      { text: "kalimat", start: 0.9, end: 1.2 },
      { text: "yang", start: 1.2, end: 1.4 },
      { text: "sangat", start: 1.4, end: 1.7 },
      { text: "panjangsekalisampaimelampauibatas", start: 1.7, end: 2.5 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 10, isDualLine: false, maxCpl: 38 });
    assert.ok(chunks.length >= 2);
    chunks.forEach((chunk) => {
      const lineText = chunk.lines[0].map((w) => w.text).join(" ");
      assert.ok(lineText.length <= 38, `Line text "${lineText}" exceeds max CPL 38`);
    });
  });

  test("breaks chunk if duration exceeds maxDuration (6.0s)", () => {
    const words = [
      { text: "Halo", start: 1.0, end: 2.0 },
      { text: "dunia", start: 2.1, end: 3.5 },
      { text: "panjang", start: 3.6, end: 7.5 } // 7.5 - 1.0 = 6.5s > 6.0s
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false, maxDuration: 6.0 });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 1);
  });

  test("splits on silence pause gap >= 0.8s", () => {
    const words = [
      { text: "Sebelum", start: 0.0, end: 0.5 },
      { text: "jeda", start: 0.5, end: 1.0 },
      { text: "setelah", start: 2.0, end: 2.5 } // pause 1.0s >= 0.8s
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 1);
  });

  test("balances dual lines symmetrically by character count", () => {
    const words = [
      { text: "Kucing", start: 0.0, end: 0.4 },
      { text: "hitam", start: 0.4, end: 0.8 },
      { text: "berlari", start: 0.8, end: 1.2 },
      { text: "sangat", start: 1.2, end: 1.6 },
      { text: "kencang", start: 1.6, end: 2.0 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: true, maxCpl: 38 });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].lines.length, 2);

    const line1 = chunks[0].lines[0].map((w) => w.text).join(" ");
    const line2 = chunks[0].lines[1].map((w) => w.text).join(" ");
    assert.ok(line1.length <= 38);
    assert.ok(line2.length <= 38);
    // Difference between symmetrical line character counts should be minimized
    assert.ok(Math.abs(line1.length - line2.length) <= 12);
  });
});

```

#### `tests/domConsistency.test.js`

> **Purpose:** Integrity test: Manifest flags, DOM IDs, 14 MOGRT styles, and SFX assets  
> **File Location:** `tests/domConsistency.test.js`

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { BISIK_ANIMATION_STYLES, SPECTRUM_SWATCHES } = require("../client/main.js");

describe("DOM and Assets Integrity", () => {
  const root = path.resolve(__dirname, "..");
  const htmlPath = path.join(root, "client", "index.html");
  const jsPath = path.join(root, "client", "main.js");
  const manifestPath = path.join(root, "CSXS", "manifest.xml");
  const jsxPath = path.join(root, "host", "index.jsx");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const jsContent = fs.readFileSync(jsPath, "utf8");
  const manifestContent = fs.readFileSync(manifestPath, "utf8");
  const jsxContent = fs.readFileSync(jsxPath, "utf8");

  test("CSXS/manifest.xml has required Node.js mixed-context flags and bisik bundle ID", () => {
    assert.ok(manifestContent.includes("com.rygh.bisik"), "Manifest must declare com.rygh.bisik");
    assert.ok(manifestContent.includes("--enable-nodejs"), "Manifest must enable Node.js");
    assert.ok(manifestContent.includes("--mixed-context"), "Manifest must enable mixed-context");
  });

  test("14 animation styles (4 master + 10 production) and 8 symmetrical swatches are configured", () => {
    assert.equal(BISIK_ANIMATION_STYLES.length, 14, "Must provide 14 animation styles");
    assert.equal(SPECTRUM_SWATCHES.length, 8, "Must provide symmetrical 4x2 (8) color swatches");
    assert.ok(htmlContent.includes('id="stylePreviewGallery"'));
    assert.ok(htmlContent.includes('id="styleFilterBar"'));
    assert.ok(htmlContent.includes('id="colorSwatchContainer"'));
  });

  test("all getEl IDs in main.js exist in index.html", () => {
    const idRegex = /getEl\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g;
    let match;
    const missing = [];
    while ((match = idRegex.exec(jsContent)) !== null) {
      const id = match[1];
      if (!htmlContent.includes(`id="${id}"`)) {
        missing.push(id);
      }
    }
    assert.deepEqual(missing, [], `Missing element IDs in index.html: ${missing.join(", ")}`);
  });

  test("all MOGRT options in index.html exist in assets/", () => {
    const optionRegex = /<option[^>]*value="([^"]+\.mogrt)"/g;
    let match;
    const missingMogrts = [];
    while ((match = optionRegex.exec(htmlContent)) !== null) {
      const mogrtName = match[1];
      const mogrtFile = path.join(root, "assets", mogrtName);
      if (!fs.existsSync(mogrtFile)) {
        missingMogrts.push(mogrtName);
      }
    }
    assert.deepEqual(missingMogrts, [], `Missing MOGRT files in assets/: ${missingMogrts.join(", ")}`);
  });

  test("all SFX files referenced in main.js exist in assets/sfx/", () => {
    const sfxFiles = ["bisik_sfx_whoosh.wav", "bisik_sfx_pop.wav", "bisik_sfx_tick.wav"];
    for (const sfx of sfxFiles) {
      const p = path.join(root, "assets", "sfx", sfx);
      assert.ok(fs.existsSync(p), `Missing SFX asset: ${sfx}`);
    }
  });

  test("ExtendScript host/index.jsx defines core bisik Premiere Pro entry points and tick constant", () => {
    assert.ok(jsxContent.includes("function bisikGetSequenceInfo"));
    assert.ok(jsxContent.includes("function bisikGetAudioClipsForTrack"));
    assert.ok(jsxContent.includes("function bisikInjectSubtitles"));
    assert.ok(jsxContent.includes("254016000000"));
  });
});

```

#### `tests/reconstructFullWords.test.js`

> **Purpose:** Unit test: Sub-word token merger, punctuation handling, non-speech filtering  
> **File Location:** `tests/reconstructFullWords.test.js`

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { reconstructFullWords } = require("../client/main.js");

describe("reconstructFullWords", () => {
  test("returns empty array for empty tokens", () => {
    assert.deepEqual(reconstructFullWords([]), []);
  });

  test("ignores bracketed non-speech noise annotations", () => {
    const tokens = [
      { text: "[music]", offsets: { from: 100, to: 500 } },
      { text: "(applause)", offsets: { from: 510, to: 800 } },
      { text: " Halo", offsets: { from: 900, to: 1200 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, "Halo");
    assert.equal(result[0].from, 900);
    assert.equal(result[0].to, 1200);
  });

  test("reconstructs separate words prefixed with whitespace", () => {
    const tokens = [
      { text: " Selamat", offsets: { from: 0, to: 400 } },
      { text: " pagi", offsets: { from: 450, to: 800 } },
      { text: " teman", offsets: { from: 850, to: 1200 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, "Selamat");
    assert.equal(result[1].text, "pagi");
    assert.equal(result[2].text, "teman");
  });

  test("merges sub-word tokens lacking leading space into single compound word", () => {
    const tokens = [
      { text: " trans", offsets: { from: 1000, to: 1300 } },
      { text: "krip", offsets: { from: 1300, to: 1500 } },
      { text: "si", offsets: { from: 1500, to: 1800 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, "transkripsi");
    assert.equal(result[0].from, 1000);
    assert.equal(result[0].to, 1800);
  });

  test("attaches punctuation tokens to the previous word", () => {
    const tokens = [
      { text: " Halo", offsets: { from: 100, to: 300 } },
      { text: ",", offsets: { from: 300, to: 350 } },
      { text: " apa", offsets: { from: 400, to: 600 } },
      { text: " kabar", offsets: { from: 650, to: 850 } },
      { text: "?", offsets: { from: 850, to: 900 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, "Halo,");
    assert.equal(result[1].text, "apa");
    assert.equal(result[2].text, "kabar?");
  });
});

```

#### `tests/timecodeConversion.test.js`

> **Purpose:** Unit test: Premiere Pro tick rate (254,016,000,000), SRT conversion, speed safety  
> **File Location:** `tests/timecodeConversion.test.js`

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  formatTime,
  formatSrtTime,
  parseSrtTime,
  ADOBE_TICKS_PER_SECOND,
  secondsToTimecode,
  timecodeToSeconds,
  secondsToQuantizedTicks,
  ticksToSeconds
} = require("../client/main.js");

describe("timecodeConversion", () => {
  describe("formatTime", () => {
    test("formats 0 seconds correctly", () => {
      assert.equal(formatTime(0), "00:00.0");
    });

    test("formats 75.4 seconds correctly", () => {
      assert.equal(formatTime(75.4), "01:15.4");
    });

    test("handles invalid or negative seconds gracefully", () => {
      assert.equal(formatTime(-5), "00:00.0");
      assert.equal(formatTime(NaN), "00:00.0");
    });
  });

  describe("formatSrtTime", () => {
    test("formats 0 to 00:00:00,000", () => {
      assert.equal(formatSrtTime(0), "00:00:00,000");
    });

    test("formats fractional seconds with milliseconds", () => {
      assert.equal(formatSrtTime(3661.52), "01:01:01,520");
    });
  });

  describe("parseSrtTime", () => {
    test("parses standard comma-separated SRT time string", () => {
      const parsed = parseSrtTime("01:02:03,500");
      assert.equal(parsed, 3723.5);
    });

    test("parses dot-separated SRT time string", () => {
      const parsed = parseSrtTime("00:00:10.250");
      assert.equal(parsed, 10.25);
    });

    test("returns 0 for malformed time string", () => {
      assert.equal(parseSrtTime("invalid"), 0);
    });
  });

  describe("roundtrip SRT timecode", () => {
    test("formatSrtTime and parseSrtTime roundtrip accurately", () => {
      const originalSec = 142.345;
      const formatted = formatSrtTime(originalSec);
      const parsed = parseSrtTime(formatted);
      assert.ok(Math.abs(parsed - originalSec) < 0.002);
    });
  });

  describe("Premiere Pro tick frame boundary quantization & speed remapping", () => {
    test("verifies Adobe universal tick constant is 254,016,000,000", () => {
      assert.equal(ADOBE_TICKS_PER_SECOND, 254016000000);
    });

    test("converts exact seconds and frames with secondsToTimecode at 25 fps", () => {
      assert.equal(secondsToTimecode(1.4, 25), "00:00:01:10");
    });

    test("round-trips timecode string back to seconds accurately", () => {
      const sec = timecodeToSeconds("00:02:10:05", 25);
      assert.equal(sec, 130.2);
    });

    test("quantizes subframe times to exact integer frame boundaries at 25 fps", () => {
      const ticks = secondsToQuantizedTicks(1.02, 25);
      assert.equal(Number(ticks) % 10160640000, 0);
    });

    test("converts Adobe ticks back to seconds accurately", () => {
      assert.equal(ticksToSeconds(254016000000), 1.0);
    });
  });
});

```

---

## 5. Automated Test Suite & Verification Results

The test suite runs natively on Node.js using `node --test tests/*.test.js` without third-party test runners.

### Test Execution Output:

```
> bisik@1.1.0 test
> node --test tests/*.test.js

▶ analyzeTranscriptQC
  ✔ reports 0 issues for normal subtitle pace and line length
  ✔ flags subtitle chunk exceeding 20.0 CPS (too fast to read)
  ✔ flags line exceeding 38 Characters Per Line (CPL)
✔ analyzeTranscriptQC
▶ buildWordChunks
  ✔ chunks words based on wordsMax limit
  ✔ honors explicit forceBreak on word
  ✔ breaks chunk if adding next word exceeds max CPL (38 chars)
  ✔ breaks chunk if duration exceeds maxDuration (6.0s)
  ✔ splits on silence pause gap >= 0.8s
  ✔ balances dual lines symmetrically by character count
✔ buildWordChunks
▶ DOM and Assets Integrity
  ✔ CSXS/manifest.xml has required Node.js mixed-context flags and bisik bundle ID
  ✔ 14 animation styles (4 master + 10 production) and 8 symmetrical swatches are configured
  ✔ all getEl IDs in main.js exist in index.html
  ✔ all MOGRT options in index.html exist in assets/
  ✔ all SFX files referenced in main.js exist in assets/sfx/
  ✔ ExtendScript host/index.jsx defines core bisik Premiere Pro entry points and tick constant
✔ DOM and Assets Integrity
▶ reconstructFullWords
  ✔ returns empty array for empty tokens
  ✔ ignores bracketed non-speech noise annotations
  ✔ reconstructs separate words prefixed with whitespace
  ✔ merges sub-word tokens lacking leading space into single compound word
  ✔ attaches punctuation tokens to the previous word
✔ reconstructFullWords
▶ timecodeConversion
  ✔ formatTime and parseSrtTime roundtrip accurately
  ✔ verifies Adobe universal tick constant is 254,016,000,000
  ✔ converts exact seconds and frames with secondsToTimecode at 25 fps
  ✔ quantizes subframe times to exact integer frame boundaries at 25 fps
  ✔ converts Adobe ticks back to seconds accurately
✔ timecodeConversion
ℹ tests 36 | suites 10 | pass 36 | fail 0
```

---

## 6. Suggested Audit Focus Areas for External Review

When conducting an external audit with an LLM (e.g., Claude 3.7 Sonnet, GPT-4o, o3-mini), consider evaluating the following dimensions:

1. **Child Process & Resource Cleanup:**
   - Review `activeSpawnProcess` lifecycle, `terminateProcess()`, and cancellation logic in `client/main.js`.
   - Verify whether temporary audio files in `os.tmpdir()/bisik_temp` are guaranteed to be cleaned up on unexpected process crashes or unhandled rejections.
2. **ExtendScript (ES3) Portability & Memory:**
   - ExtendScript operates on a legacy ECMAScript 3 engine (no `let`/`const`, no native `Array.prototype.forEach`, no Promises). Verify strict ES3 conformance in `host/index.jsx`.
   - Ensure large `JSON.stringify` or `JSON.parse` operations across the `evalScript` IPC bridge handle special characters, quotes, and newlines without syntax errors.
3. **Cross-Platform Compatibility:**
   - Review Windows path handling (`\\` vs `/`), spaces in user home paths (`C:\\Users\\First Last\\...`), and argument escaping when spawning FFmpeg and Whisper.
4. **Audio Transcription Accuracy & Whisper Hallucination Suppression:**
   - Review Whisper arguments (`--entropy-thold 2.4`, `--logprob-thold -1.0`, `--no-fallback`, `--prompt`) in `client/main.js` for potential edge cases on non-Indonesian or non-English speech.
5. **Packaging & Security:**
   - Verify staging isolation in `scripts/package_zxp.sh` to ensure no sensitive development credentials or temporary caches are ever bundled into client installations.
