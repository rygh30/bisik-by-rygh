# Changelog

All notable changes to the Bisik by Rygh Adobe Premiere Pro extension are documented in this file.

## [1.1.1] - 2026-11-11

### Added
- **Recent Fonts (5 MRU slots):** Most recently used font automatically moves to top position with zero duplicates and FIFO/LRU eviction of the 6th item.
- **Local Client Font Scanning:** Dynamically scans local system fonts on client machines via Cocoa `NSFontManager` (macOS) and Windows Registry (Windows), displaying live native previews.
- **Whisper AI Capabilities Probing:** Enhanced `probeWhisperCapabilities` with stderr/stdout capturing to guarantee true word-level `-ml 1`, `-sow`, `-mc 0`, `-ojf` decoding flags.
- **Immediate Settings Persistence:** Added live `change` listeners on all dropdowns (`wordsPerClip`, `posPreset`, `highlightMode`, `langSelect`, `chkDualLine`, `videoTrackSelect`) to persist immediately without resetting on Refresh.
- **Natural Clean-Cut Sentence Chunking:** Clean Cut defaults to 8–12 words / 5s sentences, strictly bounded by 34 CPL. Short clean-cut sentences (<= 34 chars) stay on a single line unless Two-Line is checked.

### Fixed
- **MOGRT Font Selection Unlocked:** Unlocked `capPropFontEdit`, `capPropFontFauxStyleEdit`, and `capPropFontSizeEdit` across all 21 MOGRT templates, enabling native Premiere Pro Essential Graphics font customization.
- **Smart PostScript Font Normalization:** Added `resolvePostScriptName` and optical size parsing (`\d+pt`) for Windows Registry and macOS system fonts (e.g. Inter 24pt, Inter 18pt SemiBold), preventing fallback to Arial Black.
- **MOGRT Expression Fallback Protection:** Removed aggressive initial fallback latching in After Effects source text expression, broadening `fVariants` to support optical size and font weights.
- **MOGRT Shape Fill 4D Vector:** Fixed `ADBE Vector Fill Color` expression in `scripts/generate_caption_presets.jsx` from 3D `[r, g, b]` to 4D `[r, g, b, 1.0]`. Resolved red fallback glitch on rendered boxes. Rebuilt all 21 MOGRTs.
- **Transcribe Null Safety:** Fixed potential `TypeError` in `catch` and `finally` blocks when validation throws before `createJob()`.
- **Character Per Line (CPL) Standard:** Unified default line chunking to 34 characters per line matching After Effects MOGRT text wrap limits.
- **Custom Dropdown CEF Alignment:** Unified Find/Replace inputs and Replace All button height to `var(--control-h-sm)` (28px).
- **Word Input Canvas Measurement:** Dynamic chip input auto-sizing prevents word clipping across varying screen DPIs.

## [1.1.0] - 2026-11-08

### Added
- 21 schema-driven animation styles with categorized filtering and animated thumbnail previews.
- Photoshop Color Picker integration with Spectrum Quick Palette swatches.
- Multi-track timeline collision detection and smart track auto-selection.
- Multi-platform packaging scripts for macOS Apple Silicon, macOS Intel, and Windows.

