# Architectural Roadmap: CEP to UXP Migration

## Executive Summary
**bisik by rygh** currently operates on Adobe's **Common Extensibility Platform (CEP 11+)**, leveraging:
- Chromium Embedded Framework (CEF) for modern HTML5/CSS/JavaScript UI.
- Node.js mixed-context runtime for fast filesystem access, child process execution (`ffmpeg`, `whisper-cli`), and binary WAV header parsing.
- ExtendScript (ECMAScript 3 engine) for deep integration with Premiere Pro project items, sequence tracks, playhead synchronization, and Motion Graphics Template (`importMGT`) injection.

---

## The Landscape: CEP vs. UXP

### 1. CEP Status & Longevity
- CEP is in maintenance mode across Adobe Creative Cloud applications.
- While fully supported in Premiere Pro 2024, 2025, and 2026, Adobe has signaled the long-term transition of all video apps to **UXP (Unified Extensibility Platform)**.
- **bisik v1.1.0** has been hardened to eliminate legacy incompatibilities, remove deprecated Node APIs (`fs.rmSync`), avoid non-standard ES features, and prevent memory leaks.

### 2. UXP for Premiere Pro Capabilities & Gaps
- UXP replaces CEP with modern JavaScript (V8), native OS windows, standard Web APIs, and promises.
- **Current Limitation in Premiere Pro UXP:** Full Motion Graphics Template (`.mogrt`) automation, custom Essential Graphics property injection (`WordTimingJSON`), and sample-accurate audio track timeline manipulation APIs are still maturing in UXP compared to ExtendScript's robust `importMGT` and `TrackItem.getMGTComponent()`.
- Prematurely migrating to UXP today would restrict MOGRT property injection and timeline automation capabilities that are essential to `bisik`.

---

## Migration Strategy (v2.0 Milestone)

1. **Decoupled Architecture:**
   - Pure logic functions (`buildWordChunks`, `analyzeTranscriptQC`, `reconstructFullWords`, `mapMasterToTimeline`, `validateTranscriptWords`, `readWavDurationSec`) are completely independent of CEP/DOM and already covered by 100% automated unit tests.
   - These modules will transition directly into a shared core npm module.

2. **Backend Engine Abstraction:**
   - In UXP, child process execution is governed by tighter security boundaries. Local CLI execution (`whisper-cli`, `ffmpeg`) will be encapsulated behind an abstraction layer that can either communicate with a lightweight local companion daemon or native UXP plugins once Adobe exposes native binary execution.

3. **Timeline Host Bridge:**
   - As Premiere Pro's UXP team releases native MOGRT and sequence manipulation APIs, the host bridge will be ported from ExtendScript (`host/index.jsx`) to UXP JavaScript (`host/index.js`), maintaining 1:1 parameter symmetry with `bisikInsertPayload` and `bisikGetTrackClips`.

