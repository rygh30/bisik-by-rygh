# Bisik by Rygh - Major Release Rollout Record & Mitigation Log
**Release Version:** 1.1.1  
**Timestamp:** 2026-11-11  
**Target Hosts:** Adobe Premiere Pro 2022-2026+ (macOS Apple Silicon, macOS Intel x86_64, Windows 10/11 x64)

---

## 1. Major Architectural Updates

### A. 4D Vector Expression Fix for MOGRT Presets
* **Issue:** After Effects shape fill color (`ADBE Vector Fill Color`) requires a 4-dimensional array `[r, g, b, alpha]`. Previous 3-element return caused AE runtime expression failure, falling back to pure red (`#FF0000`).
* **Fix:** Updated all 21 preset generator expressions to return `[cfg.bc[0], cfg.bc[1], cfg.bc[2], 1.0]`. All 21 `.mogrt` files rebuilt and verified in Premiere Pro.

### B. Recent Fonts (5 MRU Slots) & Local OS System Font Scanning
* **Issue:** User requested removal of static recommended fonts, replaced with an active 5-font Recent section and local OS client font scanning.
* **Fix:** 
  - Implemented 5 Recent Fonts with Most-Recently-Used (MRU) eviction.
  - Automatically moves last-used font to position #1.
  - Dynamically scans installed local system fonts via Cocoa `NSFontManager` (macOS) and Windows Registry (`HKLM`/`HKCU` on Windows).
  - Preserved across sessions via `localStorage` and `settings.json`.

### C. Whisper AI Capability Probing (stderr/stdout Merging)
* **Issue:** `whisper-cli --help` outputs to `stderr` with exit code 0. `execSync` capturing only `stdout` produced an empty string, disabling `-ml 1`, `-sow`, `-mc 0`, `-ojf`.
* **Fix:** Updated `probeWhisperCapabilities` to use `spawnSync` capturing combined stdout + stderr. True word-level timestamps and anti-hallucination flags are now guaranteed active.

### D. Transcribe Error & Null Safety
* **Issue:** Early throws before `createJob()` left `job` null, causing `job.cancelled` and `job.dir` in `catch`/`finally` to throw `TypeError`.
* **Fix:** Added null-safety checks: `if (job && !job.cancelled)` and `if (job && job.dir)`.

### E. Settings Persistence on Track Refresh
* **Issue:** `loadTracks()` called `loadAppSettings()` unconditionally, reverting user choices for dropdowns that lacked immediate `change` listeners.
* **Fix:** Attached `change` event listeners to `wordsPerClip`, `posPreset`, `highlightMode`, `langSelect`, `chkDualLine`, `styleSelect`, and `videoTrackSelect`. Restricted `loadAppSettings()` invocation to initial startup.

### F. Clean-Cut Natural Sentence Chunking & CPL Unification
* **Issue:** UI slider defaulted to 5 words, overriding Clean Cut documentary phrases. Single-word phrases were split into 2 lines.
* **Fix:** 
  - Standardized CPL to 34 characters.
  - Clean Cut defaults to 8–12 words / 5s unless explicitly overridden by user.
  - Short sentences (<= 34 chars and <= 6 words) remain on 1 clean line.

---

## 2. Verification Checklist

| Check | Expected Result | Verified |
|---|---|---|
| `npm test` | 97 passed, 0 failed (27 suites) | YES |
| Live CEP Panel (PPro 2026) | Port 8088 CDP responsive | YES |
| 5 Recent Fonts | Top of list, MRU rotation | YES |
| System Fonts Scan | 235+ fonts detected locally | YES |
| Program Monitor Rendering | Yellow/Cyan/custom box renders authentic color | YES |

---

## 3. Rollback Guide (If Rollout Issues Occur)

In the event of an unexpected regression on customer machines:

### Step 1: Git Rollback to Pre-Patch Checkpoint
```bash
# To rollback to the stable state prior to this patch:
git checkout HEAD~1 -- client/main.js client/index.html
npm test
```

### Step 2: Clean Cache and Re-link Extension
```bash
# macOS CEP reload:
rm -rf "$HOME/Library/Caches/CSXS/cep_cache/PPRO_26"*
killall "Adobe Premiere Pro 2026"
open -a "Adobe Premiere Pro 2026"
```

### Step 3: Verify Standalone Tests
```bash
npm test
```
