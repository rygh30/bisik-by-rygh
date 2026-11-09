# bisik by rygh v1.1.0 — Hybrid Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the v1.1.0 Master Blueprint (10 live CSS animated preview styles, symmetrical 4×2 color palette, atempo speed-remapping, and frame tick quantization) into the existing bisik codebase while preserving the real FFmpeg/Whisper AI transcription engine, preset manager, range mode selection, and subtitle export utilities.

**Architecture:** A hybrid fusion architecture where the modern Animation Composer-inspired UI and preview gallery from the blueprint are mounted on top of the tested asynchronous Node.js background worker (`ffmpeg` + `whisper-cli`) and ExtendScript Premiere Pro bridge, with safe URI-encoded IPC and valid binary MOGRT packages.

**Tech Stack:** Adobe CEP 11.0, HTML5/CSS3 Keyframe Animations, Vanilla JavaScript (ES6+ / Node.js in CEF), ExtendScript (ES3), FFmpeg, Whisper.cpp (`whisper-cli`), Adobe Universal Ticks ($254,016,000,000\text{ ticks/s}$).

**Spec:** [docs/ARCHITECTURE.md](file:///Users/reygha/Projects/bisik-by-rygh/docs/ARCHITECTURE.md) and User Master Blueprint (v1.1.0).

## Global Constraints
- Zero breaking changes to transcription and timeline rendering: `ffmpeg` extraction, silence bridging, dynamic CPU thread allocation, and `whisper-cli` token parsing must remain fully operational.
- All MOGRT files in `assets/` must be valid binary zip archives containing `project.aegraphic` to prevent Premiere Pro `seq.importMGT()` failures.
- Dual compatibility for ExtendScript entry points: support both `bisikInjectSubtitles` and legacy `insertBisikClips`, `bisikGetSequenceInfo` and `getSequenceTracksInfo`.
- 100% automated test pass rate across `tests/*.test.js` with `node --test`.

## Review Focus
1. Speed-remapped clips audio pitch/duration: Verify that `buildAtmpoFilterChain` correctly chains `atempo` when `speedRatio != 1.0`.
2. MOGRT validity: Ensure all 10 MOGRT files on disk in `assets/` can be read and unpacked without missing `project.aegraphic`.
3. DOM element consistency: Verify that no element IDs required by `client/main.js` are missing from `client/index.html`.
4. Preset and settings migration: Ensure existing settings/presets continue to load without crash when new styles are selected.
5. Large sequence memory and temp file cleanup: Verify temporary WAV and JSON files are properly purged in finally blocks.

---

### Task 1: Generate & Validate 10 Production MOGRT Assets (`assets/`)

**Files:**
- Modify: `assets/bisik_*.mogrt` (generate 6 new styles: `Cut_Accent`, `Box_Tape`, `Vox_Highlighter`, `Netflix_Doc`, `Archival_Type`, `Editorial_Serif`, `Minimal_Fade`)
- Create: `scripts/generate_assets.sh`
- Modify: `scripts/build_bisik_mogrt.jsx`
- Test: `tests/domConsistency.test.js`

**Interfaces:**
- Produces: 10 valid MOGRT files in `assets/` each containing `definition.json` and `project.aegraphic`.

- [ ] **Step 1: Write test for all 10 MOGRTs in `tests/domConsistency.test.js`**
Ensure test verifies that all 10 MOGRTs specified in `BISIK_ANIMATION_STYLES` exist on disk and have valid zip structures with `definition.json`.

- [ ] **Step 2: Run test to verify failure before generating assets**
Run: `node --test tests/domConsistency.test.js`
Expected: FAIL due to missing new MOGRT files.

- [ ] **Step 3: Implement asset generation script and create all 10 valid MOGRTs**
Create valid MOGRT packages for the 6 new styles using the After Effects template structure with updated `definition.json` and `capsuleName`, synthesize SFX WAV files if missing, and update `scripts/build_bisik_mogrt.jsx` for AE batch export.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/domConsistency.test.js`
Expected: PASS with 10 MOGRT files detected.

- [ ] **Step 5: Commit**
```bash
git add assets/ scripts/ tests/
git commit -m "feat(assets): add 10 valid MOGRT animation packages and batch generator"
```

---

### Task 2: Enhance ExtendScript Premiere Pro Automation Engine (`host/index.jsx`)

**Files:**
- Modify: `host/index.jsx`
- Test: `tests/domConsistency.test.js`

**Interfaces:**
- Consumes: URI-encoded JSON payload from CEP client.
- Produces: Quantized timeline TrackItems and SFX audio clips in Premiere Pro.

- [ ] **Step 1: Write test for ExtendScript functions in `tests/domConsistency.test.js`**
Verify `host/index.jsx` exports `bisikQuantizeSecondsToTicks`, `bisikInjectSubtitles`, `bisikGetSequenceInfo`, `bisikGetAudioClipsForTrack`, and `254016000000`.

- [ ] **Step 2: Run test to verify failure**
Run: `node --test tests/domConsistency.test.js`
Expected: FAIL if new function signatures are missing.

- [ ] **Step 3: Implement quantized tick calculation, speed-remap detection, and URI decoding in `host/index.jsx`**
Add `bisikQuantizeSecondsToTicks(seconds, ticksPerFrame)`, update `bisikInjectSubtitles` to decode `decodeURIComponent(encodedJsonPayload)`, add `speedRatio` calculation to `getTrackAudioClipsByRange` / `bisikGetAudioClipsForTrack`, and maintain backward compatibility aliases.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/domConsistency.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add host/index.jsx tests/
git commit -m "feat(host): add tick frame quantization, speed remap detection, and safe URI payload decoding"
```

---

### Task 3: Modernize Panel Interface (`client/index.html`)

**Files:**
- Modify: `client/index.html`
- Test: `tests/domConsistency.test.js`

**Interfaces:**
- Consumes: CSS variables `--preview-accent`, `--bg-stage`, Adobe Spectrum themes.
- Produces: Animation Composer preview gallery cards, symmetrical 4×2 swatch buttons, and integrated workflow controls.

- [ ] **Step 1: Write test for new DOM structure in `tests/domConsistency.test.js`**
Assert presence of `#stylePreviewGallery`, `#styleFilterBar`, `#colorSwatchContainer`, and existing controls `#rangeModeInOut`, `#btnExportSRT`, `#btnClearTrack`.

- [ ] **Step 2: Run test to verify failure**
Run: `node --test tests/domConsistency.test.js`
Expected: FAIL for missing DOM elements.

- [ ] **Step 3: Implement new UI layout in `client/index.html`**
Integrate the 10-style CSS keyframe preview gallery, category filter bar, symmetrical 4×2 swatch grid, while seamlessly embedding Range Mode selector, Preset controls, Clear Track, and Subtitle export actions.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/domConsistency.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add client/index.html tests/
git commit -m "feat(ui): add animation composer style gallery and symmetrical 4x2 color picker"
```

---

### Task 4: Upgrade Core Client Engine & Pure Algorithms (`client/main.js`)

**Files:**
- Modify: `client/main.js`
- Test: `tests/timecodeConversion.test.js`

**Interfaces:**
- Consumes: FFmpeg, Whisper-cli, CSInterface, `SPECTRUM_SWATCHES`, `BISIK_ANIMATION_STYLES`.
- Produces: Audio extraction with `atempo` speed compensation, transcript chunking, live preview gallery interaction, and URI-encoded timeline injection.

- [ ] **Step 1: Write unit tests for `buildAtmpoFilterChain` and `BISIK_ANIMATION_STYLES` in `tests/timecodeConversion.test.js`**
Test `buildAtmpoFilterChain(1.0)` returns null, `buildAtmpoFilterChain(4.0)` returns chained filters, and timecode roundtrip.

- [ ] **Step 2: Run test to verify failure**
Run: `node --test tests/timecodeConversion.test.js`
Expected: FAIL (function not yet defined).

- [ ] **Step 3: Implement `buildAtmpoFilterChain`, 10 styles, 8 swatches, and live preview binding in `client/main.js`**
Integrate `SPECTRUM_SWATCHES`, `BISIK_ANIMATION_STYLES`, live CSS preview rendering, category filtering, `atempo` audio filter chaining in FFmpeg extraction, and `encodeURIComponent` payload generation for `bisikInjectSubtitles`. Retain all existing background processing, CTI polling, and preset management.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/timecodeConversion.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add client/main.js tests/
git commit -m "feat(client): integrate 10-style preview controller and atempo speed-remapping pipeline"
```

---

### Task 5: Run Full Test Suite Verification

**Files:**
- Modify: `tests/*.test.js` (sync any constants or exports)

- [ ] **Step 1: Execute all test suites**
Run: `npm test`
Expected: 28/28 tests passing.

- [ ] **Step 2: Verify zero regression in transcript chunking, QC, or word reconstruction**
Run: `node --test tests/analyzeTranscriptQC.test.js tests/buildWordChunks.test.js tests/reconstructFullWords.test.js`
Expected: All suites PASS with 0 warnings.

- [ ] **Step 3: Commit**
```bash
git add tests/
git commit -m "test: verify complete test suite for v1.1.0 hybrid integration"
```

---

### Task 6: Packaging, Manifest Version Bump, & Documentation Update

**Files:**
- Modify: `package.json` (bump to 1.1.0)
- Modify: `CSXS/manifest.xml` (bump to 1.1.0)
- Modify: `scripts/package_zxp.sh`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/REBUILD_GUIDE.md`
- Modify: `docs/index.html`

- [ ] **Step 1: Bump version numbers and update documentation**
Update version to 1.1.0 in `package.json` and `manifest.xml`. Document the 10 styles, 4x2 palette, and `atempo` speed-remapping in `docs/ARCHITECTURE.md` and `docs/REBUILD_GUIDE.md`.

- [ ] **Step 2: Run packaging script**
Run: `bash scripts/package_zxp.sh`
Expected: Clean build of `dist/bisik_by_rygh.zxp`.

- [ ] **Step 3: Commit**
```bash
git add package.json CSXS/manifest.xml scripts/package_zxp.sh docs/ dist/
git commit -m "chore(release): bump to v1.1.0 with 10 MOGRT styles and packaged ZXP"
```

