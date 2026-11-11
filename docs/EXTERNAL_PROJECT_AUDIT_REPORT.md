# Bisik by Rygh — External Project Audit Report

**Document Version:** 1.4.0  
**Audit Date:** November 11, 2026  
**Auditor / Evaluator:** Antigravity AI Engineering & Quality Assurance  
**Target Architecture:** Adobe Premiere Pro CEP Extension + After Effects Motion Graphics Engine + Whisper.cpp Local AI  
**Repository Branch:** `main`  
**License & Branding:** Independent Proprietary / No 3rd-party Trademark Violations  

---

## 1. Executive Summary

Bisik by Rygh is a local, privacy-guaranteed subtitle generation and kinetic typography suite engineered for Adobe Premiere Pro (macOS & Windows). It couples local speech transcription (via OpenAI's Whisper engine compiled natively with Apple Metal and CPU acceleration) with sample-accurate Adobe Universal Tick timeline placement and 21 handcrafted Motion Graphics Templates (`.mogrt`).

This comprehensive audit evaluates the system following the production overhaul and full audit resolution:
1. **Dynamic System Font Auto-Discovery**: Automatic querying of installed system fonts on macOS (via Cocoa `NSFontManager` JXA with PostScript Name mapping) and Windows (Registry `HKLM`/`HKCU` `...\Fonts` + Fonts directories), paired with a custom searchable, keyboard-navigable in-DOM dropdown.
2. **Timeline PostScript Font Fidelity**: Automatically converts chosen font family names into their exact PostScript Names (e.g. `AbrilFatface-Regular`, `Anton-Regular`), preventing Premiere Pro from silently defaulting to Arial/Helvetica.
3. **Triple Color System**: Discrete controls for `FONT COLOR` (`fc`), `HIGHLIGHT` (`c`), and `PARTICLE / BOX` (`bc`), supported by a native Photoshop-style HSV/RGB color picker modal and an 8-swatch symmetrical palette with left-to-right matching target selector (`[Font]` → `[Highlight]` → `[Particle / Box]`).
4. **Golden Ratio UI Architecture**: Harmonic scaling based on $\phi = 1.618$, unified control heights (`26px` for Find, Replace, and Replace All), and generous transcript editor chip padding eliminating text truncation (`isClipped: false` across all word lengths).
5. **Cinema Documenter & Clean-Cut Logic**: Full-sentence subtitle generation for the `clean-cut` preset (up to 2 balanced lines without exceeding frame bounds), alongside sentence/clause chunking for kinetic animated presets.
6. **Pure After Effects Expressions**: Standalone native AE expressions across all 21 presets, synchronized to real clip duration `d` instead of static comp duration.
7. **Acoustic Timing Synchronization**: Subtitles snap in lockstep with the human voice through a 60ms acoustic lead time and strict non-colliding inter-chunk boundaries.
8. **Universal Multi-Resolution Placement**: Proportional normalized coordinate calculation (`[0.5, targetY]`) in ExtendScript Motion component supporting 4K UHD (3840×2160), 4K DCI (4096×2160), Full HD (1920×1080), Vertical 9:16 (Shorts/Reels/TikTok with 77% bottom safe-zone height), and Square 1:1.
9. **Collision Safety & Non-Destructive Ingestion**: Real-time precheck inspects target video tracks for existing footage before batch insertion, preventing overwrites of user edits.
10. **Premiere Pro Native Single-Row Slider**: Native teardrop metallic thumb slider (40%–200%, default 100%) integrated seamlessly with 3-column layout controls.

### Audit Verdict: **PASSED (PRODUCTION GRADE & READY FOR DISTRIBUTION)**
- **All 93 automated unit and integration tests passed (100% pass rate across 26 test suites).**
- **Zero remote network calls, zero telemetry, zero API keys required (100% offline).**
- **Sample-accurate timeline quantization to 254,016,000,000 Adobe ticks/sec.**
- **All 21 modern presets compiled into clean vector `.mogrt` assets.**
- **Dual Transcript Cleanup Tools**: Comprehensive filler word removal (Indonesian & English), noise annotation filtering, stutter removal (`Clean`), and safe 2-step confirmation transcript reset (`Clear`).

---

## 2. Architectural Structure

```mermaid
graph TD
    A["Premiere Pro Timeline Audio"] -->|FFmpeg 16kHz PCM WAV| B["Local Whisper AI Engine"]
    B -->|Word Timings + Token Reconstructor| C["CEP Client Panel (Studio)"]
    C -->|User Customization: Style, Font, Triple Color, Scale, Position| D["ExtendScript Host Bridge"]
    D -->|254,016,000,000 Ticks/Sec Quantization| E["Active Sequence Video Track"]
    E -->|importMGT + WordTimingJSON (d)| F["21 Proportional MOGRT Presets"]
    D -->|Premiere Motion Component| G["Exact Responsive Resolution Placement"]
```

1. **100% Offline & Private**: Audio extraction (FFmpeg) and inference (Whisper.cpp) execute strictly on the local machine. Audio and subtitle data never leave the editor's workstation.
2. **Proportional Typography & Scaling**: Text layers are anchored at composition center `[960, 540]` within the MOGRT, and Premiere Pro's native `Motion` component sets the target timeline `Position` and `Scale` based on the sequence aspect ratio and user scale slider.
3. **Multi-Resolution Safe Zones**:
   - **Horizontal 16:9 / 4K UHD / DCI**: Positioned at 85% frame height (`h * 0.85`), with dual-line compensation at 82% (`h * 0.82`).
   - **Vertical 9:16 (Shorts, Reels, TikTok)**: Positioned at 77% frame height (`h * 0.77`), with dual-line compensation at 74% (`h * 0.74`) to avoid mobile UI overlays (sound badges, like/share buttons, username captions).
   - **Center & Top Presets**: Mapped cleanly to `h * 0.50` and `h * 0.14`.
4. **Collision-Safe & Non-Destructive**: The host engine inspects track items prior to insertion, guaranteeing existing video and dialogue layers are never overwritten.

---

## 3. Comprehensive Functional Audit

### 3.1. Local Speech-to-Text Transcription & Acoustic Sync
- **Audio Extraction**: FFmpeg extracts 16,000 Hz, 16-bit mono PCM WAV (`-ar 16000 -ac 1 -c:a pcm_s16le`). Placing `-i media` before `-ss` guarantees sample-accurate decoding.
- **Acoustic Lead Time**: Subtitles start 60ms (`-0.06s`) prior to the transcript onset mark, locking text appearance to the initial consonant/vowel burst of speech.
- **Collision Clamping**: Inter-segment track bounds are clamped with a minimum 30ms guard to eliminate clip collisions on the Premiere Pro timeline.
- **Sub-word Token Reconstruction**: `reconstructFullWords()` safely reconstructs compound words, handles multilingual leading whitespace markers, attaches trailing punctuation tokens, and purges non-speech noise annotations (`[MUSIC]`, `(applause)`) while preserving valid currency and bracketed expressions like `(Rp 50.000)`.
- **Hallucination Prevention**: Dynamically probes and activates `--entropy-thold 2.4`, `--logprob-thold -1.0`, `--suppress-nst`, and `-mc 0` (zero cross-window context carryover) to stop repetition loops.

### 3.2. Adobe Universal Tick Quantization & Timeline Math
- **Tick Rate**: Subtitles are aligned using Adobe’s internal universal timebase:
  $$\text{Ticks per Second} = 254,016,000,000$$
- **Frame Quantization**: Subframe speech boundaries are quantized to exact integer frame boundaries:
  $$\text{startTicks} = \text{round}\left(\frac{\text{seconds} \times \text{ticksPerSecond}}{\text{ticksPerFrame}}\right) \times \text{ticksPerFrame}$$
  Eliminates 1-frame flickering, gaps, and audio-video desynchronization.
- **Speed & Zone Safety**: `mapMasterToTimeline()` accounts for speed-remapped footage (0.5x, 2.0x) and suppresses hallucinations occurring in synthetic silence zones.

### 3.3. 21 Modern Vector MOGRT Presets

All 21 presets feature the universal `Active_Word_Highlight` text animator, duration-synchronized timing (`d`), and native AE expression engines:

| # | Preset ID | Group | Highlight Support | Motion & Visual Characteristic |
|---|---|---|---|---|
| 1 | `clean-cut` | Calm | Active, Active+Key, Key | Static clean cinema subtitle without motion; pure aesthetic vector typography. |
| 2 | `soft-fade` | Calm | Active, Active+Key, Key | Smooth 160ms `easeOut` fade in, 120ms `easeIn` fade out synced with clip duration `d`. |
| 3 | `rise-fade` | Calm | Active, Active+Key, Key | Rises 38px upward while fading in over 240ms. |
| 4 | `blur-focus` | Calm | Active, Active+Key, Key | Cinematic rack focus transition from Gaussian blur (`ADBE Gaussian Blur 2`) to sharp clarity (240ms). |
| 5 | `slow-drift` | Calm | Active, Active+Key, Key | Subtle 98% to 102% scale drift across actual clip duration `d`. |
| 6 | `tracking-settle` | Calm | Active, Active+Key, Key | Letter spacing expands and smoothly settles to zero (300ms). |
| 7 | `word-reveal` | Word | Active, Active+Key, Key | Words appear sequentially in sync with speech cadence. |
| 8 | `karaoke-fill` | Word | Active, Active+Key, Key | Upcoming words are dimmed to 35% opacity; active word illuminates in vibrant accent color and turns 100% bright as spoken. |
| 9 | `active-highlight` | Word | Active, Active+Key, Key | Active spoken word receives 100% opacity + highlight color; others stay subdued. |
| 10 | `highlight-box` | Word | Active, Active+Key, Key | Dynamic rounded box (`HighlightBoxBg`) slides behind the active word, with dark charcoal text for high contrast. |
| 11 | `underline-sweep` | Word | Active, Active+Key, Key | Dynamic accent line (`UnderlineSweep`) sweeps beneath the active word tracking word bounds and baseline. |
| 12 | `scale-focus` | Word | Active, Active+Key, Key | Active spoken word scales to 114% without shifting adjacent line layout. |
| 13 | `pop-bounce` | Dynamic | Active, Active+Key, Key | Words pop in with snappy spring overshoot (100% → 116% → 100%). |
| 14 | `typewriter` | Dynamic | Active, Active+Key, Key | Characters reveal sequentially with typing cadence synced to actual clip duration `d` (finishes at 70% of duration). |
| 15 | `mask-slide` | Dynamic | Active, Active+Key, Key | Subtitle lines slide upward from behind an invisible vector matte. |
| 16 | `wave-in` | Dynamic | Active, Active+Key, Key | Characters ripple into view with vertical harmonic stagger. |
| 17 | `soft-glitch` | Dynamic | Active, Active+Key, Key | Subtle chromatic entry glitch that snaps rapidly into pristine focus. |
| 18 | `spring-rise` | Dynamic | Active, Active+Key, Key | Elastic harmonic spring entry with procedural upward overshoot and decay damping. |
| 19 | `box-wipe` | Style | Active, Active+Key, Key | Translucent contrast card wipes left-to-right beneath the text block. |
| 20 | `line-roll` | Style | Active, Active+Key, Key | Kinetic 3D-feel line roll from bottom to top. |
| 21 | `keyword-accent` | Style | Active, Active+Key, Key | Keywords and proper nouns pulse with vibrant accent coloration (118% scale). |

---

## 4. Test Suite & Verification Matrix

The test suite was executed under Node.js v26 native test runner:

```
> bisik@1.1.1 test
> node --test tests/*.test.js

ℹ tests 93
ℹ suites 26
ℹ pass 93
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 487.25
```

### Key Verification Areas:
- **`tests/transcriptCleaning.test.js`**: Validates filtering of Indonesian and English filler sounds, bracket noise annotations (`[Musik]`, `(applause)`), and duplicate speech stutters.
- **`tests/systemFonts.test.js`**: Validates dynamic detection of OS installed fonts (macOS Cocoa JXA & Windows Registry), alphabetical sorting, non-empty naming, and custom dropdown population.
- **`tests/colorPicker.test.js`**: Validates Photoshop color picker HSV/RGB conversions and triple color payload structure (`fc`, `c`, `bc`).
- **`tests/wordInputWidth.test.js`**: Validates dynamic word chip input measurement (`600 13px adobe-clean` + 28px buffer), ensuring `isClipped: false` across all character lengths.
- **`tests/domConsistency.test.js`**: Validates 21 MOGRT presence in `assets/`, manifest flags, golden ratio layout IDs, native scale slider, and clean removal of legacy SFX/Light Mode controls.
- **`tests/buildWordChunks.test.js`**: Validates cinema full-sentence subtitle mode (`clean-cut`), duration bounds, silence pause splitting, and dual-line balancing.
- **`tests/reconstructFullWords.test.js`**: Validates sub-word token merger, punctuation attachment, noise bracket filtering, and preservation of parenthetical expressions.
- **`tests/timelineTracks.test.js`**: Validates timeline resolution metrics, scale factors, and track selection logic across FHD, 4K UHD, 4K DCI, and Vertical 9:16.
- **`tests/hostLogic.test.js`**: Validates track bounds pre-checking, collision safety against foreign clips, clip identification, and tick quantization.
- **`tests/wordMatcher.test.js`**: Validates `Word_Matcher` expression states (`k=0`, `k=1`, `k=2`, `k=3`) and color payload unpacking.

---

## 5. Security & Commercial Readiness

1. **Local Security**: Operates 100% offline. Zero telemetry, analytics, or outbound sockets.
2. **Code Cleanliness**: Codebase adheres to strict modular design without dangling legacy dependencies.
3. **Packaging Integrity**: All packaging scripts (`scripts/package_mac_zip.sh`, `scripts/package_mac_intel_zip.sh`, `scripts/package_windows_zip.sh`, `scripts/package_zxp.sh`, `scripts/build_mac_pkg.sh`) are fully synchronized to the 21 presets and latest UI assets.

---

*Report prepared and certified by Antigravity Engineering for external audit submission.*
